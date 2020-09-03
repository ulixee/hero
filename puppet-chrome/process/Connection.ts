/**
 * Copyright 2017 Google Inc. All rights reserved.
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
import { ProtocolMapping } from 'devtools-protocol/types/protocol-mapping';
import { debug } from '@secret-agent/commons/Debug';
import { EventEmitter } from 'events';
import IConnectionTransport from '../interfaces/IConnectionTransport';
import { CDPSession, createProtocolError, rewriteError } from './CDPSession';
import { IConnectionCallback } from '../interfaces/IConnectionCallback';
import { ICdpMessage } from '../interfaces/ICDPMessage';

const debugProtocolSend = debug('puppet-chrome:protocol:SEND ►');
const debugProtocolReceive = debug('puppet-chrome:protocol:RECV ◀');

export class Connection extends EventEmitter {
  transport: IConnectionTransport;
  lastId = 0;
  sessionsById = new Map<string, CDPSession>();
  isClosed = false;

  apiCallbacks: Map<number, IConnectionCallback> = new Map();

  constructor(transport: IConnectionTransport) {
    super();

    this.transport = transport;
    this.transport.onmessage = this.onMessage.bind(this);
    this.transport.onclose = this.onClose.bind(this);
  }

  public send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...paramArgs: ProtocolMapping.Commands[T]['paramsType']
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    // There is only ever 1 param arg passed, but the Protocol defines it as an
    // array of 0 or 1 items See this comment:
    // https://github.com/ChromeDevTools/devtools-protocol/pull/113#issuecomment-412603285
    // which explains why the protocol defines the params this way for better
    // type-inference.
    // So now we check if there are any params or not and deal with them accordingly.
    const params = paramArgs.length ? paramArgs[0] : undefined;
    const id = this.rawSend({ method, params });
    return new Promise((resolve, reject) => {
      this.apiCallbacks.set(id, { resolve, reject, error: new Error(), method });
    });
  }

  public dispose(): void {
    this.onClose();
    this.transport.close();
  }

  public rawSend(message: ICdpMessage): number {
    this.lastId += 1;
    const id = this.lastId;
    const body = JSON.stringify({ ...message, id });
    debugProtocolSend(id, body);
    this.transport.send(body);
    return id;
  }

  public async createSession(targetInfo: Protocol.Target.TargetInfo): Promise<CDPSession> {
    const { sessionId } = await this.send('Target.attachToTarget', {
      targetId: targetInfo.targetId,
      flatten: true,
    });
    return this.sessionsById.get(sessionId);
  }

  private async onMessage(message: string): Promise<void> {
    const object = JSON.parse(message);
    debugProtocolReceive(object.id || '  ', message);
    if (object.method === 'Target.attachedToTarget') {
      const sessionId = object.params.sessionId;
      const session = new CDPSession(this, object.params.targetInfo.type, sessionId);
      this.sessionsById.set(sessionId, session);
    } else if (object.method === 'Target.detachedFromTarget') {
      const session = this.sessionsById.get(object.params.sessionId);
      if (session) {
        session.onClosed();
        this.sessionsById.delete(object.params.sessionId);
      }
    }
    if (object.sessionId) {
      const session = this.sessionsById.get(object.sessionId);
      if (session) session.onMessage(object);
    } else if (object.id) {
      const callback = this.apiCallbacks.get(object.id);
      // Callbacks could be all rejected if someone has called `.dispose()`.
      if (callback) {
        this.apiCallbacks.delete(object.id);
        if (object.error)
          callback.reject(createProtocolError(callback.error, callback.method, object));
        else callback.resolve(object.result);
      }
    } else {
      this.emit(object.method, object.params);
    }
  }

  private onClose() {
    if (this.isClosed) return;
    this.isClosed = true;
    this.transport.onmessage = null;
    this.transport.onclose = null;
    for (const callback of this.apiCallbacks.values()) {
      callback.reject(
        rewriteError(callback.error, `Protocol error (${callback.method}): Target closed.`),
      );
    }
    this.apiCallbacks.clear();
    for (const session of this.sessionsById.values()) session.onClosed();
    this.sessionsById.clear();
    this.emit('disconnected');
  }
}
