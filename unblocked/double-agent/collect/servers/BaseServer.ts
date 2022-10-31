import * as http from 'http';
import * as http2 from 'http2';
import { URL } from 'url';
import IServerContext from '../interfaces/IServerContext';
import Plugin, { IHandlerFn, IRoute, IRoutesByPath } from '../lib/Plugin';

export type IServerProtocol = 'tls' | 'http' | 'https' | 'http2';

export default class BaseServer {
  public port: number;
  public protocol: IServerProtocol;

  private readonly routesByPath: IRoutesByPath = {};
  private context: IServerContext;

  constructor(protocol: IServerProtocol, port: number, routesByPath: IRoutesByPath) {
    this.protocol = protocol;
    this.port = port;
    this.routesByPath = routesByPath;
  }

  public get plugin(): Plugin {
    return this.context.plugin;
  }

  public async start(context: IServerContext): Promise<this> {
    this.context = context;
    return this;
  }

  public getRequestUrl(req: http.IncomingMessage | http2.Http2ServerRequest): URL {
    const host = req instanceof http2.Http2ServerRequest ? req.authority : req.headers.host;
    return new URL(`${this.protocol}://${host}${req.url}`);
  }

  public cleanPath(rawPath: string): string {
    return rawPath.replace(new RegExp(`^/${this.plugin.id}`), '');
  }

  public getHandlerFn(rawPath: string): IHandlerFn {
    const cleanedPath = this.cleanPath(rawPath);
    return this.routesByPath[cleanedPath]?.handlerFn;
  }

  public getRoute(rawPath: string): IRoute {
    const cleanedPath = this.cleanPath(rawPath);
    return this.routesByPath[cleanedPath];
  }
}
