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
import { debug } from '@secret-agent/commons/Debug';
import { ProtocolMapping } from 'devtools-protocol/types/protocol-mapping';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import IConnectionTransport from '@secret-agent/puppet/interfaces/IConnectionTransport';
import { CDPSession } from './CDPSession';

const debugProtocolSend = debug('puppet-chrome:protocol:SEND ►');
const debugProtocolReceive = debug('puppet-chrome:protocol:RECV ◀');
const debugProtocolSkip = debug('puppet-chrome:protocol:SKIP _');

export class Connection extends TypedEventEmitter<{ disconnected: void }> {
  public readonly rootSession: CDPSession;
  public isClosed = false;

  private lastId = 0;
  private transport: IConnectionTransport;
  private sessionsById = new Map<string, CDPSession>();

  constructor(transport: IConnectionTransport) {
    super();

    this.transport = transport;
    this.transport.onmessage = this.onMessage.bind(this);
    this.transport.onclose = this.onClose.bind(this);
    this.rootSession = new CDPSession(this, '', 'browser', '');
    this.sessionsById.set('', this.rootSession);
  }

  public dispose(): void {
    this.onClose();
    this.transport.close();
  }

  public sendMessage<T extends keyof ProtocolMapping.Commands>(message: {
    method: T;
    params: any;
    sessionId?: string;
  }): number {
    this.lastId += 1;
    const id = this.lastId;
    const body = JSON.stringify({ ...message, id });
    debugProtocolSend(id, body);
    this.transport.send(body);
    return id;
  }

  public getSession(sessionId: string) {
    return this.sessionsById.get(sessionId);
  }

  private async onMessage(message: string): Promise<void> {
    if (shouldChuckMessage(message)) {
      debugProtocolSkip(`   ${message.substr(0, 50)}...`);
      return;
    }

    const object = JSON.parse(message);
    debugProtocolReceive(object.id || '  ', message);

    if (object.method === 'Target.attachedToTarget') {
      const sessionId = object.params.sessionId;
      const rootSessionId = object.sessionId || '';
      const session = new CDPSession(this, rootSessionId, object.params.targetInfo.type, sessionId);
      this.sessionsById.set(sessionId, session);
    }
    if (object.method === 'Target.detachedFromTarget') {
      const session = this.sessionsById.get(object.params.sessionId);
      if (session) {
        session.onClosed();
        this.sessionsById.delete(object.params.sessionId);
      }
    }

    const session = this.sessionsById.get(object.sessionId || '');
    if (session) {
      session.onMessage(object);
    }
  }

  private onClose() {
    if (this.isClosed) return;
    this.isClosed = true;
    this.transport.onmessage = null;
    this.transport.onclose = null;
    for (const session of this.sessionsById.values()) session.onClosed();
    this.sessionsById.clear();
    this.emit('disconnected');
  }
}

const ignoredMessages = [
  'Page.loadEventFired',
  'Page.domContentEventFired',
  'Network.requestWillBeSentExtraInfo',
  'Network.responseReceivedExtraInfo',
  'Network.dataReceived',
  'Network.loadingFinished',
].map(x => `{"method":"${x}"`);

function shouldChuckMessage(message: string) {
  for (const ignored of ignoredMessages) {
    if (message.startsWith(ignored)) return true;
  }
  return false;
}
