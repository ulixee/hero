/**
 * Copyright 2020 Data Liberation Foundation, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { IKeyboardKey } from '@ulixee/unblocked-specification/agent/interact/IKeyboardLayoutUS';
export interface IKeyDefinition {
    keyCode?: number;
    shiftKeyCode?: number;
    key?: string;
    shiftKey?: string;
    code?: string;
    text?: string;
    shiftText?: string;
    location?: number;
}
export declare const keyDefinitions: Readonly<Record<IKeyboardKey, IKeyDefinition>>;
