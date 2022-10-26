import '@ulixee/commons/lib/SourceMapSupport';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import * as WebSocket from 'ws';
import Core from '@ulixee/hero-core';
import { WsTransportToClient } from '@ulixee/net';
import { version } from '@ulixee/hero-core/package.json';
import UlixeeServerConfig from '@ulixee/commons/config/servers';
import { AddressInfo } from 'net';
import { IncomingMessage } from 'http';

/**
 * This is a simple CoreServer that can be used as a starting point for your own server (or integration with an existing server).
 */
class CoreServer {
  public addressPromise: Promise<string>;
  private wsServer: WebSocket.Server;

  constructor(port: number) {
    this.addressPromise = new Promise<string>(resolve => {
      this.wsServer = new WebSocket.Server({ port }, () => {
        const address = this.wsServer.address() as AddressInfo;
        resolve(`localhost:${address.port}`);
      });
    });
    this.wsServer.on('connection', this.handleWsConnection.bind(this));

    ShutdownHandler.register(() => this.close());
  }

  public async open(): Promise<void> {
    await Core.start();
    const address = await this.addressPromise;
    await UlixeeServerConfig.global.setVersionHost(version, address);
    ShutdownHandler.register(() => UlixeeServerConfig.global.setVersionHost(version, null));

    console.log('Started server at %s', address);
  }

  public async close(): Promise<void> {
    try {
      this.wsServer.close();
    } catch (error) {
      console.log('Error closing socket connections', error);
    }
    await Core.shutdown();
  }

  private handleWsConnection(ws: WebSocket, req: IncomingMessage): void {
    const transport = new WsTransportToClient(ws, req);
    const connection = Core.addConnection(transport);
    ShutdownHandler.register(() => connection.disconnect());
  }
}

(async () => {
  const port = parseInt(process.argv[2] ?? '1337', 10);
  const server = new CoreServer(port);
  await server.open();
})().catch(console.error);
