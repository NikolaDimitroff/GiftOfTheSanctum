"use strict";
var GameState = require("./enums").GameState;
var Loggers = require("../utils/logger.js");
var LoadingScreen = require("./loading_screen");
var SanctumEvent = require("../utils/sanctum_event");

var AVATAR_IMAGES = [
    "archer.png", "knight.png", "mage.png", "monk.png",
     "necro.png", "orc.png", "queen.png", "rogue.png"
];

var UIManager = function (viewmodel, gameEvents) {
    // Ko.computed are evaluated when their depedencies change but since our
    // scores work differently they won't fire unless we force them
    this.reevaluator = ko.observable();

    this.viewmodel = viewmodel;

    this.events = {
        nextRound: new SanctumEvent(),
        exitGame: new SanctumEvent()
    };
    this.gameEvents = gameEvents;

    this.viewmodel.isGameStarted = ko.observable(false);
};

UIManager.prototype.showLoadingScreen = function (characters,
                                                  playerCharacterIndex,
                                                  background,
                                                  loadingProgress) {

    var loadingSection = document.querySelector("#loading-screen canvas");
    this.loadingScreen = new LoadingScreen(characters,
                                           playerCharacterIndex,
                                           background,
                                           loadingProgress,
                                           loadingSection);
};

UIManager.prototype.init = function (model) {
    this.model = model;
    this.viewmodel.messages = [];
    var maxMessages = Loggers.Gameplay.MAXIMUM_NUMBER_OF_MESSAGES;
    var messageFunction = function (i) {
        this.reevaluator();
        return Loggers.Gameplay.messages[i];
    };
    for (var i = 0; i < maxMessages; i++) {
        var boundMessageFunction = messageFunction.bind(this, i);
        this.viewmodel.messages[i] = ko.computed(boundMessageFunction);
    }

    // Add whatever else the viewmodel needs
    var players = this.viewmodel.players();
    var scoreUpdate = function (i) {
        this.reevaluator();
        return this.model.characters[i].score;
    };
    var healthUpdate = function (i) {
        this.reevaluator();
        var hp = this.model.characters[i].health /
                 this.model.characters[i].startingHealth;
        return hp * 100;
    };
    for (i = 0; i < players.length; i++) {
        players[i].score = ko.computed(scoreUpdate.bind(this, i));
        players[i].healthPercentage = ko.computed(healthUpdate.bind(this, i));
    }
    this.viewmodel.scoreboardAvatars = AVATAR_IMAGES.map(function (path) {
        return "content/art/characters/scoreboard/" + path;
    });
    this.viewmodel.boundSpells = [];
    for (i = 0; i < 6; /* Magic */ i++) {
        this.viewmodel.boundSpells[i] = this.getSpellDatabinding(i);
    }
    this.viewmodel.showScoreboard = ko.observable(false);
    this.viewmodel.canStartNextRound = ko.computed(function () {
        this.reevaluator();
        return this.viewmodel.isHost() &&
               this.model.state === GameState.midround;
    }.bind(this));

    this.viewmodel.latency = ko.computed(function () {
        this.reevaluator();
        return "Latency: " + this.model.latency + " ms";
    }.bind(this));

    this.viewmodel.isGameMidround = ko.computed(function () {
        this.reevaluator();
        return this.model.state === GameState.midround;
    }.bind(this));

    this.viewmodel.isGameOver = ko.computed(function () {
        this.reevaluator();
        return this.model.state === GameState.gameover;
    }.bind(this));

    this.viewmodel.health = ko.computed(function () {
        this.reevaluator();
        return Math.max(0,
                        this.model.characters[this.model.playerIndex].health);
    }.bind(this));

    this.viewmodel.healthPercentage = ko.computed(function () {
        this.reevaluator();
        return 100 * this.model.characters[this.model.playerIndex].health /
        this.model.characters[this.model.playerIndex].startingHealth;
    }.bind(this));

    this.viewmodel.isGameStarted(true);
    this.loadingScreen.destroy();
    var canvas = document.querySelector("#loading-screen canvas");
    canvas.parentNode.removeChild(canvas);
    this.loadingScreen = null;

    // Rebind
    var gameUI = document.getElementById("game-ui");
    ko.applyBindings(this.viewmodel, gameUI);
    // Disable right-clicking the game ui
    gameUI.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    }, false);

    var roundOverHanlder = function () {
        this.update();
        this.toggleScoreboard();
    }.bind(this);

    this.gameEvents.roundOver.addEventListener(roundOverHanlder);
    this.gameEvents.gameOver.addEventListener(roundOverHanlder);

    this.bindUI();
};

UIManager.prototype.getSpellDatabinding = function (i) {
    return {
        name: ko.computed(function () {
            this.reevaluator();
            return this.model.boundSpells[i];
        }.bind(this)),
        key: ko.computed(function () {
            this.reevaluator();
            return this.model.keybindings["spellcast" + i];
        }.bind(this)),
        icon: ko.computed(function () {
            this.reevaluator();
            return "url(" +
                   this.model.getSpellIcon(this.model.boundSpells[i]) +
                   ")";
        }.bind(this)),
        description: ko.computed(function () {
            this.reevaluator();
            var spellName = this.model.boundSpells[i];
            return this.model.getSpellDescription(spellName);
        }.bind(this, i)),
        damage: ko.computed(function () {
            this.reevaluator();
            return this.model.getSpellDamage(this.model.boundSpells[i]);
        }.bind(this)),
        cooldown: ko.computed(function () {
            this.reevaluator();
            var spellName = this.model.boundSpells[i];
            return this.model.getSpellCooldown(spellName) / 1000;
        }.bind(this)),
        remainingCooldown: ko.computed(function () {
            this.reevaluator();
            var spellName = this.model.boundSpells[i];
            return this.model.getSpellRemainingCooldown(spellName);
        }.bind(this)),
        cooldownPercentage: ko.computed(function () {
            this.reevaluator();
            var spellName = this.model.boundSpells[i];
            return this.model.getSpellCoolingPercentage(spellName);
        }.bind(this))
    };
};

UIManager.prototype.bindUI = function () {
    document.getElementById("next-round-button")
    .addEventListener("click", function () {
        if (this.viewmodel.canStartNextRound()) {
            this.events.nextRound.fire(this);
        }
    }.bind(this));

    document.getElementById("exit-game-button")
    .addEventListener("click", function () {
        this.events.exitGame.fire(this);
    }.bind(this));
};

UIManager.prototype.update = function () {
    this.viewmodel.players.sort(function (p1, p2) {
        return p1.score - p2.score;
    });
    // Force update
    this.reevaluator.notifySubscribers();
};

UIManager.prototype.toggleScoreboard = function () {
    this.viewmodel.showScoreboard(!this.viewmodel.showScoreboard());
};

module.exports = UIManager;
