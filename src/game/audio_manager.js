"use strict";
var stub = require("../utils/stub");

var DummyAudioContext = function () {
    this.decodeAudioData = function (data, callback) {
        callback([]);
    };
};

var AudioContext = (function (windowExists) {
    if (!windowExists) {
        return DummyAudioContext;
    }
    var getContext = "window.AudioContext || " +
                     "window.webkitAudioContext || " +
                     "DummyAudioContext";
    return eval(getContext); // jshint ignore: line
})(typeof window !== "undefined");

AudioContext.instance = new AudioContext();

var AudioManager = function () {
    this.activeAudio = {};
    this.globalId = 0;
    this.masterVolumeNode = AudioContext.instance.createGain();
    this.masterVolumeNode.gain.value = 1;
    this.masterVolumeNode.connect(AudioContext.instance.destination);

    Object.defineProperty(this, "masterVolume", {
        get: function () {
            return this.masterVolumeNode.gain.value;
        }.bind(this),
        set: function (value) {
            if (value < 0 || value > 1)
                throw new Error("Volume must be between 0 and 1");
            this.masterVolumeNode.gain.value = value;
        }.bind(this)
    });
};

AudioManager.prototype.init = function (audioLibrary) {
    this.audioLibrary = audioLibrary;
};

AudioManager.prototype.indexer = function (audioName) {
    if (this.audioLibrary[audioName].unique) {
        return audioName;
    }
    return this.globalId++;
};

AudioManager.prototype.play = function (audioName) {
    var audioInfo = this.audioLibrary[audioName];
    if (typeof audioName !== "string") {
        throw new Error("Invalid arguments.");
    }
    if (audioInfo === undefined) {
        throw new Error("No such audio file found: " + audioName);
    }
    var id = this.indexer(audioName);
    if (this.activeAudio[id] !== undefined) {
        return;
    }
    var source = AudioContext.instance.createBufferSource();
    source.buffer = audioInfo.buffer;
    source.loop = audioInfo.loop;
    var lastNode = source;
    if (audioInfo.volume !== 1) {
        var volumeNode = AudioContext.instance.createGain();
        volumeNode.gain.value = audioInfo.volume;
        source.connect(volumeNode);
        lastNode = volumeNode;
    }
    lastNode.connect(this.masterVolumeNode);
    this.activeAudio[id] = source;
    if (!source.loop) {
        // Need a settimeout since source.onended still lacks major support
        clearTimeout(audioInfo.timeoutId);
        audioInfo.timeoutId = setTimeout(function () {
            this.stop(id);
        }.bind(this), source.buffer.duration * 1000);
    }
    source.start();
    return id;
};

AudioManager.prototype.stop = function (id) {
    if (this.activeAudio[id] !== undefined) {
        this.activeAudio[id].stop();
        delete this.activeAudio[id];
    }
};

if (AudioContext === DummyAudioContext) {
    module.exports = stub(AudioManager);
}
else {
    module.exports = AudioManager;
}
global.AudioContext = AudioContext;
