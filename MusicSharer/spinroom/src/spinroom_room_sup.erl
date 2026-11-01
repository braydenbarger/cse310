%% Dynamic supervisor: one spinroom_room process per room, created on demand.
-module(spinroom_room_sup).
-behaviour(supervisor).

-export([start_link/0, start_room/1, init/1]).

start_link() ->
    supervisor:start_link({local, ?MODULE}, ?MODULE, []).

start_room(Room) ->
    supervisor:start_child(?MODULE, [Room]).

init([]) ->
    ChildSpec = #{id => spinroom_room,
                  start => {spinroom_room, start_link, []},
                  restart => transient},
    {ok, {#{strategy => simple_one_for_one, intensity => 10, period => 10}, [ChildSpec]}}.
