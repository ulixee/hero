/**
 * Copyright 2020 Data Liberation Foundation, Inc. All rights reserved.
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
import * as EventUtils from '@secret-agent/commons/eventUtils';
import Log from '@secret-agent/commons/logger';
import { addEventListeners, TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import IConnectionTransport, {
  IConnectionTransportEvents,
} from '../interfaces/IConnectionTransport';

const { log } = Log(module);

export class PipeTransport extends TypedEventEmitter<IConnectionTransportEvents>
  implements IConnectionTransport {
  pipeWrite: NodeJS.WritableStream;
  pendingMessage: string;
  eventListeners: EventUtils.IRegisteredEventListener[];

  constructor(pipeWrite: NodeJS.WritableStream, pipeRead: NodeJS.ReadableStream) {
    super();
    this.pipeWrite = pipeWrite;
    this.pendingMessage = '';
    this.eventListeners = addEventListeners(pipeRead, [
      ['data', this.dispatch.bind(this)],
      ['close', this.onReadClosed.bind(this)],
      ['error', error => log.error('PipeTransport.ReadError', { error, sessionId: null })],
    ]);
    this.eventListeners.push(
      EventUtils.addEventListener(pipeWrite, 'error', error =>
        log.error('PipeTransport.WriteError', { error, sessionId: null }),
      ),
    );
  }

  send(message: string) {
    this.pipeWrite.write(message);
    this.pipeWrite.write('\0');
  }

  close() {
    this.pipeWrite = null;
    EventUtils.removeEventListeners(this.eventListeners);
  }

  private onReadClosed() {
    log.info('PipeTransport.Closed');
    this.emit('close');
  }

  private dispatch(buffer: Buffer): void {
    let end = buffer.indexOf('\0');
    if (end === -1) {
      this.pendingMessage += buffer.toString();
      return;
    }
    const message = this.pendingMessage + buffer.toString(undefined, 0, end);
    this.emit('message', message);

    let start = end + 1;
    end = buffer.indexOf('\0', start);
    while (end !== -1) {
      this.emit('message', buffer.toString(undefined, start, end));
      start = end + 1;
      end = buffer.indexOf('\0', start);
    }
    this.pendingMessage = buffer.toString(undefined, start);
  }
}
