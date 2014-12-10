"use strict";
var Vector = require("./math/vector");

var Platform = function (texture, outsideTexture, description) {
    this.outsideDamage = description.outsideDamage;

    var sides = description.sides;
    var radius = description.radius;

    this.size = new Vector(description.width, description.height);

    this.vertices = this.generateVertices(sides, radius);

    this.radius = radius;
    this.texture = texture;
    this.outsideTexture = outsideTexture;
    this.lastCollapse = 0;
    this.collapseIterationsLeft = description.collapseIterations;
    this.collapseInterval = description.collapseInterval;
    this.collapseRadiusReduction = radius / description.collapseIterations;
    this.width = description.width;
    this.height = description.height;
};


Platform.prototype.update = function (dt) {
    this.lastCollapse += dt;
    if (this.collapseIterationsLeft &&
        this.lastCollapse >= this.collapseInterval) {

        this.radius -= this.collapseRadiusReduction;
        this.vertices = this.generateVertices(this.vertices.length,
                                              this.radius);
        this.collapseIterationsLeft--;
        this.lastCollapse = 0;
    }
};

Platform.prototype.generateVertices = function (sides, radius) {
    var vertices = [];
    for (var i = 0; i < sides; i++) {
        var angle = Math.PI / 10 + i * 2 * Math.PI / sides;
        var nextVertex = new Vector(radius * Math.cos(angle),
                                    radius * Math.sin(angle));
        vertices.push(nextVertex);
    }

    return vertices;
};

module.exports = Platform;