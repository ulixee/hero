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
import { assert } from '@secret-agent/commons/utils';
import { IConnectionCallback } from '@secret-agent/puppet/interfaces/IConnectionCallback';
import { CanceledPromiseError } from '@secret-agent/commons/eventUtils';
import { debug } from '@secret-agent/commons/Debug';
import { Connection } from './Connection';
import RemoteObject = Protocol.Runtime.RemoteObject;

const debugProtocolMissed = debug('puppet-chrome:protocol:MISSED X');
/**
 * The `CDPSession` instances are used to talk raw Chrome Devtools Protocol.
 *
 * https://chromedevtools.github.io/devtools-protocol/
 */
export class CDPSession extends EventEmitter {
  public connection: Connection;
  private readonly sessionId: string;
  private readonly rootSessionId: string;
  private readonly targetType: string;
  private readonly pendingMessages: Map<number, IConnectionCallback> = new Map();

  constructor(
    connection: Connection,
    rootSessionId: string,
    targetType: string,
    sessionId: string,
  ) {
    super();
    this.connection = connection;
    this.targetType = targetType;
    this.sessionId = sessionId;
    this.rootSessionId = rootSessionId;
  }

  send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...paramArgs: ProtocolMapping.Commands[T]['paramsType']
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    if (!this.isConnected()) {
      return Promise.reject(
        new Error(
          `Protocol error (${method}): Session closed. Most likely the ${this.targetType} has been closed.`,
        ),
      );
    }

    const params = paramArgs.length ? paramArgs[0] : undefined;

    const id = this.connection.sendMessage({
      sessionId: this.sessionId || undefined,
      method,
      params: params || {},
    });

    return new Promise((resolve, reject) => {
      this.pendingMessages.set(id, { resolve, reject, error: new CanceledPromiseError(), method });
    });
  }

  onMessage(object: CDPSessionOnMessageObject): void {
    if (object.id && this.pendingMessages.has(object.id)) {
      const callback = this.pendingMessages.get(object.id);
      this.pendingMessages.delete(object.id);
      if (object.error) {
        callback.reject(createProtocolError(callback.error, callback.method, object));
      } else {
        callback.resolve(object.result);
      }
    } else {
      assert(!object.id);
      if (!this.listenerCount(object.method)) {
        debugProtocolMissed(object.method);
      }
      this.emit(object.method, object.params);
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
      callback.reject(
        rewriteError(callback.error, `Protocol error (${callback.method}): Target closed.`),
      );
    }
    this.pendingMessages.clear();
    this.connection = null;
    this.emit('disconnected');
  }

  public isConnected() {
    return this.connection && !this.connection.isClosed;
  }
}

interface CDPSessionOnMessageObject {
  id?: number;
  method: string;
  params: {};
  error: { message: string; data: any };
  result?: any;
}

export function createProtocolError(
  error: Error,
  method: string,
  object: { error: { message: string; data: any } },
): Error {
  let message = `Protocol error (${method}): ${object.error.message}`;
  if ('data' in object.error) message += ` ${object.error.data}`;
  return rewriteError(error, message);
}

export function rewriteError(error: Error, message: string): Error {
  error.message = message;
  return error;
}
