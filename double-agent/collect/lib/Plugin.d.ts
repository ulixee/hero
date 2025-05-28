import { EventEmitter } from 'events';
import { AssignmentType } from '@double-agent/collect-controller/interfaces/IAssignment';
import IPlugin from '../interfaces/IPlugin';
import IRequestContext from '../interfaces/IRequestContext';
import { IServerProtocol } from '../servers/BaseServer';
import TlsServer from '../servers/TlsServer';
import HttpServer from '../servers/HttpServer';
import HttpsServer from '../servers/HttpsServer';
import ISessionPage from '../interfaces/ISessionPage';
import Session from './Session';
import Http2Server from '../servers/Http2Server';
export type IHandlerFn = (ctx: IRequestContext) => Promise<void> | void;
type IRoutableServerProtocol = IServerProtocol | 'ws' | 'wss';
type IFlexibleServerProtocol = IRoutableServerProtocol | 'all' | 'allHttp1';
export interface IRoute {
    protocol: IRoutableServerProtocol;
    path: string;
    handlerFn: IHandlerFn;
    preflightHandlerFn?: IHandlerFn;
    isAsset?: true;
}
export interface IRoutesByPath {
    [path: string]: IRoute;
}
export interface IPluginPage {
    route: IRoute;
    domain?: string;
    clickNext?: boolean;
    waitForReady?: boolean;
    isRedirect?: boolean;
    name?: string;
    data?: any;
}
interface IPagesByAssignmentType {
    [AssignmentType.Individual]: IPluginPage[];
    [AssignmentType.OverTime]: IPluginPage[];
}
export default abstract class Plugin extends EventEmitter implements IPlugin {
    id: string;
    dir: string;
    summary: string;
    outputFiles: number;
    pagesByAssignmentType: IPagesByAssignmentType;
    protected routes: {
        [protocol: string]: {
            [path: string]: IRoute;
        };
    };
    protected httpServer: HttpServer;
    protected httpsServer: HttpsServer;
    protected http2Server: Http2Server;
    protected tlsServerBySessionId: {
        [sessionId: string]: TlsServer;
    };
    constructor(pluginDir: string);
    abstract initialize(): void;
    pagesForSession(session: Session): ISessionPage[];
    convertToSessionPage(page: IPluginPage, sessionId: string, pageIndex: number): ISessionPage;
    createServersForSession(session: Session): Promise<void>;
    onServerStart(protocol: IServerProtocol, callback: () => void): void;
    onServerStop(protocol: IServerProtocol, callback: () => void): void;
    stop(): Promise<void>;
    closeServersForSession(sessionId: string): Promise<void>;
    getServer(protocol: IRoutableServerProtocol, sessionId: string, currentProtocol?: IServerProtocol): Http2Server | HttpsServer | HttpServer | TlsServer;
    protected registerRoute(protocol: IFlexibleServerProtocol, path: string, handlerFn: IHandlerFn, preflightHandlerFn?: IHandlerFn): void;
    protected registerAsset(protocol: IFlexibleServerProtocol, path: string, handler: IHandlerFn): void;
    protected registerPages(...pages: IPluginPage[]): void;
    protected registerPagesOverTime(...pages: IPluginPage[]): void;
    private createServer;
}
export {};
