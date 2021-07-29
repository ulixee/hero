import * as WebSocket from 'ws';
import Core, { GlobalPool } from '@ulixee/hero-core';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import ICoreResponsePayload from '@ulixee/hero-interfaces/ICoreResponsePayload';
import ICoreEventPayload from '@ulixee/hero-interfaces/ICoreEventPayload';

(async () => {
  await Core.start();
  const server = new CoreServer(1337);

  Core.onShutdown = () => {
    console.log('Exiting Core Process');
    server.close();
    process.exit();
  };
  GlobalPool.events.on('browser-has-no-open-windows', ({ puppet }) => puppet.close());
  GlobalPool.events.on('all-browsers-closed', () => Core.shutdown());
})().catch(error => {
  console.log('ERROR starting core', error);
  process.exit(1);
});

class CoreServer {
  private readonly wsServer: WebSocket.Server;

  constructor(port: number) {
    this.wsServer = new WebSocket.Server({
      port,
    });
    this.wsServer.on('connection', this.handleWsConnection.bind(this));
  }

  public close(): void {
    try {
      for (const ws of this.wsServer.clients) {
        if (isOpen(ws)) ws.terminate();
      }
      this.wsServer.close();
    } catch (error) {
      console.log('Error closing socket connections', error);
    }
  }

  private handleWsConnection(ws: WebSocket): void {
    const connection = Core.addConnection();
    ws.on('message', message => {
      const payload = TypeSerializer.parse(message.toString(), 'CLIENT');
      return connection.handleRequest(payload);
    });

    ws.once('close', () => connection.disconnect());
    ws.once('error', error => connection.disconnect(error));

    connection.on('message', this.sendMessage.bind(this, ws));
  }

  private sendMessage(ws: WebSocket, payload: ICoreResponsePayload | ICoreEventPayload): void {
    if (!isOpen(ws)) return;

    const json = TypeSerializer.stringify(payload);
    ws.send(json, error => {
      if (!error) return;
      console.log('Error sending message', error, json);

      if (isOpen(ws)) {
        const CLOSE_UNEXPECTED_ERROR = 1011;
        ws.close(CLOSE_UNEXPECTED_ERROR, JSON.stringify({ message: error.message }));
      }
    });
  }
}

function isOpen(ws: WebSocket) {
  return ws.readyState === WebSocket.OPEN;
}
