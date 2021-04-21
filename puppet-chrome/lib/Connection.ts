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
import {
  addTypedEventListener,
  removeEventListeners,
  TypedEventEmitter,
} from '@secret-agent/commons/eventUtils';
import IConnectionTransport, {
  IConnectionTransportEvents,
} from '@secret-agent/interfaces/IConnectionTransport';
import IRegisteredEventListener from '@secret-agent/interfaces/IRegisteredEventListener';
import Log from '@secret-agent/commons/Logger';
import { URL } from 'url';
import * as http from 'http';
import { DevtoolsSession } from './DevtoolsSession';

const { log } = Log(module);

export class Connection extends TypedEventEmitter<{ disconnected: void }> {
  public readonly rootSession: DevtoolsSession;
  public isClosed = false;

  private lastId = 0;
  private sessionsById = new Map<string, DevtoolsSession>();

  private readonly registeredEvents: IRegisteredEventListener[];

  constructor(readonly transport: IConnectionTransport) {
    super();

    const messageSink = (transport as unknown) as TypedEventEmitter<IConnectionTransportEvents>;
    this.registeredEvents = [
      addTypedEventListener(messageSink, 'message', this.onMessage.bind(this)),
      addTypedEventListener(messageSink, 'close', this.onClosed.bind(this)),
    ];

    this.rootSession = new DevtoolsSession(this, 'browser', '');
    this.sessionsById.set('', this.rootSession);
  }

  public getProtocol(): Promise<any> {
    if (!this.transport.url) return Promise.resolve(null);

    const port = new URL(this.transport.url).port;

    return new Promise((resolve, reject) => {
      const request = http.get(`http://localhost:${port}/json/protocol`, async res => {
        const body: Buffer[] = [];
        for await (const chunk of res) {
          body.push(chunk);
        }
        resolve(JSON.parse(Buffer.concat(body).toString()));
      });
      request.on('error', reject);
      request.end();
    });
  }

  public sendMessage(message: object): number {
    this.lastId += 1;
    const id = this.lastId;
    this.transport.send(JSON.stringify({ ...message, id }));
    return id;
  }

  public getSession(sessionId: string): DevtoolsSession | undefined {
    return this.sessionsById.get(sessionId);
  }

  public dispose(): void {
    this.onClosed();
    this.transport.close();
  }

  private onMessage(message: string): void {
    const object = JSON.parse(message);
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
    if (this.isClosed) return;
    this.isClosed = true;
    for (const [id, session] of this.sessionsById) {
      session.onClosed();
      this.sessionsById.delete(id);
    }
    removeEventListeners(this.registeredEvents);
    this.emit('disconnected');
  }
}
