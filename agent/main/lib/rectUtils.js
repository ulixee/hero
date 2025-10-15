"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPointWithinRect = isPointWithinRect;
exports.isRectInViewport = isRectInViewport;
exports.createScrollPointForRect = createScrollPointForRect;
exports.createPointInRect = createPointInRect;
function isPointWithinRect(point, rect) {
    if (point.x < rect.x || point.x > rect.x + rect.width)
        return false;
    if (point.y < rect.y || point.y > rect.y + rect.height)
        return false;
    return true;
}
function isRectInViewport(rect, viewport, percent) {
    const multiplier = percent < 1 ? percent : percent / 100;
    const width = isRectPointInBoundary(rect.x, rect.width, viewport.width, multiplier);
    const height = isRectPointInBoundary(rect.y, rect.height, viewport.height, multiplier);
    return {
        all: width && height,
        height,
        width,
    };
}
function createScrollPointForRect(targetRect, viewport) {
    let { x, y } = targetRect;
    const fudge = 2 * Math.random();
    // target rect inside bounds
    const midViewportHeight = Math.round(viewport.height / 2 + fudge);
    const midViewportWidth = Math.round(viewport.width / 2 + fudge);
    if (y < -(midViewportHeight + 1))
        y -= midViewportHeight;
    else if (y > midViewportHeight + 1)
        y -= midViewportHeight;
    if (x < -(midViewportWidth + 1))
        x -= midViewportWidth;
    else if (x > midViewportWidth + 1)
        x -= midViewportWidth;
    x = roundOne(x);
    y = roundOne(y);
    return { x, y };
}
function createPointInRect(rect, options) {
    const { height, width } = rect;
    let x = rect.x;
    let y = rect.y;
    if (y === 0 && height <= 1 && width <= 1 && x === 0) {
        return { x, y };
    }
    const { paddingPercent } = options ?? {};
    let padX = paddingPercent?.width ?? 33;
    if (padX < 0 || padX > 100)
        padX = 33;
    const paddingWidth = (width * 2 * padX) / 100;
    const innerWidth = width - paddingWidth;
    x += paddingWidth / 2;
    let padY = paddingPercent?.height ?? 33;
    if (padY < 0 || padY > 100)
        padY = 33;
    const paddingHeight = (height * 2 * padY) / 100;
    const innerHeight = height - paddingHeight;
    y += paddingHeight / 2;
    x += Math.random() * innerWidth;
    y += Math.random() * innerHeight;
    if (options?.constrainToViewport) {
        const { constrainToViewport } = options;
        if (x > constrainToViewport.width)
            x = constrainToViewport.width - 1;
        if (y > constrainToViewport.height)
            y = constrainToViewport.height - 1;
    }
    return {
        x: Math.round(x),
        y: Math.round(y),
    };
}
function isRectPointInBoundary(coordinate, length, boundaryLength, multiplier) {
    if (length > boundaryLength) {
        length = boundaryLength;
    }
    const midpointOffset = Math.round(coordinate + length * multiplier);
    if (coordinate >= 0) {
        // midpoint passes end
        if (midpointOffset >= boundaryLength) {
            return false;
        }
    }
    else {
        // midpoint before start
        // eslint-disable-next-line no-lonely-if
        if (midpointOffset <= 0) {
            return false;
        }
    }
    return true;
}
function roundOne(num) {
    return Math.round(num * 10) / 10;
}
//# sourceMappingURL=rectUtils.js.map