import * as http from 'http';
import * as http2 from 'http2';
import { URL } from 'url';
import IServerContext from '../interfaces/IServerContext';
import Plugin, { IHandlerFn, IRoute, IRoutesByPath } from '../lib/Plugin';
export type IServerProtocol = 'tls' | 'http' | 'https' | 'http2';
export default class BaseServer {
    port: number;
    protocol: IServerProtocol;
    private readonly routesByPath;
    private context;
    constructor(protocol: IServerProtocol, port: number, routesByPath: IRoutesByPath);
    get plugin(): Plugin;
    start(context: IServerContext): Promise<this>;
    getRequestUrl(req: http.IncomingMessage | http2.Http2ServerRequest): URL;
    cleanPath(rawPath: string): string;
    getHandlerFn(rawPath: string): IHandlerFn;
    getRoute(rawPath: string): IRoute;
}
