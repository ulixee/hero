import * as Fs from 'fs';
import * as Path from 'path';
import * as Url from 'url';
import { URL } from 'url';
import * as querystring from 'querystring';
import * as http from 'http';
import { IncomingMessage, RequestListener, Server } from 'http';
import * as https from 'https';
import { Agent } from 'https';
import { createPromise } from '@ulixee/commons/lib/utils';
import * as HttpProxyAgent from 'http-proxy-agent';
import * as HttpsProxyAgent from 'https-proxy-agent';
import * as Koa from 'koa';
import * as KoaRouter from '@koa/router';
import * as KoaMulter from '@koa/multer';
import * as net from 'net';
import * as tls from 'tls';
import * as http2 from 'http2';
import * as stream from 'stream';
import Core, { Session, Tab } from '@ulixee/hero-core';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import MitmSocket from '@unblocked-web/agent-mitm-socket';
import MitmSocketSession from '@unblocked-web/agent-mitm-socket/lib/MitmSocketSession';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import IScriptInstanceMeta from '@ulixee/hero-interfaces/IScriptInstanceMeta';
import { IJsPath } from '@unblocked-web/js-path';
import FrameEnvironment from '@ulixee/hero-core/lib/FrameEnvironment';
import Logger from '@ulixee/commons/lib/Logger';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { getComputedVisibilityFnName } from '@unblocked-web/specifications/agent/browser/IJsPathFunctions';
import { Helpers } from './index';

const { log } = Logger(module) as { log: IBoundLog };

export const needsClosing: { close: () => Promise<any> | void; onlyCloseOnFinal?: boolean }[] = [];

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

export async function runKoaServer(onlyCloseOnFinal = true): Promise<ITestKoaServer> {
  const koa = new Koa();
  const router = new KoaRouter() as ITestKoaServer;
  const exampleOrgPath = Path.join(__dirname, 'html', 'example.org.html');
  const exampleOrgHtml = Fs.readFileSync(exampleOrgPath, 'utf-8');
  const upload = KoaMulter(); // note you can pass `multer` options here

  koa.use(router.routes()).use(router.allowedMethods());
  koa.on('error', error => log.warn('Koa error', { error } as any));

  const server = await new Promise<Server>(resolve => {
    const koaServer = koa
      .listen(() => {
        resolve(koaServer);
      })
      .unref();
  });

  const destroyer = destroyServerFn(server);

  const port = (server.address() as net.AddressInfo).port;
  router.baseHost = `localhost:${port}`;
  router.baseUrl = `http://${router.baseHost}`;

  router.get('/', ctx => {
    ctx.body = exampleOrgHtml;
  });

  router.close = () => {
    if (router.isClosing) {
      return;
    }
    router.isClosing = true;
    return destroyer();
  };
  router.onlyCloseOnFinal = onlyCloseOnFinal;
  needsClosing.push(router);
  router.koa = koa;
  router.server = server;
  router.upload = upload;

  return router;
}

export function sslCerts() {
  return {
    key: Fs.readFileSync(`${__dirname}/certs/key.pem`),
    cert: Fs.readFileSync(`${__dirname}/certs/cert.pem`),
  };
}

export async function runHttpsServer(
  handler: RequestListener,
  onlyCloseOnFinal = false,
): Promise<ITestHttpServer<https.Server>> {
  const options = {
    ...sslCerts(),
  };

  const server = https.createServer(options, handler).listen(0).unref();
  await new Promise(resolve => server.once('listening', resolve));

  const destroyServer = destroyServerFn(server);

  bindSslListeners(server);
  const port = (server.address() as net.AddressInfo).port;
  const baseUrl = `https://localhost:${port}`;
  const httpServer: ITestHttpServer<https.Server> = {
    isClosing: false,
    on(eventName, fn) {
      server.on(eventName, fn);
    },
    close(): Promise<void> {
      if (httpServer.isClosing) {
        return null;
      }
      httpServer.isClosing = true;
      return destroyServer();
    },
    onlyCloseOnFinal,
    baseUrl,
    url: `${baseUrl}/`,
    port,
    server,
  };

  needsClosing.push(httpServer);

  return httpServer;
}

export async function runHttpServer(
  params: {
    onRequest?: (url: string, method: string, headers: http.IncomingHttpHeaders) => void;
    onPost?: (body: string) => void;
    addToResponse?: (response: http.ServerResponse) => void;
    onlyCloseOnFinal?: boolean;
  } = {},
): Promise<ITestHttpServer<http.Server>> {
  const { onRequest, onPost, addToResponse } = params;
  const server = http.createServer().unref();
  const destroyServer = destroyServerFn(server);
  server.on('request', async (request, response) => {
    if (onRequest) onRequest(request.url, request.method, request.headers);
    if (addToResponse) addToResponse(response);

    let pageBody = 'Hello';
    const requestUrl = Url.parse(request.url);
    if (requestUrl.pathname === '/') {
      return response.end(`<html><head></head><body>Hello world</body></html>`);
    }
    if (requestUrl.pathname === '/page1') {
      if (request.method === 'OPTIONS') {
        response.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'X-Custom-Header',
        });
        return response.end('');
      }
      return response.end(
        `<html><head></head><body>
<form action="/page2" method="post"><input type="text" id="input" name="thisText"/><input type="submit" id="submit-button" name="submit"/></form>
</body></html>`,
      );
    }
    if (requestUrl.pathname === '/page2' && request.method === 'POST') {
      let body = '';
      for await (const chunk of request) {
        body += chunk;
      }
      // eslint-disable-next-line no-shadow,@typescript-eslint/no-shadow
      const params = querystring.parse(body);
      pageBody = params.thisText as string;
      if (onPost) onPost(params.thisText as string);
    }
    response.end(`<html><head></head><body>${pageBody}</body></html>`);
  });
  server.listen();
  await new Promise(resolve => server.once('listening', resolve));
  const port = (server.address() as net.AddressInfo).port;

  const baseUrl = `http://localhost:${port}`;
  const httpServer: ITestHttpServer<http.Server> = {
    isClosing: false,
    onlyCloseOnFinal: params.onlyCloseOnFinal ?? false,
    on(eventName, fn) {
      server.on(eventName, fn);
    },
    close() {
      if (httpServer.isClosing) {
        return null;
      }
      httpServer.isClosing = true;
      return destroyServer();
    },
    baseUrl,
    url: `${baseUrl}/`,
    port,
    server,
  };

  needsClosing.push(httpServer);

  return httpServer;
}

export function httpRequest(
  urlStr: string,
  method: string,
  proxyHost: string,
  proxyAuth?: string,
  headers: { [name: string]: string } = {},
  response?: (res: IncomingMessage) => any,
  postData?: Buffer,
): Promise<string> {
  const createdPromise = createPromise();
  const { promise, resolve, reject } = createdPromise;
  const url = new URL(urlStr);
  const urlPort = extractPort(url);
  const urlPath = [url.pathname, url.search].join('');
  const options: any = {
    host: url.hostname,
    port: urlPort,
    method,
    path: urlPath,
    headers: headers || {},
    rejectUnauthorized: false,
  };

  if (proxyHost) {
    options.agent = getProxyAgent(url, proxyHost, proxyAuth);
  }

  const client = url.protocol === 'https:' ? https : http;
  const req = client.request(options, (res): void => {
    if (createdPromise.isResolved) return;
    let data = '';
    if (response) response(res);
    res.on('end', () => resolve(data));
    res.on('data', chunk => (data += chunk));
  });
  req.on('error', reject);
  if (postData) req.write(postData);
  req.end();

  return promise;
}

export function getProxyAgent(url: URL, proxyHost: string, auth?: string): Agent {
  const ProxyAgent = url.protocol === 'https:' ? HttpsProxyAgent : HttpProxyAgent;
  const opts = Url.parse(proxyHost);
  opts.auth = auth;
  return ProxyAgent(opts);
}

export function httpGet(
  urlStr: string,
  proxyHost: string,
  proxyAuth?: string,
  headers: { [name: string]: string } = {},
) {
  return httpRequest(urlStr, 'GET', proxyHost, proxyAuth, headers);
}

export async function http2Get(
  host: string,
  headers: { [':path']: string; [name: string]: string },
  sessionId: string,
  proxyUrl?: string,
): Promise<string> {
  const hostUrl = new URL(host);
  const socketSession = new MitmSocketSession(log, {
    clientHelloId: 'Chrome79',
    rejectUnauthorized: false,
  });
  Helpers.needsClosing.push(socketSession);

  const tlsConnection = getTlsConnection(
    Number(hostUrl.port ?? 443),
    hostUrl.hostname,
    false,
    proxyUrl,
  );
  Helpers.onClose(() => tlsConnection.close());
  await tlsConnection.connect(socketSession);

  const client = http2.connect(host, {
    createConnection: () => tlsConnection.socket,
  });
  Helpers.onClose(() => client.close());
  const responseStream = await client.request(headers);
  await new Promise(resolve => responseStream.once('response', resolve));
  return (await readableToBuffer(responseStream)).toString();
}

export async function runHttp2Server(
  handler: (request: http2.Http2ServerRequest, response: http2.Http2ServerResponse) => void,
): Promise<ITestHttpServer<http2.Http2SecureServer>> {
  const h2ServerStarted = createPromise();
  const sessions = new Set<http2.ServerHttp2Session>();
  const server = http2
    .createSecureServer(sslCerts(), handler)
    .unref()
    .listen(0, () => {
      h2ServerStarted.resolve();
    });
  bindSslListeners(server);
  server.on('session', session => {
    sessions.add(session);
  });
  await h2ServerStarted.promise;
  const port = (server.address() as net.AddressInfo).port;

  const baseUrl = `https://localhost:${port}`;
  const httpServer: ITestHttpServer<http2.Http2SecureServer> = {
    isClosing: false,
    onlyCloseOnFinal: false,
    on(eventName, fn) {
      server.on(eventName, fn);
    },
    close() {
      if (httpServer.isClosing) {
        return null;
      }
      httpServer.isClosing = true;
      for (const session of sessions) {
        session.socket?.unref();
        session.destroy();
      }
      return new Promise(resolve => {
        server.close(() => setTimeout(resolve, 10));
      });
    },
    baseUrl,
    url: `${baseUrl}/`,
    port,
    server,
  };
  needsClosing.push(httpServer);
  return httpServer;
}

export function httpGetWithSocket(
  url: string,
  clientOptions: https.RequestOptions,
  socket: net.Socket,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let isResolved = false;
    socket.once('close', () => {
      if (isResolved) return;
      reject(new Error('Socket closed before resolve'));
    });
    socket.once('error', err => {
      if (isResolved) return;
      reject(err);
    });
    const request = https.get(
      url,
      {
        ...clientOptions,
        agent: null,
        createConnection: () => socket,
      },
      async res => {
        isResolved = true;
        const buffer = await readableToBuffer(res);
        resolve(buffer.toString('utf8'));
      },
    );
    request.on('error', err => {
      if (isResolved) return;
      reject(err);
    });
  });
}

let domListenerId = 1;
export async function waitForElement(jsPath: IJsPath, frame: FrameEnvironment): Promise<void> {
  const listener = frame.tab.addDomStateListener(`${(domListenerId += 1)}`, {
    url: null,
    name: null,
    callsite: `callsite:${domListenerId}`,
    commands: {
      visibility: [
        frame.id,
        'FrameEnvironment.execJsPath',
        [[...jsPath, [getComputedVisibilityFnName]]],
      ],
    },
  });
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      listener.stop({ didMatch: false });
      resolve();
    }, 30e3);
    listener.on('updated', event => {
      const { visibility } = event;
      if (visibility.value?.nodeExists) {
        resolve();
        listener.stop({ didMatch: true });
        clearTimeout(timeout);
      }
    });
  });
}

let sessionId = 0;

export function getTlsConnection(
  serverPort: number,
  host = 'localhost',
  isWebsocket = false,
  proxyUrl?: string,
): MitmSocket {
  const tlsConnection = new MitmSocket(`session${(sessionId += 1)}`, log, {
    host,
    port: String(serverPort),
    servername: host,
    isWebsocket,
    isSsl: true,
    proxyUrl,
  });
  Helpers.onClose(() => tlsConnection.close());
  return tlsConnection;
}

export function getLogo(): Buffer {
  return Fs.readFileSync(`${__dirname}/html/img.png`);
}

export async function readableToBuffer(res: stream.Readable): Promise<Buffer> {
  const buffer: Buffer[] = [];
  for await (const data of res) {
    buffer.push(data);
  }
  return Buffer.concat(buffer);
}

export function afterEach(): Promise<void> {
  return closeAll(false);
}

export async function afterAll(): Promise<void> {
  await closeAll(true);
  await Core.shutdown();
}

async function closeAll(isFinal = false): Promise<void> {
  const closeList = [...needsClosing];
  needsClosing.length = 0;

  await Promise.all(
    closeList.map(async (toClose, i) => {
      if (!toClose.close) {
        // eslint-disable-next-line no-console
        console.log('Error closing', { closeIndex: i });
        return;
      }
      if (toClose.onlyCloseOnFinal && !isFinal) {
        needsClosing.push(toClose);
        return;
      }

      try {
        await toClose.close();
      } catch (err) {
        if (err instanceof CanceledPromiseError) return;
        // eslint-disable-next-line no-console
        console.log('Error shutting down', err);
      }
    }),
  );
}

function bindSslListeners(server: tls.Server): void {
  if (process.env.SSLKEYLOGFILE) {
    const logFile = Fs.createWriteStream(process.env.SSLKEYLOGFILE, { flags: 'a' });
    server.on('keylog', line => logFile.write(line));
  }
}

export function onClose(closeFn: (() => Promise<any>) | (() => any), onlyCloseOnFinal = false) {
  needsClosing.push({ close: closeFn, onlyCloseOnFinal });
}

export function createScriptMeta(module: NodeModule, id: string): IScriptInstanceMeta {
  return {
    workingDirectory: process.cwd(),
    entrypoint: module.filename,
    id,
    startDate: Date.now(),
  };
}

export async function createSession(
  options?: ISessionCreateOptions,
): Promise<{ session: Session; tab: Tab }> {
  const connection = Core.addConnection();
  Helpers.onClose(() => connection.disconnect());
  const meta = await connection.createSession(options);
  const tab = Session.getTab(meta);
  Helpers.needsClosing.push(tab.session);

  return { tab, session: tab.session };
}

function extractPort(url: URL) {
  if (url.port) return url.port;
  if (url.protocol === 'https:') return 443;
  return 80;
}

function destroyServerFn(
  server: http.Server | http2.Http2Server | https.Server,
): () => Promise<void> {
  const connections = new Set<net.Socket>();

  server.on('connection', (conn: net.Socket) => {
    connections.add(conn);
    conn.on('close', () => connections.delete(conn));
  });

  return () =>
    new Promise(resolve => {
      for (const conn of connections) {
        conn.destroy();
      }
      server.close(() => {
        setTimeout(resolve, 10);
      });
    });
}
