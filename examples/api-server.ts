import '@ulixee/commons/lib/SourceMapSupport';
import * as Http from 'http';
import ConnectionToClient from '@ulixee/net/lib/ConnectionToClient';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import { heroApiHandlers } from '@ulixee/hero-core/apis';
import Core from '@ulixee/hero-core';
import HttpTransportToClient from '@ulixee/net/lib/HttpTransportToClient';

class CoreApiServer {
  private readonly httpServer: Http.Server;

  constructor(port: number) {
    this.httpServer = new Http.Server(this.onRequest.bind(this));
    this.httpServer.listen(port);
  }

  public close(): void {
    try {
      this.httpServer.close();
    } catch (error) {
      console.log('Error closing socket connections', error);
    }
  }

  // This example server expects requests of the format: http://localhost:1337/Session.find with a request body containing the data.
  // No MessageId is needed.
  //
  // NOTE: Change this to meet your requirements
  private async onRequest(req: Http.IncomingMessage, res: Http.ServerResponse): Promise<void> {
    const transport = new HttpTransportToClient(req, res);
    const connection = new ConnectionToClient(transport, heroApiHandlers);
    await transport.readRequest();
    await connection.disconnect();
  }
}

(() => {
  if (process.argv[2]) {
    Core.dataDir = process.argv[2].startsWith('/')
      ? process.argv[2]
      : `${process.cwd()}/${process.argv[2]}`;
    console.log('Loaded data dir from %s', Core.dataDir);
  }
  const server = new CoreApiServer(1337);
  ShutdownHandler.register(() => {
    server.close();
    return Promise.resolve();
  });
})();
