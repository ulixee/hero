/**
 * Copyright 2018 Google Inc. All rights reserved.
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
import * as EventUtils from '@secret-agent/commons/EventUtils';
import { debug } from '@secret-agent/commons/Debug';
import IConnectionTransport from '../interfaces/IConnectionTransport';

const debugError = debug('puppet:error');

export class PipeTransport implements IConnectionTransport {
  pipeWrite: NodeJS.WritableStream;
  pendingMessage: string;
  eventListeners: EventUtils.IRegisteredEventListener[];

  onclose?: () => void;
  onmessage?: () => void;

  constructor(pipeWrite: NodeJS.WritableStream, pipeRead: NodeJS.ReadableStream) {
    this.pipeWrite = pipeWrite;
    this.pendingMessage = '';
    this.eventListeners = [
      EventUtils.addEventListener(pipeRead, 'data', buffer => this._dispatch(buffer)),
      EventUtils.addEventListener(pipeRead, 'close', () => {
        if (this.onclose) this.onclose.call(null);
      }),
      EventUtils.addEventListener(pipeRead, 'error', debugError),
      EventUtils.addEventListener(pipeWrite, 'error', debugError),
    ];
    this.onmessage = null;
    this.onclose = null;
  }

  send(message: string): void {
    this.pipeWrite.write(message);
    this.pipeWrite.write('\0');
  }

  _dispatch(buffer: Buffer): void {
    let end = buffer.indexOf('\0');
    if (end === -1) {
      this.pendingMessage += buffer.toString();
      return;
    }
    const message = this.pendingMessage + buffer.toString(undefined, 0, end);
    if (this.onmessage) this.onmessage.call(null, message);

    let start = end + 1;
    end = buffer.indexOf('\0', start);
    while (end !== -1) {
      if (this.onmessage) this.onmessage.call(null, buffer.toString(undefined, start, end));
      start = end + 1;
      end = buffer.indexOf('\0', start);
    }
    this.pendingMessage = buffer.toString(undefined, start);
  }

  close(): void {
    this.pipeWrite = null;
    EventUtils.removeEventListeners(this.eventListeners);
  }
}
