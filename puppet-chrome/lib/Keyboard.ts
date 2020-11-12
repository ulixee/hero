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
import { IKeyboardKey } from '@secret-agent/core-interfaces/IKeyboardLayoutUS';
import { assert } from '@secret-agent/commons/utils';
import { IPuppetKeyboard } from '@secret-agent/puppet-interfaces/IPuppetInput';
import { IKeyDefinition, keyDefinitions } from '../interfaces/USKeyboardLayout';
import { CDPSession } from './CDPSession';

type KeyDescription = Required<Pick<IKeyDefinition, 'key' | 'text' | 'code' | 'location'>> & {
  keyCode: number;
};

export class Keyboard implements IPuppetKeyboard {
  public modifiers = 0;
  private cdpSession: CDPSession;
  private pressedKeys = new Set<string>();

  constructor(cdpSession: CDPSession) {
    this.cdpSession = cdpSession;
  }

  async down(key: IKeyboardKey): Promise<void> {
    const description = this.keyDescriptionForString(key);

    const autoRepeat = this.pressedKeys.has(description.code);
    this.pressedKeys.add(description.code);
    this.modifiers |= Keyboard.modifierBit(description.key);

    const text = description.text;
    await this.cdpSession.send('Input.dispatchKeyEvent', {
      type: text ? 'keyDown' : 'rawKeyDown',
      modifiers: this.modifiers,
      windowsVirtualKeyCode: description.keyCode,
      code: description.code,
      key: description.key,
      text,
      unmodifiedText: text,
      autoRepeat,
      location: description.location,
      isKeypad: description.location === 3,
    });
  }

  async up(key: IKeyboardKey): Promise<void> {
    const description = this.keyDescriptionForString(key);

    this.modifiers &= ~Keyboard.modifierBit(description.key);
    this.pressedKeys.delete(description.code);
    await this.cdpSession.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      modifiers: this.modifiers,
      key: description.key,
      windowsVirtualKeyCode: description.keyCode,
      code: description.code,
      location: description.location,
    });
  }

  async sendCharacter(char: string): Promise<void> {
    await this.cdpSession.send('Input.insertText', { text: char });
  }

  async press(key: IKeyboardKey, keyupDelay?: number): Promise<void> {
    await this.down(key);
    if (keyupDelay) await new Promise(resolve => setTimeout(resolve, keyupDelay));
    await this.up(key);
  }

  private keyDescriptionForString(keyString: IKeyboardKey): KeyDescription {
    const shift = this.modifiers & 8;
    const description = {
      key: '',
      keyCode: 0,
      code: '',
      text: '',
      location: 0,
    };

    const definition = keyDefinitions[keyString];
    assert(definition, `Unknown key: "${keyString}"`);

    if (definition.key) description.key = definition.key;
    if (shift && definition.shiftKey) description.key = definition.shiftKey;

    if (definition.keyCode) description.keyCode = definition.keyCode;
    if (shift && definition.shiftKeyCode) description.keyCode = definition.shiftKeyCode;

    if (definition.code) description.code = definition.code;

    if (definition.location) description.location = definition.location;

    if (description.key.length === 1) description.text = description.key;

    if (definition.text) description.text = definition.text;
    if (shift && definition.shiftText) description.text = definition.shiftText;

    // if any modifiers besides shift are pressed, no text should be sent
    if (this.modifiers & ~8) description.text = '';

    return description;
  }

  private static modifierBit(key: string): number {
    if (key === 'Alt') return 1;
    if (key === 'Control') return 2;
    if (key === 'Meta') return 4;
    if (key === 'Shift') return 8;
    return 0;
  }
}
