import IViewport from '@secret-agent/core-interfaces/IViewport';
import IWindowFraming from '../../core-interfaces/IWindowFraming';

export default class Viewports {
  static getDefault(windowFraming: IWindowFraming, base: IWindowFraming) {
    const screenWidth = 1440;
    const screenHeight = 900;

    const windowInnerWidth =
      screenWidth - (base.screenGapLeft + base.screenGapRight + base.frameBorderWidth);
    const windowWidth = windowInnerWidth + windowFraming.frameBorderWidth;

    const windowInnerHeight =
      screenHeight - (base.screenGapTop + base.screenGapBottom + base.frameBorderHeight);
    const windowHeight = windowInnerHeight + windowFraming.frameBorderHeight;

    const availableScreenWidth =
      screenWidth - (windowFraming.screenGapLeft + windowFraming.screenGapRight);
    const leftoverSpacingWidth = availableScreenWidth - windowWidth;
    const positionX = randomIntFromInterval(
      windowFraming.screenGapLeft,
      windowFraming.screenGapLeft + leftoverSpacingWidth,
    );

    const availableScreenHeight =
      screenHeight - (windowFraming.screenGapTop + windowFraming.screenGapBottom);
    const leftoverSpacingHeight = availableScreenHeight - windowHeight;
    const positionY = randomIntFromInterval(
      windowFraming.screenGapTop,
      windowFraming.screenGapTop + leftoverSpacingHeight,
    );

    return {
      positionX,
      positionY,
      screenWidth,
      screenHeight,
      width: windowWidth,
      height: windowHeight,
      deviceScaleFactor: 1,
    } as IViewport;
  }
}

// HELPERS

function randomIntFromInterval(min, max) {
  if (min === max) return min;
  return Math.floor(Math.random() * (max - min + 1) + min);
}
