export default interface IViewport {
  /** The page width in pixels. */
  width: number;
  /** The page height in pixels. */
  height: number;
  /**
   * Specify device scale factor (can be thought of as dpr).
   * @default 1
   */
  deviceScaleFactor?: number;
  /** The screen width in pixels. */
  screenWidth: number;
  /** The screen height in pixels. */
  screenHeight: number;
  /** Overriding view X position on screen in pixels (minimum 0, maximum 10000000). */
  positionX: number;
  /** Overriding view Y position on screen in pixels (minimum 0, maximum 10000000). */
  positionY: number;
}
