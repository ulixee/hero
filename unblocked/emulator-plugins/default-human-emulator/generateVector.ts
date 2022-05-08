import IPoint from '@unblocked/emulator-spec/browser/IPoint';
import Bezier from './Bezier';

export default function generateVector(
  startPoint: IPoint,
  destinationPoint: IPoint,
  targetWidth: number,
  minPoints: number,
  maxPoints: number,
  overshoot: { threshold: number; radius: number; spread: number },
): IPoint[] {
  const shouldOvershoot = magnitude(direction(startPoint, destinationPoint)) > overshoot.threshold;

  const firstTargetPoint = shouldOvershoot
    ? getOvershootPoint(destinationPoint, overshoot.radius)
    : destinationPoint;
  const points = path(
    startPoint,
    firstTargetPoint,
    Math.max(targetWidth, 100),
    minPoints,
    maxPoints,
  );

  if (shouldOvershoot) {
    const correction = path(
      firstTargetPoint,
      destinationPoint,
      targetWidth,
      minPoints,
      maxPoints,
      overshoot.spread,
    );
    points.push(...correction);
  }
  return points.map(point => {
    return { x: Math.round(point.x * 10) / 10, y: Math.round(point.y * 10) / 10 };
  });
}

function path(
  start: IPoint,
  finish: IPoint,
  targetWidth: number,
  minPoints: number,
  maxPoints: number,
  spreadOverride?: number,
): IPoint[] {
  if (!targetWidth || Number.isNaN(targetWidth)) targetWidth = 1;

  let spread = spreadOverride;
  if (!spread) {
    const vec = direction(start, finish);
    spread = Math.min(magnitude(vec), 200);
  }
  const anchors = generateBezierAnchors(start, finish, spread);

  const curve = new Bezier(start, ...anchors, finish);
  const length = curve.length() * 0.8;
  const baseTime = Math.random() * minPoints;
  let steps = Math.ceil((Math.log2(fitts(length, targetWidth) + 1) + baseTime) * 3);
  if (Number.isNaN(steps)) steps = minPoints;
  if (steps > maxPoints) steps = maxPoints;

  return curve
    .getLookupTable(steps)
    .map(vector => ({
      x: vector.x,
      y: vector.y,
    }))
    .filter(({ x, y }) => !Number.isNaN(x) && !Number.isNaN(y));
}

const sub = (a: IPoint, b: IPoint): IPoint => ({ x: a.x - b.x, y: a.y - b.y });
const div = (a: IPoint, b: number): IPoint => ({ x: a.x / b, y: a.y / b });
const mult = (a: IPoint, b: number): IPoint => ({ x: a.x * b, y: a.y * b });
const add = (a: IPoint, b: IPoint): IPoint => ({ x: a.x + b.x, y: a.y + b.y });

function randomVectorOnLine(a: IPoint, b: IPoint): IPoint {
  const vec = direction(a, b);
  const multiplier = Math.random();
  return add(a, mult(vec, multiplier));
}

function randomNormalLine(a: IPoint, b: IPoint, range: number): IPoint[] {
  const randMid = randomVectorOnLine(a, b);
  const normalV = setMagnitude(perpendicular(direction(a, randMid)), range);
  return [randMid, normalV];
}

function generateBezierAnchors(a: IPoint, b: IPoint, spread: number): IPoint[] {
  const side = Math.round(Math.random()) === 1 ? 1 : -1;
  const calc = (): IPoint => {
    const [randMid, normalV] = randomNormalLine(a, b, spread);
    const choice = mult(normalV, side);
    return randomVectorOnLine(randMid, add(randMid, choice));
  };
  return [calc(), calc()].sort((sortA, sortB) => sortA.x - sortB.x);
}

function getOvershootPoint(coordinate: IPoint, radius: number): IPoint {
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
function fitts(distance: number, width: number): number {
  return 2 * Math.log2(distance / width + 1);
}

function direction(a: IPoint, b: IPoint): IPoint {
  return sub(b, a);
}

function perpendicular(a: IPoint): IPoint {
  return { x: a.y, y: -1 * a.x };
}

function magnitude(a: IPoint): number {
  return Math.sqrt(a.x ** 2 + a.y ** 2);
}

function unit(a: IPoint): IPoint {
  return div(a, magnitude(a));
}

function setMagnitude(a: IPoint, amount: number): IPoint {
  return mult(unit(a), amount);
}
