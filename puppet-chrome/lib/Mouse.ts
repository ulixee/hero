/**
 * Copyright 2018 Google Inc. All rights reserved.
 * Modifications copyright (c) Data Liberation Foundation Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { IMouseButton } from '@secret-agent/core-interfaces/IInteractions';
import { IMouseOptions } from '@secret-agent/puppet/interfaces/IPuppetInput';
import { CDPSession } from './CDPSession';
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
  private cdpSession: CDPSession;
  private keyboard: Keyboard;
  private x = 0;
  private y = 0;
  private button: IMouseButton | 'none' = 'none';

  constructor(cdpSession: CDPSession, keyboard: Keyboard) {
    this.cdpSession = cdpSession;
    this.keyboard = keyboard;
  }

  async move(x: number, y: number): Promise<void> {
    this.x = Math.floor(x ?? 0);
    this.y = Math.floor(y ?? 0);
    await this.cdpSession.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      button: this.button,
      x: this.x,
      y: this.y,
      modifiers: this.keyboard.modifiers,
    });
  }

  async click(
    x: number,
    y: number,
    options: IMouseOptions & { delay?: number } = {},
  ): Promise<void> {
    const { delay = null } = options;
    await this.move(x, y);
    await this.down(options);
    if (delay !== null) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    await this.up(options);
  }

  async down(options: IMouseOptions = {}): Promise<void> {
    const { button = 'left', clickCount = 1 } = options;
    this.button = button;
    await this.cdpSession.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      button,
      x: this.x,
      y: this.y,
      modifiers: this.keyboard.modifiers,
      clickCount,
    });
  }

  async up(options: IMouseOptions = {}): Promise<void> {
    const { button = 'left', clickCount = 1 } = options;
    this.button = 'none';
    await this.cdpSession.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      button,
      x: this.x,
      y: this.y,
      modifiers: this.keyboard.modifiers,
      clickCount,
    });
  }

  async wheel(options: { deltaX?: number; deltaY?: number } = {}): Promise<void> {
    const { deltaX = 0, deltaY = 0 } = options;

    await this.cdpSession.send('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x: this.x,
      y: this.y,
      deltaX: Math.round(deltaX ?? 0),
      deltaY: Math.round(deltaY ?? 0),
      modifiers: this.keyboard.modifiers,
      pointerType: 'mouse',
    });
  }
}
