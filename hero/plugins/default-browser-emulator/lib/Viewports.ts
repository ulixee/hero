import IViewport from '@secret-agent/interfaces/IViewport';
import { IDataWindowFraming } from "../interfaces/IBrowserData";

const defaultWindowFraming = {
  screenGapLeft: 0,
  screenGapTop: 0,
  screenGapRight: 0,
  screenGapBottom: 0,
  frameBorderWidth: 0,
  frameBorderHeight: 0,
};

export default class Viewports {
  static getDefault(windowBaseFraming: IDataWindowFraming, windowFraming: IDataWindowFraming) {
    windowFraming = windowFraming || { ...defaultWindowFraming };
    const base = windowBaseFraming || { ...defaultWindowFraming };
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
