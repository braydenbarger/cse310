-module(spinroom_web).

-export([start/1, do/1]).

-include_lib("inets/include/httpd.hrl").

start(Port) ->
    Priv = code:priv_dir(spinroom),
    inets:start(httpd, [
        {port, Port},
        {server_name, "spinroom"},
        {server_root, Priv},
        {document_root, filename:join(Priv, "www")},
        {bind_address, any},
        {modules, [?MODULE]}
    ]).

do(#mod{method = Method, request_uri = Uri, entity_body = Body}) ->
    Parsed = uri_string:parse(Uri),
    Path = string:lexemes(uri_string:percent_decode(maps:get(path, Parsed, "/")), "/"),
    Query = case maps:get(query, Parsed, "") of
                "" -> #{};
                Q -> maps:from_list(uri_string:dissect_query(Q))
            end,
    {Code, Type, Payload} =
        try
            route(Method, Path, Query, Body)
        catch
            throw:{bad_request, Msg} -> json(400, #{error => Msg});
            Class:Reason:Stack ->
                logger:error("spinroom request failed: ~p:~p ~p", [Class, Reason, Stack]),
                json(500, #{error => <<"Internal server error">>})
        end,
    Bin = iolist_to_binary(Payload),
    Head = [{code, Code},
            {content_type, Type},
            {content_length, integer_to_list(byte_size(Bin))},
            {cache_control, "no-store"}],
    {proceed, [{response, {response, Head, binary_to_list(Bin)}}]}.

route("GET", [], _Q, _Body) ->
    static("index.html", "text/html; charset=utf-8");
route("GET", ["api", "rooms"], _Q, _Body) ->
    json(200, #{rooms => spinroom_room:list()});
route("GET", ["api", "rooms", Room], Q, _Body) ->
    reply(spinroom_room:snapshot(room(Room), user(maps:get("user", Q, ""))));
route("POST", ["api", "rooms", Room, Action], _Q, Body) ->
    Args = decode_body(Body),
    R = room(Room),
    U = user(maps:get(<<"user">>, Args, <<>>)),
    reply(case Action of
              "join"  -> spinroom_room:join(R, U);
              "leave" -> spinroom_room:leave(R, U);
              "queue" -> spinroom_room:enqueue(R, U, Args);
              "rate"  -> spinroom_room:rate(R, U, maps:get(<<"score">>, Args, null));
              "react" -> spinroom_room:react(R, U, maps:get(<<"emoji">>, Args, null));
              "skip"  -> spinroom_room:vote_skip(R, U);
              _ -> throw({bad_request, <<"Unknown action">>})
          end);
route("GET", ["api", "history"], Q, _Body) ->
    Room = case maps:get("room", Q, "") of
               "" -> all;
               R -> room(R)
           end,
    Limit = try list_to_integer(maps:get("limit", Q, "50")) catch _:_ -> 50 end,
    json(200, #{history => spinroom_log:history(Room, max(1, min(Limit, 500)))});
route(_Method, _Path, _Q, _Body) ->
    json(404, #{error => <<"Not found">>}).

reply({ok, View}) -> json(200, View);
reply({error, Msg}) -> json(400, #{error => Msg}).

json(Code, Term) ->
    {Code, "application/json; charset=utf-8", json:encode(Term)}.

static(File, Type) ->
    Path = filename:join([code:priv_dir(spinroom), "www", File]),
    {ok, Data} = file:read_file(Path),
    {200, Type, Data}.

decode_body(Body) ->
    try json:decode(list_to_binary(Body)) of
        Map when is_map(Map) -> Map;
        _ -> throw({bad_request, <<"Expected a JSON object">>})
    catch
        throw:T -> throw(T);
        _:_ -> throw({bad_request, <<"Invalid JSON">>})
    end.

room(Name) ->
    Bin = string:lowercase(unicode:characters_to_binary(Name)),
    case re:run(Bin, "^[a-z0-9_-]{1,32}$") of
        {match, _} -> Bin;
        nomatch -> throw({bad_request, <<"Room names may only use letters, numbers, - and _ (max 32)">>})
    end.

user(Name) when is_list(Name) ->
    user(unicode:characters_to_binary(Name));
user(Name) when is_binary(Name) ->
    case string:trim(Name) of
        <<>> -> throw({bad_request, <<"A user name is required">>});
        Trimmed when byte_size(Trimmed) > 64 -> throw({bad_request, <<"User name is too long">>});
        Trimmed -> Trimmed
    end;
user(_) ->
    throw({bad_request, <<"A user name is required">>}).
