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
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import IConnectionTransport from '../interfaces/IConnectionTransport';
import DevtoolsSession from './DevtoolsSession';
export declare class Connection extends TypedEventEmitter<{
    disconnected: void;
    'on-attach': {
        session: DevtoolsSession;
    };
}> {
    #private;
    readonly transport: IConnectionTransport;
    readonly rootSession: DevtoolsSession;
    get isClosed(): boolean;
    get nextId(): number;
    private lastId;
    private sessionsById;
    constructor(transport: IConnectionTransport);
    sendMessage(message: object & {
        id: number;
    }): boolean;
    getSession(sessionId: string): DevtoolsSession | undefined;
    dispose(): void;
    private onMessage;
    private onClosed;
}
