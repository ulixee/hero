"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultScreen = void 0;
const defaultWindowFraming = {
    screenGapLeft: 0,
    screenGapTop: 0,
    screenGapRight: 0,
    screenGapBottom: 0,
    frameBorderWidth: 0,
    frameBorderHeight: 0,
};
exports.defaultScreen = {
    width: 1440,
    height: 900,
    scale: 1,
};
class Viewports {
    static getDefault(windowBaseFraming, windowFraming) {
        windowFraming = windowFraming || { ...defaultWindowFraming };
        const base = windowBaseFraming || { ...defaultWindowFraming };
        const screenWidth = exports.defaultScreen.width;
        const screenHeight = exports.defaultScreen.height;
        const deviceScaleFactor = exports.defaultScreen.scale;
        const windowInnerWidth = screenWidth - (base.screenGapLeft + base.screenGapRight + base.frameBorderWidth);
        const windowWidth = windowInnerWidth + windowFraming.frameBorderWidth;
        const windowInnerHeight = screenHeight - (base.screenGapTop + base.screenGapBottom + base.frameBorderHeight);
        const windowHeight = windowInnerHeight + windowFraming.frameBorderHeight;
        const availableScreenWidth = screenWidth - (windowFraming.screenGapLeft + windowFraming.screenGapRight);
        const leftoverSpacingWidth = availableScreenWidth - windowWidth;
        const positionX = randomIntFromInterval(windowFraming.screenGapLeft, windowFraming.screenGapLeft + leftoverSpacingWidth);
        const availableScreenHeight = screenHeight - (windowFraming.screenGapTop + windowFraming.screenGapBottom);
        const leftoverSpacingHeight = availableScreenHeight - windowHeight;
        const positionY = randomIntFromInterval(windowFraming.screenGapTop, windowFraming.screenGapTop + leftoverSpacingHeight);
        return {
            positionX,
            positionY,
            screenWidth,
            screenHeight,
            width: windowInnerWidth,
            height: windowInnerHeight,
            deviceScaleFactor,
            isDefault: true,
        };
    }
}
exports.default = Viewports;
// HELPERS
function randomIntFromInterval(min, max) {
    if (min === max)
        return min;
    return Math.floor(Math.random() * (max - min + 1) + min);
}
//# sourceMappingURL=Viewports.js.map