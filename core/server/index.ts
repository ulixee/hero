import { AddressInfo, ListenOptions, Socket } from 'net';
import * as WebSocket from 'ws';
import Log from '@secret-agent/commons/Logger';
import * as http from 'http';
import { IncomingMessage, ServerResponse } from 'http';
import { createPromise } from '@secret-agent/commons/utils';
import TypeSerializer from '@secret-agent/commons/TypeSerializer';

import Core, { GlobalPool } from '../index';
import ConnectionToReplay from './ConnectionToReplay';
import InjectedScripts from '../lib/InjectedScripts';
import * as pkg from '../package.json';
import SessionDb from '../dbs/SessionDb';

const { log } = Log(module);
const CLOSE_UNEXPECTED_ERROR = 1011;

export default class CoreServer {
  public get address(): Promise<string> {
    return this.serverAddress.promise.then(x => {
      return `ws://${this.addressHost}:${x.port}`;
    });
  }

  public get hasConnections() {
    return this.wsServer.clients.size > 0;
  }

  private sockets = new Set<Socket>();
  private serverAddress = createPromise<AddressInfo>();
  private readonly addressHost: string;
  private readonly wsServer: WebSocket.Server;
  private readonly httpServer: http.Server;
  private readonly pendingReplaysByWebSocket = new WeakMap<WebSocket, Promise<void>>();

  private readonly routes: [
    RegExp | string,
    (req: http.IncomingMessage, res: http.ServerResponse, params: string[]) => void,
  ][];

  constructor(addressHost = 'localhost') {
    this.httpServer = new http.Server();
    this.httpServer.on('error', this.onHttpError.bind(this));
    this.httpServer.on('request', this.onRequest.bind(this));
    this.httpServer.on('connection', this.httpConnection.bind(this));
    this.addressHost = addressHost;
    this.wsServer = new WebSocket.Server({ server: this.httpServer });
    this.wsServer.on('connection', this.handleWsConnection.bind(this));
    this.routes = [
      ['/replay/domReplayer.js', this.handleReplayerScriptRequest.bind(this)],
      [/\/replay\/([\d\w-]+)\/resource\/(\d+)/, this.handleResourceRequest.bind(this)],
    ];
  }

  public listen(options: ListenOptions): Promise<AddressInfo> {
    if (this.serverAddress.isResolved) return this.serverAddress.promise;

    this.httpServer.once('error', this.serverAddress.reject);
    this.httpServer.listen(options, () => {
      this.httpServer.off('error', this.serverAddress.reject);
      this.serverAddress.resolve(this.httpServer.address() as AddressInfo);
    });
    return this.serverAddress.promise;
  }

  public async close(waitForOpenConnections = true): Promise<void> {
    try {
      const logid = log.stats('CoreServer.Closing', {
        waitForOpenConnections,
        sessionId: null,
      });

      this.httpServer.unref();
      await Promise.all(
        [...this.wsServer.clients].map(async ws => {
          if (waitForOpenConnections) {
            await this.pendingReplaysByWebSocket.get(ws);
          }
          if (isOpen(ws)) {
            ws.terminate();
          }
        }),
      );

      for (const socket of this.sockets) {
        socket.unref();
        socket.destroy();
      }

      if (this.httpServer.listening) this.httpServer.close();
      log.stats('CoreServer.Closed', { parentLogId: logid, sessionId: null });
    } catch (error) {
      log.error('Error closing socket connections', {
        error,
        sessionId: null,
      });
    }
  }

  private onRequest(req: IncomingMessage, res: ServerResponse): void {
    for (const [route, handlerFn] of this.routes) {
      if (route instanceof RegExp && route.test(req.url)) {
        const args = route.exec(req.url);
        handlerFn(req, res, args?.length ? args.slice(1) : []);
        return;
      }
      if (req.url === route) {
        return handlerFn(req, res, []);
      }
    }
    res.writeHead(404);
    res.end('Route not found');
  }

  private httpConnection(socket: Socket): void {
    this.sockets.add(socket);
    socket.on('close', () => this.sockets.delete(socket));
  }

  private async handleWsConnection(ws: WebSocket, request: http.IncomingMessage): Promise<void> {
    if (request.url === '/') {
      const connection = Core.addConnection();
      ws.on('message', message => {
        const payload = TypeSerializer.parse(message.toString(), 'CLIENT');
        return connection.handleRequest(payload);
      });

      ws.once('close', () => connection.disconnect());
      ws.once('error', error => connection.disconnect(error));

      connection.on('message', async payload => {
        const json = TypeSerializer.stringify(payload);
        try {
          await wsSend(ws, json);
        } catch (error) {
          if (connection.isClosing === false) {
            log.error('Error sending message', {
              error,
              payload,
              sessionId: null,
            });
          }
          if (isOpen(ws)) {
            ws.close(CLOSE_UNEXPECTED_ERROR, JSON.stringify({ message: error.message }));
          }
        }
      });
    } else if (request.url === '/replay') {
      const isComplete = createPromise();
      this.pendingReplaysByWebSocket.set(ws, isComplete.promise);
      try {
        const connection = new ConnectionToReplay(wsSend.bind(null, ws), request);
        ws.once('close', connection.close.bind(connection));
        ws.once('error', connection.close.bind(connection));
        await connection.handleRequest();
      } finally {
        if (isOpen(ws)) ws.close();
        this.pendingReplaysByWebSocket.delete(ws);
      }
    }
  }

  private onHttpError(error: Error) {
    log.warn('Error on CoreServer.httpServer', {
      error,
      sessionId: null,
    });
  }

  private handleReplayerScriptRequest(_: IncomingMessage, res: ServerResponse): void {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Filename', `domReplayer-${pkg.version}.js`);
    res.end(InjectedScripts.getReplayScript());
  }

  private async handleResourceRequest(
    req: IncomingMessage,
    res: ServerResponse,
    [sessionId, resourceId],
  ): Promise<void> {
    const dataDir = (req.headers['x-data-location'] as string) ?? GlobalPool.sessionsDir;
    const db = new SessionDb(dataDir, sessionId, { readonly: true });
    const endDate = new Date().getTime() + 5e3;
    do {
      const resource = db.resources.getResponse(Number(resourceId));
      req.socket.setKeepAlive(true);
      if (resource) {
        const headers = JSON.parse(resource.responseHeaders ?? '{}');
        const responseHeaders: any = {
          connection: 'keep-alive',
          'content-encoding': resource.responseEncoding,
          'x-replay-agent': `Secret Agent Replay v${pkg.version}`,
          'x-original-headers': resource.responseHeaders,
        };
        const location = headers.location ?? headers.Location;
        if (location) responseHeaders.location = location;
        const contentType = headers['content-type'] || headers['Content-Type'];
        if (contentType) responseHeaders['content-type'] = contentType;

        res.writeHead(resource.statusCode, '', responseHeaders);
        res.end(resource.responseData);
        return;
      }
      await new Promise(setImmediate);
    } while (endDate > new Date().getTime());

    res.writeHead(404).end('Not found');
  }
}

function isOpen(ws: WebSocket) {
  return ws.readyState === WebSocket.OPEN;
}

async function wsSend(ws: WebSocket, json: string): Promise<void> {
  // give it a second to breath
  await new Promise(process.nextTick);
  if (!isOpen(ws)) return;
  await new Promise<void>((resolve, reject) => {
    ws.send(json, error => {
      if (error) reject(error);
      else resolve();
    });
  });
}
