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
import { EventEmitter } from 'events';
import { IConnectionCallback } from '@secret-agent/puppet-interfaces/IConnectionCallback';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import ProtocolError from '@secret-agent/puppet/lib/ProtocolError';
import { Connection } from './Connection';
import RemoteObject = Protocol.Runtime.RemoteObject;

/**
 * The `CDPSession` instances are used to talk raw Chrome Devtools Protocol.
 *
 * https://chromedevtools.github.io/devtools-protocol/
 */
export class CDPSession extends EventEmitter {
  public connection: Connection;
  public messageEvents = new TypedEventEmitter<IMessageEvents>();
  public get id() {
    return this.sessionId;
  }

  private readonly sessionId: string;
  private readonly targetType: string;
  private readonly pendingMessages: Map<number, IConnectionCallback> = new Map();

  constructor(connection: Connection, targetType: string, sessionId: string) {
    super();
    this.connection = connection;
    this.targetType = targetType;
    this.sessionId = sessionId;
  }

  async send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    params: ProtocolMapping.Commands[T]['paramsType'][0] = {},
    sendInitiator?: object,
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    if (!this.isConnected()) {
      throw new Error(
        `Protocol error (${method}): Session closed. Most likely the ${this.targetType} has been closed.`,
      );
    }

    const message = {
      sessionId: this.sessionId || undefined,
      method,
      params,
    };
    const id = this.connection.sendMessage(message);
    this.messageEvents.emit(
      'send',
      {
        id,
        ...message,
      },
      sendInitiator,
    );

    return new Promise((resolve, reject) => {
      this.pendingMessages.set(id, { resolve, reject, error: new CanceledPromiseError(), method });
    });
  }

  onMessage(object: ICDPSendResponseMessage & ICDPEventMessage): void {
    this.messageEvents.emit('receive', { ...object });
    if (!object.id) {
      setImmediate(() => this.emit(object.method, object.params));
      return;
    }

    const callback = this.pendingMessages.get(object.id);
    if (!callback) return;

    this.pendingMessages.delete(object.id);
    if (object.error) {
      const protocolError = new ProtocolError(callback.error.stack, callback.method, object.error);
      setImmediate(() => callback.reject(protocolError));
    } else {
      setImmediate(() => callback.resolve(object.result));
    }
  }

  disposeRemoteObject(object: RemoteObject): void {
    if (!object.objectId) return;
    this.send('Runtime.releaseObject', { objectId: object.objectId }).catch(() => {
      // Exceptions might happen in case of a page been navigated or closed.
      // Swallow these since they are harmless and we don't leak anything in this case.
    });
  }

  onClosed(): void {
    for (const callback of this.pendingMessages.values()) {
      const error = callback.error;
      error.message = `Cancel Pending Promise (${callback.method}): Target closed.`;
      callback.reject(error);
    }
    this.pendingMessages.clear();
    this.connection = null;
    this.emit('disconnected');
  }

  public isConnected() {
    return this.connection && !this.connection.isClosed;
  }
}

interface ICDPSendResponseMessage {
  sessionId: string;
  id: number;
  error?: { message: string; data: any };
  result?: any;
}

interface ICDPEventMessage {
  sessionId: string;
  method: string;
  params: object;
}

export interface IMessageEvents {
  send: { sessionId: string | undefined; id: number; method: string; params: any };
  receive: ICDPSendResponseMessage | ICDPEventMessage;
}
