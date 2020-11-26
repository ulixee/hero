import IViewport from '@secret-agent/core-interfaces/IViewport';
import IWindowFraming from "../../core-interfaces/IWindowFraming";

export default class Viewports {
  static getDefault(windowFramingBase: IWindowFraming, windowFraming: IWindowFraming) {
    const screenWidth = 1440;
    const screenHeight = 900;
    const positionX = windowFraming.screenGapLeft;
    const positionY = windowFraming.screenGapTop;
    const windowWidth = screenWidth - (windowFramingBase.screenGapLeft + windowFramingBase.screenGapRight);
    const windowHeight = screenHeight - (windowFramingBase.screenGapTop + windowFramingBase.screenGapBottom);
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
