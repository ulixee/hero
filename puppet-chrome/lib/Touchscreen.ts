import { CDPSession } from '../process/CDPSession';
import { Keyboard } from './Keyboard';

/**
 * The Touchscreen class exposes touchscreen events.
 * @public
 */
export default class Touchscreen {
  private cdpSession: CDPSession;
  private keyboard: Keyboard;

  /**
   * @internal
   */
  constructor(client: CDPSession, keyboard: Keyboard) {
    this.cdpSession = client;
    this.keyboard = keyboard;
  }

  /**
   * Dispatches a `touchstart` and `touchend` event.
   * @param x - Horizontal position of the tap.
   * @param y - Vertical position of the tap.
   */
  async tap(x: number, y: number): Promise<void> {
    // Touches appear to be lost during the first frame after navigation.
    // This waits a frame before sending the tap.
    // @see https://crbug.com/613219
    await this.cdpSession.send('Runtime.evaluate', {
      expression: 'new Promise(x => requestAnimationFrame(() => requestAnimationFrame(x)))',
      awaitPromise: true,
    });

    const touchPoints = [{ x: Math.round(x), y: Math.round(y) }];
    await this.cdpSession.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints,
      modifiers: this.keyboard.modifiers,
    });
    await this.cdpSession.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
      modifiers: this.keyboard.modifiers,
    });
  }
}
