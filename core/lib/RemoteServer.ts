import { AddressInfo, ListenOptions } from 'net';
import WebSocket from 'ws';
import Log from '@secret-agent/commons/Logger';
import * as http from 'http';
import * as url from 'url';
import Core from '../index';

const { log } = Log(module);

export default class RemoteServer {
  public get port() {
    return (this.httpServer.address() as AddressInfo).port;
  }

  public get hasConnections() {
    return this.wsServer.clients.size > 0;
  }

  private readonly wsServer: WebSocket.Server;
  private readonly httpServer: http.Server;

  constructor() {
    this.httpServer = new http.Server();
    this.wsServer = new WebSocket.Server({ server: this.httpServer });
    this.wsServer.on('connection', this.handleConnection);
  }

  public listen(options: ListenOptions): Promise<AddressInfo> {
    return new Promise<AddressInfo>((resolve, reject) => {
      this.httpServer.on('error', reject);
      this.httpServer.listen(options, () => {
        this.httpServer.off('error', reject);
        resolve(this.httpServer.address() as AddressInfo);
      });
    });
  }

  public close(): Promise<void> {
    return new Promise<void>(resolve => {
      try {
        const promises = [...this.wsServer.clients].map(ws => ws.terminate());
        this.httpServer.close(async () => {
          await Promise.all(promises);
          setImmediate(resolve);
        });
      } catch (error) {
        log.error('Error closing socket connections', {
          error,
          sessionId: null,
        });
        resolve();
      }
    });
  }

  private handleConnection(ws: WebSocket, request: http.IncomingMessage): void {
    const requestUrl = url.parse(request.url);

    if (requestUrl.pathname === '/') {
      const coreConnection = Core.addConnection();
      ws.on('message', message => {
        const payload = JSON.parse(message.toString());
        return coreConnection.handleRequest(payload);
      });

      coreConnection.on('message', payload => {
        const json = JSON.stringify(payload);
        ws.send(json, error => {
          if (error) {
            log.error('Error sending message', {
              error,
              sessionId: null,
            });
            ws.close(500, JSON.stringify({ message: error.message }));
          }
        });
      });
    } else if (requestUrl.pathname === '/replay') {
      // tbd:
    }
  }
}
