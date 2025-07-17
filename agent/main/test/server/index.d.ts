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
import * as http from 'http';
import * as https from 'https';
import { Socket } from 'net';
export declare class TestServer {
    baseUrl: string;
    crossProcessBaseUrl: string;
    get emptyPage(): string;
    port: number;
    private readonly server;
    private readonly dirPath;
    private startTime;
    private sockets;
    private cachedPathPrefix;
    private routes;
    private auths;
    private csp;
    private gzipRoutes;
    private requestSubscribers;
    private readonly protocol;
    constructor(sslOptions?: https.ServerOptions);
    url(path: string): string;
    start(preferredPort: number): Promise<void>;
    onSocket(socket: Socket): void;
    enableGzip(path: string): void;
    setCSP(path: string, csp: string): void;
    stop(): Promise<void>;
    setRoute(path: string, handler: http.RequestListener): void;
    setRedirect(from: string, to: string): void;
    waitForRequest(path: string): Promise<http.IncomingMessage>;
    reset(): void;
    onRequest(request: http.IncomingMessage, response: http.ServerResponse): void;
    serveFile(request: http.IncomingMessage, response: http.ServerResponse, filePath?: string): void;
    static create(port: number): Promise<TestServer>;
    static createHTTPS(port: number): Promise<TestServer>;
}
