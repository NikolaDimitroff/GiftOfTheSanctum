"use strict";
var express = require("express");
var Loggers = require("./utils/logger");

var app = express();
app.use(express.static(process.cwd()));

var http = require("http");
var network = require("./game/network_manager");

var LobbyNetworker = require("./game/lobby_networker");
var lobbyNetworker = new LobbyNetworker();

var server = http.createServer(app).listen(process.env.PORT || network.port);

var io = require("socket.io").listen(server); // jshint ignore: line

io.sockets.on("connection", function (socket) {
    try {
        lobbyNetworker.start(io, socket);
    }
    catch (e) {
        Loggers.Debug.error("An error occurred: {0}.", e);
        console.log("Press any key to terminate the server.");

        process.stdin.on("readable", function () {
            process.stdin.read();
            process.exit(0);
        });
    }
});

Loggers.Debug.log("Server Running on " + (process.env.PORT || network.port));
