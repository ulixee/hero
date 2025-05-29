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
import { IKeyboardKey } from '@ulixee/unblocked-specification/agent/interact/IKeyboardLayoutUS';
import { IKeyboard } from '@ulixee/unblocked-specification/agent/interact/IInput';
import DevtoolsSession from './DevtoolsSession';
export declare class Keyboard implements IKeyboard {
    modifiers: number;
    private devtoolsSession;
    private pressedKeys;
    constructor(devtoolsSession: DevtoolsSession);
    down(key: IKeyboardKey): Promise<void>;
    command(command: string): Promise<void>;
    up(key: IKeyboardKey): Promise<void>;
    sendCharacter(char: string): Promise<void>;
    press(key: IKeyboardKey, keyupDelay?: number): Promise<void>;
    insertText(text: string): Promise<void>;
    private keyDescriptionForString;
    private macCommandsForCode;
    private isModifierActive;
    private static modifierBit;
}
