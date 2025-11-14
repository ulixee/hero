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
import { ProtocolMapping } from 'devtools-protocol/types/protocol-mapping';
import { Protocol } from 'devtools-protocol';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import IDevtoolsSession, { DevtoolsEvents, IDevtoolsEventMessage, IDevtoolsResponseMessage } from '@ulixee/unblocked-specification/agent/browser/IDevtoolsSession';
import { Connection } from './Connection';
import RemoteObject = Protocol.Runtime.RemoteObject;
/**
 * The `DevtoolsSession` instances are used to talk raw Chrome Devtools Protocol.
 *
 * https://chromedevtools.github.io/devtools-protocol/
 */
export default class DevtoolsSession extends TypedEventEmitter<DevtoolsEvents> implements IDevtoolsSession {
    connection: Connection;
    messageEvents: TypedEventEmitter<IMessageEvents>;
    get id(): string;
    private readonly sessionId;
    private readonly targetType;
    private readonly pendingMessages;
    constructor(connection: Connection, targetType: string, sessionId: string);
    send<T extends keyof ProtocolMapping.Commands>(method: T, params?: ProtocolMapping.Commands[T]['paramsType'][0], sendInitiator?: object, options?: {
        timeoutMs?: number;
    }): Promise<ProtocolMapping.Commands[T]['returnType']>;
    onMessage(object: IDevtoolsResponseMessage & IDevtoolsEventMessage): void;
    disposeRemoteObject(object: RemoteObject): void;
    onClosed(): void;
    isConnected(): boolean;
}
export interface IMessageEvents {
    send: {
        sessionId: string | undefined;
        id: number;
        method: string;
        params: any;
        timestamp: Date;
    };
    receive: IDevtoolsResponseMessage | IDevtoolsEventMessage;
}
