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
import IConnectionTransport from '@ulixee/hero-interfaces/IConnectionTransport';
import Log from '@ulixee/commons/lib/Logger';
import { DevtoolsSession } from './DevtoolsSession';

const { log } = Log(module);

export class Connection extends TypedEventEmitter<{ disconnected: void }> {
  public readonly rootSession: DevtoolsSession;
  public get isClosed(): boolean {
    return this.#isClosed || this.transport.isClosed;
  }

  public get nextId(): number {
    this.lastId += 1;
    return this.lastId;
  }

  #isClosed = false;
  private lastId = 0;

  private sessionsById = new Map<string, DevtoolsSession>();

  constructor(readonly transport: IConnectionTransport) {
    super();

    transport.onMessageFn = this.onMessage.bind(this);
    transport.onCloseFns.push(this.onClosed);

    this.rootSession = new DevtoolsSession(this, 'browser', '');
    this.sessionsById.set('', this.rootSession);
  }

  public sendMessage(message: object & { id: number }): boolean {
    return this.transport.send(JSON.stringify(message));
  }

  public getSession(sessionId: string): DevtoolsSession | undefined {
    return this.sessionsById.get(sessionId);
  }

  public dispose(): void {
    this.onClosed();
    this.transport.close();
  }

  private onMessage(message: string): void {
    const timestamp = new Date();
    const object = JSON.parse(message);
    object.timestamp = timestamp;
    const devtoolsSessionId = object.params?.sessionId;

    if (object.method === 'Target.attachedToTarget') {
      const session = new DevtoolsSession(this, object.params.targetInfo.type, devtoolsSessionId);
      this.sessionsById.set(devtoolsSessionId, session);
    }
    if (object.method === 'Target.detachedFromTarget') {
      const session = this.sessionsById.get(devtoolsSessionId);
      if (session) {
        session.onClosed();
        this.sessionsById.delete(devtoolsSessionId);
      }
    }

    const devtoolsSession = this.sessionsById.get(object.sessionId || '');
    if (devtoolsSession) {
      devtoolsSession.onMessage(object);
    } else {
      log.warn('MessageWithUnknownSession', { sessionId: null, message: object });
    }
  }

  private onClosed(): void {
    if (this.#isClosed) return;
    this.#isClosed = true;
    for (const [id, session] of this.sessionsById) {
      session.onClosed();
      this.sessionsById.delete(id);
    }
    this.transport.onMessageFn = null;
    this.emit('disconnected');
  }
}
