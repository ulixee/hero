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
import { ChildProcess } from 'child_process';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import IConnectionTransport from '../interfaces/IConnectionTransport';
export declare class PipeTransport implements IConnectionTransport {
    pipeWrite: NodeJS.WritableStream;
    pendingMessage: string;
    events: EventSubscriber;
    isClosed: boolean;
    connectedPromise: Resolvable<void>;
    onMessageFn: (message: string) => void;
    readonly onCloseFns: (() => void)[];
    constructor(childProcess: ChildProcess);
    send(message: string): boolean;
    close(): void;
    private emit;
    private onReadClosed;
    private onData;
}
