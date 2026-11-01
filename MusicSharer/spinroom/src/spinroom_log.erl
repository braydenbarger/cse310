-module(spinroom_log).
-behaviour(gen_server).

-export([start_link/0, record/1, history/2]).
-export([init/1, handle_call/3, handle_cast/2, terminate/2]).

start_link() ->
    gen_server:start_link({local, ?MODULE}, ?MODULE, [], []).

record(Entry) ->
    gen_server:cast(?MODULE, {record, Entry}).

%% Most recent entries first. Room is a room name or `all`.
history(Room, Limit) ->
    gen_server:call(?MODULE, {history, Room, Limit}).

init([]) ->
    {ok, Path} = application:get_env(spinroom, history_file),
    ok = filelib:ensure_dir(Path),
    {ok, Fd} = file:open(Path, [append, binary]),
    {ok, #{path => Path, fd => Fd}}.

handle_call({history, Room, Limit}, _From, St = #{path := Path}) ->
    Entries = case file:read_file(Path) of
                  {ok, Data} -> decode_lines(Data);
                  {error, _} -> []
              end,
    Matching = [E || E <- Entries, Room =:= all orelse maps:get(<<"room">>, E, undefined) =:= Room],
    {reply, lists:sublist(lists:reverse(Matching), Limit), St}.

handle_cast({record, Entry}, St = #{fd := Fd}) ->
    ok = file:write(Fd, [json:encode(Entry), $\n]),
    {noreply, St}.

terminate(_Reason, #{fd := Fd}) ->
    file:close(Fd).

decode_lines(Data) ->
    lists:filtermap(
        fun(<<>>) -> false;
           (Line) ->
                try {true, json:decode(Line)}
                catch _:_ -> false
                end
        end,
        binary:split(Data, <<"\n">>, [global])).
