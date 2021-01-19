import { AddressInfo, ListenOptions } from 'net';
import WebSocket from 'ws';
import Log from '@secret-agent/commons/Logger';
import * as http from 'http';
import { createPromise } from '@secret-agent/commons/utils';
import TypeSerializer from '@secret-agent/commons/TypeSerializer';
import Core from '../index';
import ConnectionToReplay from './ConnectionToReplay';

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

  private serverAddress = createPromise<AddressInfo>();
  private readonly addressHost: string;
  private readonly wsServer: WebSocket.Server;
  private readonly httpServer: http.Server;
  private readonly pendingReplaysByWebSocket = new WeakMap<WebSocket, Promise<void>>();

  constructor(addressHost = 'localhost') {
    this.httpServer = new http.Server();
    this.httpServer.on('error', this.onHttpError.bind(this));
    this.addressHost = addressHost;
    this.wsServer = new WebSocket.Server({ server: this.httpServer });
    this.wsServer.on('connection', this.handleConnection.bind(this));
  }

  public listen(options: ListenOptions): Promise<AddressInfo> {
    this.httpServer.once('error', this.serverAddress.reject);
    this.httpServer.listen(options, () => {
      this.httpServer.off('error', this.serverAddress.reject);
      this.serverAddress.resolve(this.httpServer.address() as AddressInfo);
    });
    return this.serverAddress.promise;
  }

  public async close(waitForOpenConnections = true): Promise<void> {
    try {
      const logid = log.info('CoreServer.ClosingSessions', {
        waitForOpenConnections,
        sessionId: null,
      });

      const closeReplayPromises = [...this.wsServer.clients].map(async ws => {
        if (waitForOpenConnections) {
          await this.pendingReplaysByWebSocket.get(ws);
        }
        if (isOpen(ws)) ws.terminate();
      });

      await Promise.all([
        ...closeReplayPromises,
        new Promise(resolve => {
          this.httpServer.close(() => setImmediate(resolve));
        }),
      ]);
      log.info('CoreServer.ClosedSessions', { parentLogId: logid, sessionId: null });
    } catch (error) {
      log.error('Error closing socket connections', {
        error,
        sessionId: null,
      });
    }
  }

  private async handleConnection(ws: WebSocket, request: http.IncomingMessage): Promise<void> {
    if (request.url === '/') {
      const connection = Core.addConnection();
      ws.on('message', message => {
        const payload = TypeSerializer.parse(message.toString());
        return connection.handleRequest(payload);
      });

      connection.on('message', async payload => {
        const json = TypeSerializer.stringify(payload);
        try {
          await wsSend(ws, json);
        } catch (error) {
          log.error('Error sending message', {
            error,
            payload,
            sessionId: null,
          });
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
