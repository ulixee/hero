import { AddressInfo, ListenOptions } from 'net';
import WebSocket from 'ws';
import Log from '@secret-agent/commons/Logger';
import * as http from 'http';
import { createPromise } from '@secret-agent/commons/utils';
import TypeSerializer from '@secret-agent/commons/TypeSerializer';
import Replayer from '@secret-agent/session-state/api/Replayer';
import Core from '../index';

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

  private readonly replayer = new Replayer();

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
      log.info('ReplayServer.closeSessions', { waitForOpenConnections, sessionId: null });
      const closeReplayer = this.replayer.close([...this.wsServer.clients], waitForOpenConnections);
      await new Promise(resolve => {
        this.httpServer.close(async () => {
          await closeReplayer;
          setImmediate(resolve);
        });
      });
    } catch (error) {
      log.error('Error closing socket connections', {
        error,
        sessionId: null,
      });
    }
  }

  private handleConnection(ws: WebSocket, request: http.IncomingMessage): void {
    if (request.url === '/') {
      const coreConnection = Core.addConnection();
      ws.on('message', message => {
        const payload = TypeSerializer.parse(message.toString());
        return coreConnection.handleRequest(payload);
      });

      coreConnection.on('message', payload => {
        if (ws.readyState !== WebSocket.OPEN) return;

        const json = TypeSerializer.stringify(payload);
        ws.send(json, error => {
          if (error) {
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
      });
    } else if (request.url === '/replay') {
      this.replayer.handleConnection(ws, request).catch(error => {
        log.error('Error handling replay session', {
          error,
          sessionId: request.headers['session-id'] as string,
        });
      });
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
