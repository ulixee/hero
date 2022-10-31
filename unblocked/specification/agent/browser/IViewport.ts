export default interface IViewport {
  width: number;
  height: number;
  deviceScaleFactor?: number;
  screenWidth?: number;
  screenHeight?: number;
  positionX?: number;
  positionY?: number;
  isDefault?: boolean;
}
