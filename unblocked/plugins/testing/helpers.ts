import * as Fs from 'fs';
import * as Path from 'path';
import * as http from 'http';
import { RequestListener, Server } from 'http';
import * as https from 'https';
import * as Koa from 'koa';
import * as KoaRouter from '@koa/router';
import * as KoaMulter from '@koa/multer';
import * as net from 'net';
import * as http2 from 'http2';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import Logger from '@ulixee/commons/lib/Logger';
import { TestLogger } from './index';

const { log } = Logger(module);

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

export async function runHttpsServer(
  handler: RequestListener,
  onlyCloseOnFinal = false,
): Promise<ITestHttpServer<https.Server>> {
  const options = {
    key: Fs.readFileSync(`${__dirname}/certs/key.pem`),
    cert: Fs.readFileSync(`${__dirname}/certs/cert.pem`),
  };

  const server = https.createServer(options, handler).listen(0).unref();
  await new Promise(resolve => server.once('listening', resolve));

  const destroyServer = destroyServerFn(server);
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
export function getLogo(): Buffer {
  return Fs.readFileSync(`${__dirname}/html/img.png`);
}

export async function beforeEach(): Promise<void> {
  TestLogger.testNumber += 1;
}

export function afterEach(): Promise<void> {
  return closeAll(false);
}

export async function afterAll(): Promise<void> {
  await closeAll(true);
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

export function onClose(closeFn: (() => Promise<any>) | (() => any), onlyCloseOnFinal = false) {
  needsClosing.push({ close: closeFn, onlyCloseOnFinal });
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
