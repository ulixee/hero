import * as http2 from 'http2';
import IServerContext from '../interfaces/IServerContext';
import BaseServer from './BaseServer';
import { IRoutesByPath } from '../lib/Plugin';
export interface IHttp2SessionActivity {
    type: string;
    data?: any;
}
export default class Http2Server extends BaseServer {
    sessions: {
        session: http2.ServerHttp2Session;
        id: string;
        activity: IHttp2SessionActivity[];
    }[];
    private http2Server;
    constructor(port: number, routesByPath: IRoutesByPath);
    start(context: IServerContext): Promise<this>;
    stop(): Promise<any>;
}
