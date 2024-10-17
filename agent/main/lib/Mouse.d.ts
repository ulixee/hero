import { IMouseOptions } from '@ulixee/unblocked-specification/agent/interact/IInput';
import IPoint from '@ulixee/unblocked-specification/agent/browser/IPoint';
import DevtoolsSession from './DevtoolsSession';
import { Keyboard } from './Keyboard';
/**
 * The Mouse class operates in main-frame CSS pixels
 * relative to the top-left corner of the viewport.
 * @remarks
 * Every `page` object has its own Mouse, accessible with [`page.mouse`](#pagemouse).
 *
 * @example
 * ```js
 * // Using ‘page.mouse’ to trace a 100x100 square.
 * await page.mouse.move(0, 0);
 * await page.mouse.down();
 * await page.mouse.move(0, 100);
 * await page.mouse.move(100, 100);
 * await page.mouse.move(100, 0);
 * await page.mouse.move(0, 0);
 * await page.mouse.up();
 * ```
 *
 * **Note**: The mouse events trigger synthetic `MouseEvent`s.
 * This means that it does not fully replicate the functionality of what a normal user
 * would be able to do with their mouse.
 *
 * For example, dragging and selecting text is not possible using `page.mouse`.
 * Instead, you can use the {@link https://developer.mozilla.org/en-US/docs/Web/API/DocumentOrShadowRoot/getSelection | `DocumentOrShadowRoot.getSelection()`} functionality implemented in the platform.
 *
 * @public
 */
export default class Mouse {
    position: IPoint;
    private devtoolsSession;
    private keyboard;
    private button;
    constructor(devtoolsSession: DevtoolsSession, keyboard: Keyboard);
    move(x: number, y: number): Promise<void>;
    down(options?: IMouseOptions): Promise<void>;
    up(options?: IMouseOptions): Promise<void>;
    wheel(options?: {
        deltaX?: number;
        deltaY?: number;
    }): Promise<void>;
}
