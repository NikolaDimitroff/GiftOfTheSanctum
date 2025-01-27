"use strict";
/* jshint expr: true */
var Vector = require("../../src/game/math/vector");
var PhysicsManager = require("../../src/game/physics_manager");
var should = require("chai").should(); // jshint ignore: line

function GameObjectStub(x, y, width, height) {
    this.position = new Vector(x, y);
    this.size = new Vector(width, height);
    this.collisionRadius = Math.max(width, height);
}

GameObjectStub.prototype.getCenter = function () {
    return this.position.add(this.size.divide(2));
};

describe("PhysicsManager", function () {
    var data = {};
    before(function () {
        var hero = new GameObjectStub(-100, 100, 64, 64),
            spell = new GameObjectStub(-80, 80, 32, 32);

        var objects = [hero, spell];

        data = {
            hero: hero,
            spell: spell,
            objects: objects,
        };
    });
    it("#getObjectsWithinRadius", function () {
        var physics = new PhysicsManager();
        var objects = data.objects,
            position = data.hero.position,
            collisionRadius = data.hero.collisionRadius;
        physics.getObjectsWithinRadius(objects, position, collisionRadius)
       .should.have.length(2).and
       .include(data.hero).and
       .include(data.spell);


        physics.getObjectsWithinRadius(objects, Vector.zero, collisionRadius)
       .should.have.length(0).and
       .not.include(data.hero).and
       .not.include(data.spell);

        physics.getObjectsWithinRadius(objects, data.hero.position, 1)
       .should.have.length(1).and
       .include(data.hero).and
       .not.include(data.spell);

    });
});
