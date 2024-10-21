"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
class Mouse {
    constructor(devtoolsSession, keyboard) {
        this.position = { x: 0, y: 0 };
        this.button = 'none';
        this.devtoolsSession = devtoolsSession;
        this.keyboard = keyboard;
    }
    async move(x, y) {
        const roundedX = Math.round(x ?? 0);
        const roundedY = Math.round(y ?? 0);
        if (roundedX === this.position.x && roundedY === this.position.y)
            return;
        this.position.x = roundedX;
        this.position.y = roundedY;
        await this.devtoolsSession.send('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            button: this.button,
            x: this.position.x,
            y: this.position.y,
            modifiers: this.keyboard.modifiers,
        });
    }
    async down(options = {}) {
        const { button = 'left', clickCount = 1 } = options;
        this.button = button;
        await this.devtoolsSession.send('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            button,
            x: this.position.x,
            y: this.position.y,
            modifiers: this.keyboard.modifiers,
            clickCount,
        });
    }
    async up(options = {}) {
        const { button = 'left', clickCount = 1 } = options;
        this.button = 'none';
        await this.devtoolsSession.send('Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            button,
            x: this.position.x,
            y: this.position.y,
            modifiers: this.keyboard.modifiers,
            clickCount,
        });
    }
    async wheel(options = {}) {
        const deltaX = Math.round(options.deltaX ?? 0);
        const deltaY = Math.round(options.deltaY ?? 0);
        if (deltaY === 0 && deltaY === 0)
            return;
        await this.devtoolsSession.send('Input.dispatchMouseEvent', {
            type: 'mouseWheel',
            x: 0,
            y: 0, // don't scroll relative to points... not included in mouse events and just confusing
            deltaX,
            deltaY,
            modifiers: this.keyboard.modifiers,
            pointerType: 'mouse',
        });
    }
}
exports.default = Mouse;
//# sourceMappingURL=Mouse.js.map