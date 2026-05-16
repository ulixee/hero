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
import { Protocol } from 'devtools-protocol';
import DevtoolsSession from './DevtoolsSession';
import ExceptionDetails = Protocol.Runtime.ExceptionDetails;
import ConsoleAPICalledEvent = Protocol.Runtime.ConsoleAPICalledEvent;
export default class ConsoleMessage {
    readonly message: string;
    readonly location: string;
    readonly type: string;
    constructor(message: string, location: string, type: string);
    static create(devtoolsSession: DevtoolsSession, event: ConsoleAPICalledEvent): ConsoleMessage;
    static exceptionToError(exceptionDetails: ExceptionDetails): Error;
    private static printStackTrace;
}
