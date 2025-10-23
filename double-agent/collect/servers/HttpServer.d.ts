import IServerContext from '../interfaces/IServerContext';
import BaseServer from './BaseServer';
import { IRoutesByPath } from '../lib/Plugin';
export default class HttpServer extends BaseServer {
    private httpServer;
    constructor(port: number, routesByPath: IRoutesByPath);
    start(context: IServerContext): Promise<this>;
    stop(): Promise<any>;
}
