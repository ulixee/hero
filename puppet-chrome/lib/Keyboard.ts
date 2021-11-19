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
import { IKeyboardKey } from '@ulixee/hero-interfaces/IKeyboardLayoutUS';
import { assert } from '@ulixee/commons/lib/utils';
import { IPuppetKeyboard } from '@ulixee/hero-interfaces/IPuppetInput';
import { IKeyDefinition, keyDefinitions } from '../interfaces/USKeyboardLayout';
import { DevtoolsSession } from './DevtoolsSession';

type KeyDescription = Required<Pick<IKeyDefinition, 'key' | 'text' | 'code' | 'location'>> & {
  keyCode: number;
};

export class Keyboard implements IPuppetKeyboard {
  public modifiers = 0;
  private devtoolsSession: DevtoolsSession;
  private pressedKeys = new Set<string>();

  constructor(devtoolsSession: DevtoolsSession) {
    this.devtoolsSession = devtoolsSession;
  }

  async down(key: IKeyboardKey): Promise<void> {
    const description = this.keyDescriptionForString(key);

    const autoRepeat = this.pressedKeys.has(description.code);
    this.pressedKeys.add(description.code);
    this.modifiers |= Keyboard.modifierBit(description.key);
    const commands = this.macCommandsForCode(description.code);

    const text = description.text;
    await this.devtoolsSession.send('Input.dispatchKeyEvent', {
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
      commands,
    });
  }

  async up(key: IKeyboardKey): Promise<void> {
    const description = this.keyDescriptionForString(key);

    this.modifiers &= ~Keyboard.modifierBit(description.key);
    this.pressedKeys.delete(description.code);
    await this.devtoolsSession.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      modifiers: this.modifiers,
      key: description.key,
      windowsVirtualKeyCode: description.keyCode,
      code: description.code,
      location: description.location,
    });
  }

  async sendCharacter(char: string): Promise<void> {
    await this.devtoolsSession.send('Input.insertText', { text: char });
  }

  async press(key: IKeyboardKey, keyupDelay?: number): Promise<void> {
    await this.down(key);
    if (keyupDelay) await new Promise(resolve => setTimeout(resolve, keyupDelay));
    await this.up(key);
  }

  async insertText(text: string): Promise<void> {
    await this.devtoolsSession.send('Input.insertText', { text });
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

  private macCommandsForCode(code: string): string[] {
    if (process.platform !== 'darwin') return [];
    const parts = ['Shift', 'Control', 'Alt', 'Meta'].filter(x => this.isModifierActive(x));
    parts.push(code);
    const shortcut = parts.join('+');
    let commands = macEditingCommands[shortcut] || [];
    if (typeof commands === 'string') commands = [commands];
    // Commands that insert text are not supported
    commands = commands.filter(x => !x.startsWith('insert'));
    // remove the trailing : to match the Chromium command names.
    return commands.map(c => c.substring(0, c.length - 1));
  }

  private isModifierActive(key: string): boolean {
    return (this.modifiers & Keyboard.modifierBit(key)) !== 0;
  }

  private static modifierBit(key: string): number {
    if (key === 'Alt') return 1;
    if (key === 'Control') return 2;
    if (key === 'Meta') return 4;
    if (key === 'Shift') return 8;
    return 0;
  }
}

// BAB: copied from Playwright (https://github.com/microsoft/playwright/blob/afae5bef5db1e0e8147a614b9933e31fc56c0076/src/server/macEditingCommands.ts)
const macEditingCommands: { [key: string]: string | string[] } = {
  Backspace: 'deleteBackward:',
  Enter: 'insertNewline:',
  NumpadEnter: 'insertNewline:',
  Escape: 'cancelOperation:',
  ArrowUp: 'moveUp:',
  ArrowDown: 'moveDown:',
  ArrowLeft: 'moveLeft:',
  ArrowRight: 'moveRight:',
  F5: 'complete:',
  Delete: 'deleteForward:',
  Home: 'scrollToBeginningOfDocument:',
  End: 'scrollToEndOfDocument:',
  PageUp: 'scrollPageUp:',
  PageDown: 'scrollPageDown:',
  'Shift+Backspace': 'deleteBackward:',
  'Shift+Enter': 'insertNewline:',
  'Shift+NumpadEnter': 'insertNewline:',
  'Shift+Escape': 'cancelOperation:',
  'Shift+ArrowUp': 'moveUpAndModifySelection:',
  'Shift+ArrowDown': 'moveDownAndModifySelection:',
  'Shift+ArrowLeft': 'moveLeftAndModifySelection:',
  'Shift+ArrowRight': 'moveRightAndModifySelection:',
  'Shift+F5': 'complete:',
  'Shift+Delete': 'deleteForward:',
  'Shift+Home': 'moveToBeginningOfDocumentAndModifySelection:',
  'Shift+End': 'moveToEndOfDocumentAndModifySelection:',
  'Shift+PageUp': 'pageUpAndModifySelection:',
  'Shift+PageDown': 'pageDownAndModifySelection:',
  'Shift+Numpad5': 'delete:',
  'Control+Tab': 'selectNextKeyView:',
  'Control+Enter': 'insertLineBreak:',
  'Control+NumpadEnter': 'insertLineBreak:',
  'Control+Quote': 'insertSingleQuoteIgnoringSubstitution:',
  'Control+KeyA': 'moveToBeginningOfParagraph:',
  'Control+KeyB': 'moveBackward:',
  'Control+KeyD': 'deleteForward:',
  'Control+KeyE': 'moveToEndOfParagraph:',
  'Control+KeyF': 'moveForward:',
  'Control+KeyH': 'deleteBackward:',
  'Control+KeyK': 'deleteToEndOfParagraph:',
  'Control+KeyL': 'centerSelectionInVisibleArea:',
  'Control+KeyN': 'moveDown:',
  'Control+KeyO': ['insertNewlineIgnoringFieldEditor:', 'moveBackward:'],
  'Control+KeyP': 'moveUp:',
  'Control+KeyT': 'transpose:',
  'Control+KeyV': 'pageDown:',
  'Control+KeyY': 'yank:',
  'Control+Backspace': 'deleteBackwardByDecomposingPreviousCharacter:',
  'Control+ArrowUp': 'scrollPageUp:',
  'Control+ArrowDown': 'scrollPageDown:',
  'Control+ArrowLeft': 'moveToLeftEndOfLine:',
  'Control+ArrowRight': 'moveToRightEndOfLine:',
  'Shift+Control+Enter': 'insertLineBreak:',
  'Shift+Control+NumpadEnter': 'insertLineBreak:',
  'Shift+Control+Tab': 'selectPreviousKeyView:',
  'Shift+Control+Quote': 'insertDoubleQuoteIgnoringSubstitution:',
  'Shift+Control+KeyA': 'moveToBeginningOfParagraphAndModifySelection:',
  'Shift+Control+KeyB': 'moveBackwardAndModifySelection:',
  'Shift+Control+KeyE': 'moveToEndOfParagraphAndModifySelection:',
  'Shift+Control+KeyF': 'moveForwardAndModifySelection:',
  'Shift+Control+KeyN': 'moveDownAndModifySelection:',
  'Shift+Control+KeyP': 'moveUpAndModifySelection:',
  'Shift+Control+KeyV': 'pageDownAndModifySelection:',
  'Shift+Control+Backspace': 'deleteBackwardByDecomposingPreviousCharacter:',
  'Shift+Control+ArrowUp': 'scrollPageUp:',
  'Shift+Control+ArrowDown': 'scrollPageDown:',
  'Shift+Control+ArrowLeft': 'moveToLeftEndOfLineAndModifySelection:',
  'Shift+Control+ArrowRight': 'moveToRightEndOfLineAndModifySelection:',
  'Alt+Backspace': 'deleteWordBackward:',
  'Alt+Enter': 'insertNewlineIgnoringFieldEditor:',
  'Alt+NumpadEnter': 'insertNewlineIgnoringFieldEditor:',
  'Alt+Escape': 'complete:',
  'Alt+ArrowUp': ['moveBackward:', 'moveToBeginningOfParagraph:'],
  'Alt+ArrowDown': ['moveForward:', 'moveToEndOfParagraph:'],
  'Alt+ArrowLeft': 'moveWordLeft:',
  'Alt+ArrowRight': 'moveWordRight:',
  'Alt+Delete': 'deleteWordForward:',
  'Alt+PageUp': 'pageUp:',
  'Alt+PageDown': 'pageDown:',
  'Shift+Alt+Backspace': 'deleteWordBackward:',
  'Shift+Alt+Enter': 'insertNewlineIgnoringFieldEditor:',
  'Shift+Alt+NumpadEnter': 'insertNewlineIgnoringFieldEditor:',
  'Shift+Alt+Escape': 'complete:',
  'Shift+Alt+ArrowUp': 'moveParagraphBackwardAndModifySelection:',
  'Shift+Alt+ArrowDown': 'moveParagraphForwardAndModifySelection:',
  'Shift+Alt+ArrowLeft': 'moveWordLeftAndModifySelection:',
  'Shift+Alt+ArrowRight': 'moveWordRightAndModifySelection:',
  'Shift+Alt+Delete': 'deleteWordForward:',
  'Shift+Alt+PageUp': 'pageUp:',
  'Shift+Alt+PageDown': 'pageDown:',
  'Control+Alt+KeyB': 'moveWordBackward:',
  'Control+Alt+KeyF': 'moveWordForward:',
  'Control+Alt+Backspace': 'deleteWordBackward:',
  'Shift+Control+Alt+KeyB': 'moveWordBackwardAndModifySelection:',
  'Shift+Control+Alt+KeyF': 'moveWordForwardAndModifySelection:',
  'Shift+Control+Alt+Backspace': 'deleteWordBackward:',
  'Meta+NumpadSubtract': 'cancel:',
  'Meta+Backspace': 'deleteToBeginningOfLine:',
  'Meta+ArrowUp': 'moveToBeginningOfDocument:',
  'Meta+ArrowDown': 'moveToEndOfDocument:',
  'Meta+ArrowLeft': 'moveToLeftEndOfLine:',
  'Meta+ArrowRight': 'moveToRightEndOfLine:',
  'Shift+Meta+NumpadSubtract': 'cancel:',
  'Shift+Meta+Backspace': 'deleteToBeginningOfLine:',
  'Shift+Meta+ArrowUp': 'moveToBeginningOfDocumentAndModifySelection:',
  'Shift+Meta+ArrowDown': 'moveToEndOfDocumentAndModifySelection:',
  'Shift+Meta+ArrowLeft': 'moveToLeftEndOfLineAndModifySelection:',
  'Shift+Meta+ArrowRight': 'moveToRightEndOfLineAndModifySelection:',

  'Meta+KeyA': 'selectAll:',
};
