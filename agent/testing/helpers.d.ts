import MitmSocket from '@ulixee/unblocked-agent-mitm-socket';
import * as http from 'http';
import { IncomingMessage, RequestListener } from 'http';
import * as http2 from 'http2';
import * as https from 'https';
import { Agent } from 'https';
import * as net from 'net';
import * as stream from 'stream';
import { URL } from 'url';
import KoaMulter = require('@koa/multer');
import KoaRouter = require('@koa/router');
import Koa = require('koa');
export declare const needsClosing: {
    close: () => Promise<any> | void;
    onlyCloseOnFinal?: boolean;
}[];
export interface ITestKoaServer extends KoaRouter {
    close: () => void;
    server: http.Server;
    koa: Koa;
    isClosing?: boolean;
    onlyCloseOnFinal?: boolean;
    baseHost: string;
    baseUrl: string;
    upload: KoaMulter.Instance;
}
export interface ITestHttpServer<T> {
    isClosing: boolean;
    onlyCloseOnFinal: boolean;
    url: string;
    port: number;
    baseUrl: string;
    close: () => Promise<any>;
    on: (eventName: string, fn: (...args: any[]) => void) => any;
    server: T;
}
export declare function runKoaServer(onlyCloseOnFinal?: boolean): Promise<ITestKoaServer>;
export declare function sslCerts(): {
    key: Buffer;
    cert: Buffer;
};
export declare function runHttpsServer(handler: RequestListener, onlyCloseOnFinal?: boolean): Promise<ITestHttpServer<https.Server>>;
export declare function runHttpServer(params?: {
    onRequest?: (url: string, method: string, headers: http.IncomingHttpHeaders) => void;
    handler?: (req: http.IncomingMessage, res: http.ServerResponse) => void;
    onPost?: (body: string) => void;
    addToResponse?: (response: http.ServerResponse) => void;
    onlyCloseOnFinal?: boolean;
}): Promise<ITestHttpServer<http.Server>>;
export declare function httpRequest(urlStr: string, method: string, proxyHost: string, proxyAuth?: string, headers?: {
    [name: string]: string;
}, response?: (res: IncomingMessage) => any, postData?: Buffer): Promise<string>;
export declare function getProxyAgent(url: URL, proxyHost: string, auth?: string): Agent;
export declare function httpGet(urlStr: string, proxyHost: string, proxyAuth?: string, headers?: {
    [name: string]: string;
}): Promise<string>;
export declare function http2Get(host: string, headers: {
    [':path']: string;
    [name: string]: string;
}, sessionId: string, proxyUrl?: string): Promise<string>;
export declare function runHttp2Server(handler: (request: http2.Http2ServerRequest, response: http2.Http2ServerResponse) => void): Promise<ITestHttpServer<http2.Http2SecureServer>>;
export declare function httpGetWithSocket(url: string, clientOptions: https.RequestOptions, socket: net.Socket): Promise<string>;
export declare function getTlsConnection(serverPort: number, host?: string, isWebsocket?: boolean, proxyUrl?: string): MitmSocket;
export declare function getLogo(): Buffer;
export declare function readableToBuffer(res: stream.Readable): Promise<Buffer>;
export declare function beforeEach(): Promise<void>;
export declare function afterEach(): Promise<void>;
export declare function afterAll(): Promise<void>;
export declare function onClose(closeFn: (() => Promise<any>) | (() => any), onlyCloseOnFinal?: boolean): void;
