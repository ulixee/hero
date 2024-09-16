import * as https from 'https';
import createHttpRequestHandler from '../lib/createHttpRequestHandler';
import createWebsocketHandler from '../lib/createWebsocketHandler';
import IServerContext from '../interfaces/IServerContext';
import BaseServer from './BaseServer';
import { IRoutesByPath } from '../lib/Plugin';
import Certs from './Certs';

export default class HttpServer extends BaseServer {
  private httpsServer: https.Server;

  constructor(port: number, routesByPath: IRoutesByPath) {
    super('https', port, routesByPath);
  }

  public override async start(context: IServerContext): Promise<this> {
    await super.start(context);
    const httpRequestHandler = createHttpRequestHandler(this, context);
    const websocketHandler = createWebsocketHandler(this, context);

    this.httpsServer = await new Promise<https.Server>((resolve) => {
      const server = https.createServer(Certs(), httpRequestHandler);
      server.on('upgrade', websocketHandler);
      server.listen(this.port, () => resolve(server));
    });

    return this;
  }

  public async stop(): Promise<any> {
    this.httpsServer.close();
    console.log(`HTTPS Server closed (port: ${this.port}`);
  }
}
