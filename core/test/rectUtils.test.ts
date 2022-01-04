import {
  createPointInRect,
  createScrollPointForRect,
  isPointWithinRect,
  isRectInViewport,
} from '../lib/rectUtils';
import IRect from '@ulixee/hero-interfaces/IRect';

test('should find a point in a rect', () => {
  const rect: IRect = { x: 0, y: 0, width: 10, height: 10 };
  expect(isPointWithinRect({ x: 0, y: 0 }, rect)).toBe(true);
  expect(isPointWithinRect({ x: 5, y: 5 }, rect)).toBe(true);
  expect(isPointWithinRect({ x: 10, y: 10 }, rect)).toBe(true);
  expect(isPointWithinRect({ x: 10, y: 11 }, rect)).toBe(false);
});

describe('createScrollPointForRect tests', () => {
  test("should find midpoint that's already in view", async () => {
    expect(
      createScrollPointForRect(
        { x: 0, y: 0, width: 100, height: 200 },
        { height: 800, width: 1000 },
      ),
    ).toEqual({ x: 0, y: 0 });

    expect(
      createScrollPointForRect(
        { x: 0, y: 400, width: 100, height: 200 },
        { height: 800, width: 1000 },
      ).y,
    ).toBe(400);
  });

  test("should find midpoint that's past the middle", async () => {
    expect(
      createScrollPointForRect(
        { x: 0, y: 401, width: 100, height: 200 },
        { height: 800, width: 1000 },
      ).y,
    ).toBeGreaterThanOrEqual(398);

    expect(
      createScrollPointForRect(
        { x: 0, y: 800, width: 100, height: 200 },
        { height: 800, width: 1000 },
      ).y,
    ).toBeGreaterThanOrEqual(398);

    expect(
      createScrollPointForRect(
        { x: 0, y: 1200, width: 100, height: 200 },
        { height: 800, width: 1000 },
      ).y,
    ).toBeGreaterThanOrEqual(798);
  });

  test("should find midpoint that's negative past the middle", async () => {
    expect(
      createScrollPointForRect(
        { x: 0, y: -401, width: 100, height: 200 },
        { height: 800, width: 1000 },
      ).y,
    ).toBeGreaterThanOrEqual(-402);

    expect(
      createScrollPointForRect(
        { x: 0, y: -800, width: 100, height: 200 },
        { height: 800, width: 1000 },
      ).y,
    ).toBeGreaterThanOrEqual(-1202);

    expect(
      createScrollPointForRect(
        { x: 0, y: -1200, width: 100, height: 200 },
        { height: 800, width: 1000 },
      ).y,
    ).toBeGreaterThanOrEqual(-1602);
  });
});

describe('createPointInRect', () => {
  test('creates points in a rect', () => {
    const point = createPointInRect({ x: 0, y: 0, width: 10, height: 10 });
    expect(point.y).toBeGreaterThanOrEqual(0);
    expect(point.y).toBeLessThanOrEqual(10);
    expect(point.x).toBeGreaterThanOrEqual(0);
    expect(point.x).toBeLessThanOrEqual(10);
  });

  test('creates points in a rect with padding', () => {
    const point = createPointInRect(
      { x: 0, y: 0, width: 10, height: 10 },
      { paddingPercent: { height: 10, width: 20 } },
    );
    expect(point.y).toBeGreaterThanOrEqual(1);
    expect(point.y).toBeLessThanOrEqual(9);
    expect(point.x).toBeGreaterThanOrEqual(2);
    expect(point.x).toBeLessThanOrEqual(8);
  });

  test('creates points in a rect with padding when position is negative', () => {
    const point = createPointInRect(
      { x: 0, y: -10, width: 10, height: 10 },
      { paddingPercent: { height: 10, width: 20 } },
    );
    expect(point.y).toBeGreaterThanOrEqual(-9);
    expect(point.y).toBeLessThanOrEqual(-1);
    expect(point.x).toBeGreaterThanOrEqual(2);
    expect(point.x).toBeLessThanOrEqual(8);
  });
});

test('should work to find center coordinates', async () => {
  expect(isAxisInViewport(20, 100, 100)).toBe(true);
  expect(isAxisInViewport(85, 100, 100)).toBe(false);
  expect(isAxisInViewport(150, 100, 100)).toBe(false);
  expect(isAxisInViewport(-30, 100, 100)).toBe(true);
  expect(isAxisInViewport(-51, 100, 100)).toBe(false);
});

function isAxisInViewport(
  coordinate: number,
  length: number,
  boundaryLength: number,
  percent = 50,
): boolean {
  return isRectInViewport(
    { x: coordinate, y: coordinate, height: length, width: length },
    { height: boundaryLength, width: boundaryLength },
    percent,
  ).width;
}
