import TlsServerBase from '@double-agent/tls-server';
import IServerContext from '../interfaces/IServerContext';
import createTlsRequestHandler from '../lib/createTlsRequestHandler';
import BaseServer from './BaseServer';
import { IRoutesByPath } from '../lib/Plugin';
import { tlsCerts } from './Certs';

export default class TlsServer extends BaseServer {
  private internalServer: TlsServerBase;

  constructor(port: number, routesByPath: IRoutesByPath) {
    super('tls', port, routesByPath);
  }

  public override async start(context: IServerContext): Promise<this> {
    await super.start(context);
    const tlsRequestHandler = createTlsRequestHandler(this, context);

    this.internalServer = new TlsServerBase(tlsCerts(), tlsRequestHandler);
    await new Promise<void>(resolve => this.internalServer.listen(this.port, resolve));
    this.internalServer.on('error', error => {
      console.log('TlsServer ERROR: ', error);
      if (error.toString().includes('ENOMEM')) {
        process.exit(1);
      }
    });
    return this;
  }

  public async stop(): Promise<any> {
    this.internalServer.close();
    console.log(`TLS Server closed (port: ${this.port})`);
  }
}
