"use strict";
var Vector = require("./math/vector");
var nowUTC = require("../utils/general_utils").nowUTC;

var PredictionManager = function (characters, network) {
    this.characters = characters;
    this.network = network;
    this.inputSequence = 0;
    this.lastProcessedInput = null;
    this.lastProcessedInputNumber = 0;
    this.inputs = [];

    // @ifdef PLATFORM_SERVER
    this.cleanupSocketListeners();
    // @endif

    this.network.socket.on("input-verification",
                            this.handleInputVerification.bind(this));
};

PredictionManager.prototype.addInput = function (data) {
    var input = {
        data: data,
        sequenceNumber: this.inputSequence++
    };

    this.inputs.push(input);
};

PredictionManager.prototype.getLastProcessedInput = function () {
    return this.lastProcessedInput;
};

PredictionManager.prototype.getInputs = function () {
    return this.inputs;
};

PredictionManager.prototype.verifyInput = function (input, playerIndex) {
    var player = this.characters[playerIndex];
    var newPosition = new Vector(input.position.x, input.position.y);
    if (newPosition.subtract(player.position).length() < 90) { // Magic
        this.network.sendVerifiedInput(player.id,
                                       playerIndex,
                                       input.inputSequenceNumber);
    } else {
        input.position = player.position;
        input.velocity = player.velocity;
        this.network.sendVerifiedInput(player.id,
                                       playerIndex,
                                       -1,
                                       player.position);
    }
};

PredictionManager.prototype.handleInputVerification = function (data) {
    if (data.sequenceNumber === -1) {
        this.characters[data.playerIndex].position.set(data.recoveryPosition);
        this.inputs = [];

        return;
    }

    this.lastProcessedInputNumber = data.sequenceNumber;

    this.inputs = this.inputs.filter(function (item) {
        if (item == data.sequenceNumber) {
            this.lastProcessedInput = item;
        }
        return item.sequenceNumber > data.sequenceNumber;
    });
};

PredictionManager.prototype.replayInputs = function (player, input) {
    if (input.data) {
        this.position.set(input.data);
    }
};

PredictionManager.prototype.predictPlayerMovement = function (player,
                                                              event,
                                                              playerIndex) {
    if (event.data.id == playerIndex) {
        var lastVerifiedInput =
            this.getLastProcessedInput();
        var inputs = this.getInputs();
        if (lastVerifiedInput) {
            player.position.set(lastVerifiedInput);
        }
        inputs.forEach(this.replayInputs.bind(player));
    } else {

        var oldDest = player.destination,
            newDest = event.data.destination;
        var isDestDifferent = !oldDest || !newDest || !oldDest.equals(newDest);

        var timeDelta = nowUTC() - event.data.timestamp;
        var isPacketNew = timeDelta < 600; // Magic
        var isPacketTooOld = timeDelta > 3000; // Magic

        var distance = player.position.distanceTo(event.data.position);
        var isClose = distance < 90; // Magic
        var isVeryFar = distance > 200; // Magic

        if ((isPacketTooOld) ||
            (isPacketNew && !isClose && isDestDifferent) ||
            (isPacketNew && isVeryFar)) {

            player.position.set(event.data.position);
        }
    }
};

PredictionManager.prototype.cleanupSocketListeners = function () {
    this.network.socket.removeAllListeners("input-verification");
};

module.exports = PredictionManager;
