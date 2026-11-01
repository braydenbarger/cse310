%% SpinRoom application callback: starts the supervision tree and the web server.
-module(spinroom_app).
-behaviour(application).

-export([start/2, stop/1]).

start(_Type, _Args) ->
    {ok, Sup} = spinroom_sup:start_link(),
    {ok, Port} = application:get_env(spinroom, port),
    {ok, Httpd} = spinroom_web:start(Port),
    io:format("SpinRoom listening on http://localhost:~p~n", [Port]),
    {ok, Sup, Httpd}.

stop(Httpd) ->
    inets:stop(httpd, Httpd),
    ok.
