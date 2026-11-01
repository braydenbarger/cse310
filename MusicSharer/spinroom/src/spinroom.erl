-module(spinroom).

-export([start/0, rooms/0, join/2, leave/2, queue/5, rate/3, react/3, skip/2,
         state/2, history/1]).

start() ->
    application:ensure_all_started(spinroom).

rooms() -> spinroom_room:list().

join(Room, User) -> spinroom_room:join(Room, User).
leave(Room, User) -> spinroom_room:leave(Room, User).

queue(Room, User, Title, Artist, DurationSeconds) ->
    spinroom_room:enqueue(Room, User, #{<<"title">> => Title,
                                        <<"artist">> => Artist,
                                        <<"duration">> => DurationSeconds}).

rate(Room, User, Score) -> spinroom_room:rate(Room, User, Score).
react(Room, User, Emoji) -> spinroom_room:react(Room, User, Emoji).
skip(Room, User) -> spinroom_room:vote_skip(Room, User).
state(Room, User) -> spinroom_room:snapshot(Room, User).

history(Room) -> spinroom_log:history(Room, 50).
