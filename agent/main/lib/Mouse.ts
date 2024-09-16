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
import { IMouseButton } from '@ulixee/unblocked-specification/agent/interact/IInteractions';
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
  public position: IPoint = { x: 0, y: 0 };

  private devtoolsSession: DevtoolsSession;
  private keyboard: Keyboard;
  private button: IMouseButton | 'none' = 'none';

  constructor(devtoolsSession: DevtoolsSession, keyboard: Keyboard) {
    this.devtoolsSession = devtoolsSession;
    this.keyboard = keyboard;
  }

  async move(x: number, y: number): Promise<void> {
    const roundedX = Math.round(x ?? 0);
    const roundedY = Math.round(y ?? 0);
    if (roundedX === this.position.x && roundedY === this.position.y) return;
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

  async down(options: IMouseOptions = {}): Promise<void> {
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

  async up(options: IMouseOptions = {}): Promise<void> {
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

  async wheel(options: { deltaX?: number; deltaY?: number } = {}): Promise<void> {
    const deltaX = Math.round(options.deltaX ?? 0);
    const deltaY = Math.round(options.deltaY ?? 0);

    if (deltaY === 0 && deltaY === 0) return;

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
