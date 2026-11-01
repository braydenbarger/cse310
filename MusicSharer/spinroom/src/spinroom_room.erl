-module(spinroom_room).
-behaviour(gen_server).

-export([start_link/1, ensure/1, list/0,
         join/2, leave/2, enqueue/3, rate/3, react/3, vote_skip/2, snapshot/2]).
-export([init/1, handle_call/3, handle_cast/2, handle_info/2]).

-define(MEMBER_TIMEOUT_MS, 20000).
-define(PRUNE_INTERVAL_MS, 5000).
-define(MAX_QUEUE, 200).
-define(DEFAULT_DURATION_S, 210).
-define(MAX_DURATION_S, 3600).

-record(st, {
    room            :: binary(),
    members = #{}   :: #{binary() => integer()},
    queue = []      :: [map()],
    current         :: map() | undefined,
    timer           :: reference() | undefined,
    next_id = 1     :: pos_integer()
}).

start_link(Room) ->
    gen_server:start_link(via(Room), ?MODULE, Room, []).

ensure(Room) ->
    case global:whereis_name(name(Room)) of
        undefined ->
            case spinroom_room_sup:start_room(Room) of
                {ok, _} -> ok;
                {error, {already_started, _}} -> ok;
                Error -> Error
            end;
        _Pid ->
            ok
    end.

list() ->
    lists:sort([Room || {?MODULE, Room} <- global:registered_names()]).

join(Room, User)          -> call(Room, {join, User}).
leave(Room, User)         -> call(Room, {leave, User}).
enqueue(Room, User, Song) -> call(Room, {enqueue, User, Song}).
rate(Room, User, Score)   -> call(Room, {rate, User, Score}).
react(Room, User, Emoji)  -> call(Room, {react, User, Emoji}).
vote_skip(Room, User)     -> call(Room, {skip, User}).
snapshot(Room, User)      -> call(Room, {snapshot, User}).

name(Room) -> {?MODULE, Room}.
via(Room) -> {via, global, name(Room)}.

call(Room, Msg) ->
    ok = ensure(Room),
    gen_server:call(via(Room), Msg).

init(Room) ->
    erlang:send_after(?PRUNE_INTERVAL_MS, self(), prune),
    {ok, #st{room = Room}}.

handle_call({leave, User}, _From, St0) ->
    St1 = St0#st{members = maps:remove(User, St0#st.members)},
    St = check_skip(drop_absent_votes(St1)),
    {reply, {ok, view(St, User)}, St};
handle_call(Msg, _From, St0) ->
    User = element(2, Msg),
    St1 = touch(User, St0),
    case handle(Msg, St1) of
        {ok, St} -> {reply, {ok, view(St, User)}, St};
        {error, Reason} -> {reply, {error, Reason}, St1}
    end.

handle_cast(_Msg, St) ->
    {noreply, St}.

handle_info({track_end, Id}, St = #st{current = #{id := Id}}) ->
    {noreply, end_track(finished, St)};
handle_info({track_end, _StaleId}, St) ->
    {noreply, St};
handle_info(prune, St0) ->
    erlang:send_after(?PRUNE_INTERVAL_MS, self(), prune),
    Cutoff = now_ms() - ?MEMBER_TIMEOUT_MS,
    Members = maps:filter(fun(_U, Seen) -> Seen >= Cutoff end, St0#st.members),
    {noreply, check_skip(drop_absent_votes(St0#st{members = Members}))};
handle_info(_Msg, St) ->
    {noreply, St}.

handle({join, _User}, St) ->
    {ok, St};
handle({snapshot, _User}, St) ->
    {ok, St};
handle({enqueue, _User, _Song}, #st{queue = Q}) when length(Q) >= ?MAX_QUEUE ->
    {error, <<"The queue is full">>};
handle({enqueue, User, Song}, St = #st{queue = Q, next_id = Id}) ->
    case validate_song(Song) of
        {ok, Track0} ->
            Track = Track0#{id => Id, added_by => User},
            St1 = St#st{queue = Q ++ [Track], next_id = Id + 1},
            case St1#st.current of
                undefined -> {ok, start_next(St1)};
                _ -> {ok, St1}
            end;
        Error ->
            Error
    end;
handle({rate, _User, _Score}, #st{current = undefined}) ->
    {error, <<"Nothing is playing">>};
handle({rate, User, Score}, St = #st{current = Cur = #{ratings := R}})
  when is_integer(Score), Score >= 1, Score =< 10 ->
    {ok, St#st{current = Cur#{ratings := R#{User => Score}}}};
handle({rate, _User, _Score}, _St) ->
    {error, <<"Rating must be a whole number from 1 to 10">>};
handle({react, _User, _Emoji}, #st{current = undefined}) ->
    {error, <<"Nothing is playing">>};
handle({react, User, Emoji}, St = #st{current = Cur = #{reactions := Rx}})
  when is_binary(Emoji), byte_size(Emoji) > 0, byte_size(Emoji) =< 32 ->
    Users = maps:get(Emoji, Rx, []),
    Rx1 = case lists:member(User, Users) of
              true when Users =:= [User] -> maps:remove(Emoji, Rx);
              true -> Rx#{Emoji := lists:delete(User, Users)};
              false -> Rx#{Emoji => Users ++ [User]}
          end,
    {ok, St#st{current = Cur#{reactions := Rx1}}};
handle({react, _User, _Emoji}, _St) ->
    {error, <<"Invalid reaction">>};
handle({skip, _User}, #st{current = undefined}) ->
    {error, <<"Nothing is playing">>};
handle({skip, User}, St = #st{current = Cur = #{skips := Skips}}) ->
    case lists:member(User, Skips) of
        true -> {ok, St};
        false -> {ok, check_skip(St#st{current = Cur#{skips := [User | Skips]}})}
    end.

start_next(St = #st{queue = []}) ->
    St#st{current = undefined, timer = undefined};
start_next(St = #st{queue = [Track | Rest]}) ->
    #{id := Id, duration := DurationS} = Track,
    Timer = erlang:send_after(DurationS * 1000, self(), {track_end, Id}),
    Current = Track#{started_at => now_ms(), ratings => #{}, reactions => #{}, skips => []},
    St#st{queue = Rest, current = Current, timer = Timer}.

end_track(_Outcome, St = #st{current = undefined}) ->
    St;
end_track(Outcome, St = #st{current = Cur, timer = Timer}) ->
    _ = is_reference(Timer) andalso erlang:cancel_timer(Timer),
    spinroom_log:record(history_entry(Outcome, Cur, St)),
    start_next(St#st{current = undefined, timer = undefined}).

check_skip(St = #st{current = #{skips := Skips}, members = Members}) ->
    case length(Skips) * 2 > map_size(Members) of
        true -> end_track(skipped, St);
        false -> St
    end;
check_skip(St) ->
    St.

drop_absent_votes(St = #st{current = Cur = #{skips := Skips}, members = Members}) ->
    St#st{current = Cur#{skips := [U || U <- Skips, maps:is_key(U, Members)]}};
drop_absent_votes(St) ->
    St.

skips_needed(Members) ->
    map_size(Members) div 2 + 1.

touch(User, St = #st{members = M}) ->
    St#st{members = M#{User => now_ms()}}.

now_ms() ->
    erlang:system_time(millisecond).

validate_song(Song) when is_map(Song) ->
    Title = trim(maps:get(<<"title">>, Song, <<>>)),
    Artist = trim(maps:get(<<"artist">>, Song, <<>>)),
    Url = trim(maps:get(<<"url">>, Song, <<>>)),
    Duration = maps:get(<<"duration">>, Song, ?DEFAULT_DURATION_S),
    if
        Title =:= <<>> ->
            {error, <<"A song needs a title">>};
        byte_size(Title) > 200; byte_size(Artist) > 200; byte_size(Url) > 500 ->
            {error, <<"Song details are too long">>};
        not is_integer(Duration); Duration < 1; Duration > ?MAX_DURATION_S ->
            {error, <<"Duration must be between 1 second and 60 minutes">>};
        true ->
            case valid_url(Url) of
                true -> {ok, #{title => Title, artist => Artist, url => Url, duration => Duration}};
                false -> {error, <<"Links must start with http:// or https://">>}
            end
    end;
validate_song(_) ->
    {error, <<"Invalid song">>}.

valid_url(<<>>) -> true;
valid_url(<<"https://", _/binary>>) -> true;
valid_url(<<"http://", _/binary>>) -> true;
valid_url(_) -> false.

trim(Bin) when is_binary(Bin) -> string:trim(Bin);
trim(_) -> <<>>.

average(Ratings) when map_size(Ratings) =:= 0 ->
    null;
average(Ratings) ->
    Scores = maps:values(Ratings),
    round(lists:sum(Scores) / length(Scores) * 10) / 10.

reaction_counts(Rx) ->
    maps:map(fun(_Emoji, Users) -> length(Users) end, Rx).

history_entry(Outcome, Cur, #st{room = Room, members = Members}) ->
    #{started_at := Started, ratings := Ratings, reactions := Rx, skips := Skips} = Cur,
    Now = now_ms(),
    #{room => Room,
      title => maps:get(title, Cur),
      artist => maps:get(artist, Cur),
      url => maps:get(url, Cur),
      added_by => maps:get(added_by, Cur),
      duration => maps:get(duration, Cur),
      started_at => Started,
      ended_at => Now,
      listened_s => (Now - Started) div 1000,
      outcome => Outcome,
      avg_rating => average(Ratings),
      ratings => Ratings,
      reactions => reaction_counts(Rx),
      skip_votes => length(Skips),
      listeners => lists:sort(maps:keys(Members))}.

view(St = #st{room = Room, members = Members, queue = Q}, User) ->
    #{room => Room,
      you => User,
      server_time => now_ms(),
      members => lists:sort(maps:keys(Members)),
      now_playing => now_playing(St, User),
      queue => [public_track(T) || T <- Q]}.

now_playing(#st{current = undefined}, _User) ->
    null;
now_playing(#st{current = Cur, members = Members}, User) ->
    #{ratings := Ratings, reactions := Rx, skips := Skips} = Cur,
    (public_track(Cur))#{
        started_at => maps:get(started_at, Cur),
        avg_rating => average(Ratings),
        rating_count => map_size(Ratings),
        your_rating => maps:get(User, Ratings, null),
        reactions => [#{emoji => E, count => length(Us), mine => lists:member(User, Us)}
                      || {E, Us} <- lists:sort(maps:to_list(Rx))],
        skip_votes => length(Skips),
        skips_needed => skips_needed(Members),
        you_voted_skip => lists:member(User, Skips)}.

public_track(T) ->
    maps:with([id, title, artist, url, duration, added_by], T).
