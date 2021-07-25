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
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import { createPromise } from '@ulixee/commons/lib/utils';
import IDevtoolsSession, {
  DevtoolsEvents,
  IDevtoolsEventMessage,
  IDevtoolsResponseMessage,
} from '@ulixee/hero-interfaces/IDevtoolsSession';
import ProtocolError from './ProtocolError';
import { Connection } from './Connection';
import RemoteObject = Protocol.Runtime.RemoteObject;

/**
 * The `DevtoolsSession` instances are used to talk raw Chrome Devtools Protocol.
 *
 * https://chromedevtools.github.io/devtools-protocol/
 */
export class DevtoolsSession extends TypedEventEmitter<DevtoolsEvents> implements IDevtoolsSession {
  public connection: Connection;
  public messageEvents = new TypedEventEmitter<IMessageEvents>();
  public get id() {
    return this.sessionId;
  }

  private readonly sessionId: string;
  private readonly targetType: string;
  private readonly pendingMessages: Map<
    number,
    { resolvable: IResolvablePromise<any>; method: string }
  > = new Map();

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
      throw new CanceledPromiseError(`${method} called after session closed (${this.sessionId})`);
    }

    const message = {
      sessionId: this.sessionId || undefined,
      method,
      params,
    };
    const timestamp = new Date();
    const id = this.connection.sendMessage(message);
    this.messageEvents.emit(
      'send',
      {
        id,
        timestamp,
        ...message,
      },
      sendInitiator,
    );
    const resolvable = createPromise<ProtocolMapping.Commands[T]['returnType']>();

    this.pendingMessages.set(id, { resolvable, method });
    return await resolvable.promise;
  }

  onMessage(object: IDevtoolsResponseMessage & IDevtoolsEventMessage): void {
    this.messageEvents.emit('receive', { ...object });
    if (!object.id) {
      this.emit(object.method as any, object.params);
      return;
    }

    const pending = this.pendingMessages.get(object.id);
    if (!pending) return;

    const { resolvable, method } = pending;

    this.pendingMessages.delete(object.id);
    if (object.error) {
      resolvable.reject(new ProtocolError(resolvable.stack, method, object.error));
    } else {
      resolvable.resolve(object.result);
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
    for (const { resolvable, method } of this.pendingMessages.values()) {
      const error = new CanceledPromiseError(`Cancel Pending Promise (${method}): Target closed.`);
      error.stack += `\n${'------DEVTOOLS'.padEnd(
        50,
        '-',
      )}\n${`------DEVTOOLS_SESSION_ID=${this.sessionId}`.padEnd(50, '-')}\n${resolvable.stack}`;
      resolvable.reject(error);
    }
    this.pendingMessages.clear();
    this.connection = null;
    this.emit('disconnected');
  }

  public isConnected() {
    return this.connection && !this.connection.isClosed;
  }
}

export interface IMessageEvents {
  send: { sessionId: string | undefined; id: number; method: string; params: any; timestamp: Date };
  receive: IDevtoolsResponseMessage | IDevtoolsEventMessage;
}
