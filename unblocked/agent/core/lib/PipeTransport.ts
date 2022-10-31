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
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import Log from '@ulixee/commons/lib/Logger';
import { ChildProcess } from 'child_process';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import IConnectionTransport from '../interfaces/IConnectionTransport';

const { log } = Log(module);

export class PipeTransport implements IConnectionTransport {
  pipeWrite: NodeJS.WritableStream;
  pendingMessage: string;
  events = new EventSubscriber();
  isClosed = false;
  connectedPromise = new Resolvable<void>();

  public onMessageFn: (message: string) => void;
  public readonly onCloseFns: (() => void)[] = [];

  constructor(childProcess: ChildProcess) {
    const { 3: pipeWrite, 4: pipeRead } = childProcess.stdio;
    this.pipeWrite = pipeWrite as NodeJS.WritableStream;
    this.pendingMessage = '';
    this.events.on(pipeRead, 'data', this.onData.bind(this));
    this.events.on(pipeRead, 'close', this.onReadClosed.bind(this));
    this.events.on(pipeRead, 'error', error => {
      if (error.code === 'EPIPE') {
        error.stack = `Could not read connection with Browser Process: ${error.message}`;
      }
      log.error('PipeTransport.ReadError', { error, sessionId: null });
    });
    this.events.on(pipeWrite, 'error', error => {
      if (error.code === 'EPIPE') {
        error.stack = `Could not write to connection with Browser Process: ${error.message}`;
      }
      if (!this.connectedPromise.isResolved) this.connectedPromise.reject(error);
      if (this.isClosed) return;
      if (error.code !== 'EPIPE') {
        log.error('PipeTransport.WriteError', { error, sessionId: null });
      }
    });
  }

  send(message: string): boolean {
    if (!this.isClosed) {
      this.pipeWrite.write(`${message}\0`, error => {
        if (this.connectedPromise.isResolved) return;
        if (error) {
          this.connectedPromise.reject(error);
        } else {
          this.connectedPromise.resolve();
        }
      });
      return true;
    }
    return false;
  }

  close(): void {
    if (this.isClosed) return;
    this.isClosed = true;
    this.events.close('error');
  }

  private emit(message): void {
    if (this.onMessageFn) setImmediate(this.onMessageFn, message);
  }

  private onReadClosed(): void {
    log.info('PipeTransport.Closed');
    for (const close of this.onCloseFns) close();
    this.close();
  }

  private onData(buffer: Buffer): void {
    this.connectedPromise.resolve();
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
