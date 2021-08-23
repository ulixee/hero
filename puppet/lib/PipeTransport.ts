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
import * as EventUtils from '@ulixee/commons/lib/eventUtils';
import { addEventListeners } from '@ulixee/commons/lib/eventUtils';
import Log from '@ulixee/commons/lib/Logger';
import IRegisteredEventListener from '@ulixee/commons/interfaces/IRegisteredEventListener';

const { log } = Log(module);

export class PipeTransport {
  pipeWrite: NodeJS.WritableStream;
  pendingMessage: string;
  eventListeners: IRegisteredEventListener[];

  public onMessageFn?: (message: string) => void;
  public readonly onCloseFns: (() => void)[] = [];

  private isClosing = false;

  constructor(pipeWrite: NodeJS.WritableStream, pipeRead: NodeJS.ReadableStream) {
    this.pipeWrite = pipeWrite;
    this.pipeWrite.on('error', error => {
      if (this.isClosing) return;
      log.error('PipeTransport.WriteError', { error, sessionId: null });
    });
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

  end(message: string) {
    this.isClosing = true;
    this.send(message);
    this.close();
  }

  send(message: string) {
    this.pipeWrite.write(`${message}\0`);
  }

  close() {
    this.pipeWrite = null;
    EventUtils.removeEventListeners(this.eventListeners);
  }

  private emit(message) {
    if (this.onMessageFn) setImmediate(this.onMessageFn, message);
  }

  private onReadClosed() {
    log.info('PipeTransport.Closed');
    for (const close of this.onCloseFns) close();
    this.close();
  }

  private dispatch(buffer: Buffer): void {
    let end = buffer.indexOf('\0');
    if (end === -1) {
      this.pendingMessage += buffer.toString();
      return;
    }
    const message = this.pendingMessage + buffer.toString(undefined, 0, end);
    this.emit(message);

    let start = end + 1;
    end = buffer.indexOf('\0', start);
    while (end !== -1) {
      this.emit(buffer.toString(undefined, start, end));
      start = end + 1;
      end = buffer.indexOf('\0', start);
    }
    this.pendingMessage = buffer.toString(undefined, start);
  }
}
