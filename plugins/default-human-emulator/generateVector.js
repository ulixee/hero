"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generateVector;
const Bezier_1 = require("./Bezier");
function generateVector(startPoint, destinationPoint, targetWidth, minPoints, maxPoints, overshoot) {
    const shouldOvershoot = magnitude(direction(startPoint, destinationPoint)) > overshoot.threshold;
    const firstTargetPoint = shouldOvershoot
        ? getOvershootPoint(destinationPoint, overshoot.radius)
        : destinationPoint;
    const points = path(startPoint, firstTargetPoint, Math.max(targetWidth, 100), minPoints, maxPoints);
    if (shouldOvershoot) {
        const correction = path(firstTargetPoint, destinationPoint, targetWidth, minPoints, maxPoints, overshoot.spread);
        points.push(...correction);
    }
    return points.map(point => {
        return { x: Math.round(point.x * 10) / 10, y: Math.round(point.y * 10) / 10 };
    });
}
function path(start, finish, targetWidth, minPoints, maxPoints, spreadOverride) {
    if (!targetWidth || Number.isNaN(targetWidth))
        targetWidth = 1;
    let spread = spreadOverride;
    if (!spread) {
        const vec = direction(start, finish);
        spread = Math.min(magnitude(vec), 200);
    }
    const anchors = generateBezierAnchors(start, finish, spread);
    const curve = new Bezier_1.default(start, ...anchors, finish);
    const length = curve.length() * 0.8;
    const baseTime = Math.random() * minPoints;
    let steps = Math.ceil((Math.log2(fitts(length, targetWidth) + 1) + baseTime) * 3);
    if (Number.isNaN(steps))
        steps = minPoints;
    if (steps > maxPoints)
        steps = maxPoints;
    return curve
        .getLookupTable(steps)
        .map(vector => ({
        x: vector.x,
        y: vector.y,
    }))
        .filter(({ x, y }) => !Number.isNaN(x) && !Number.isNaN(y));
}
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const div = (a, b) => ({ x: a.x / b, y: a.y / b });
const mult = (a, b) => ({ x: a.x * b, y: a.y * b });
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
function randomVectorOnLine(a, b) {
    const vec = direction(a, b);
    const multiplier = Math.random();
    return add(a, mult(vec, multiplier));
}
function randomNormalLine(a, b, range) {
    const randMid = randomVectorOnLine(a, b);
    const normalV = setMagnitude(perpendicular(direction(a, randMid)), range);
    return [randMid, normalV];
}
function generateBezierAnchors(a, b, spread) {
    const side = Math.round(Math.random()) === 1 ? 1 : -1;
    const calc = () => {
        const [randMid, normalV] = randomNormalLine(a, b, spread);
        const choice = mult(normalV, side);
        return randomVectorOnLine(randMid, add(randMid, choice));
    };
    return [calc(), calc()].sort((sortA, sortB) => sortA.x - sortB.x);
}
function getOvershootPoint(coordinate, radius) {
    const a = Math.random() * 2 * Math.PI;
    const rad = radius * Math.sqrt(Math.random());
    const vector = { x: rad * Math.cos(a), y: rad * Math.sin(a) };
    return add(coordinate, vector);
}
/**
 * Calculate the amount of time needed to move from (x1, y1) to (x2, y2)
 * given the width of the element being clicked on
 * https://en.wikipedia.org/wiki/Fitts%27s_law
 */
function fitts(distance, width) {
    return 2 * Math.log2(distance / width + 1);
}
function direction(a, b) {
    return sub(b, a);
}
function perpendicular(a) {
    return { x: a.y, y: -1 * a.x };
}
function magnitude(a) {
    return Math.sqrt(a.x ** 2 + a.y ** 2);
}
function unit(a) {
    return div(a, magnitude(a));
}
function setMagnitude(a, amount) {
    return mult(unit(a), amount);
}
//# sourceMappingURL=generateVector.js.map