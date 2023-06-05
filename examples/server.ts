import '@ulixee/commons/lib/SourceMapSupport';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import WebSocket = require('ws');
import Core from '@ulixee/hero-core';
import { WsTransportToClient } from '@ulixee/net';
import { version } from '@ulixee/hero-core/package.json';
import UlixeeHostsConfig from '@ulixee/commons/config/hosts';
import { AddressInfo } from 'net';
import { IncomingMessage } from 'http';

/**
 * This is a simple HeroCore Server that can be used as a starting point for your own server (or integration with an existing server).
 */
class CoreServer {
  public addressPromise: Promise<string>;
  private wsServer: WebSocket.Server;
  private core: Core;

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
    this.core = await Core.start();
    const address = await this.addressPromise;
    await UlixeeHostsConfig.global.setVersionHost(version, address);
    ShutdownHandler.register(() => UlixeeHostsConfig.global.setVersionHost(version, null));

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
    const connection = this.core.addConnection(transport);
    ShutdownHandler.register(() => connection.disconnect());
  }
}

(async () => {
  const port = parseInt(process.argv[2] ?? '1337', 10);
  const coreServer = new CoreServer(port);
  await coreServer.open();
})().catch(console.error);
