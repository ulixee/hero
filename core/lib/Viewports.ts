import IViewport from '@secret-agent/core-interfaces/IViewport';
import IWindowFraming from "../../core-interfaces/IWindowFraming";

export default class Viewports {
  static getDefault(windowFraming: IWindowFraming, base: IWindowFraming, ) {
    const screenWidth = 1440;
    const screenHeight = 900;

    const positionX = windowFraming.screenGapLeft;
    const positionY = windowFraming.screenGapTop;

    const windowInnerWidth = screenWidth - (base.screenGapLeft + base.screenGapRight + base.frameBorderWidth);
    const windowWidth = windowInnerWidth + windowFraming.frameBorderWidth;

    const windowInnerHeight = screenHeight - (base.screenGapTop + base.screenGapBottom + base.frameBorderHeight);
    const windowHeight = windowInnerHeight + windowFraming.frameBorderHeight;

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
