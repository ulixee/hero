import '@ulixee/commons/lib/SourceMapSupport';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import * as WebSocket from 'ws';
import Core from '@ulixee/hero-core';
import { WsTransportToClient } from '@ulixee/net';
import { version } from '@ulixee/hero-core/package.json';
import UlixeeServerConfig from '@ulixee/commons/config/servers';
import { AddressInfo } from 'net';

/**
 * This is a simple CoreServer that you would probably not ever use beyond simple examples.
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
    const address = await this.addressPromise;
    await UlixeeServerConfig.global.setVersionHost(version, address);
    ShutdownHandler.register(() => UlixeeServerConfig.global.setVersionHost(version, null));
    Core.events.on('all-browsers-closed', () => Core.shutdown());
    Core.events.on('browser-has-no-open-windows', ({ browser }) => browser.close());

    console.log('Started server at %s', address);
  }

  public close(): void {
    try {
      this.wsServer.close();
    } catch (error) {
      console.log('Error closing socket connections', error);
    }
  }

  private handleWsConnection(ws: WebSocket): void {
    const transport = new WsTransportToClient(ws);
    const connection = Core.addConnection(transport);
    ShutdownHandler.register(() => connection.disconnect());
  }
}

(async () => {
  const port = parseInt(process.argv[2] ?? '1337', 10);
  const server = new CoreServer(port);
  await server.open();
})().catch(console.error);
