import * as Path from 'path';
import { URL } from 'url';
import { EventEmitter } from 'events';
import { AssignmentType } from '@double-agent/collect-controller/interfaces/IAssignment';
import Config from '@double-agent/config';
import IPlugin from '../interfaces/IPlugin';
import IRequestContext from '../interfaces/IRequestContext';
import { IServerProtocol } from '../servers/BaseServer';
import TlsServer from '../servers/TlsServer';
import HttpServer from '../servers/HttpServer';
import HttpsServer from '../servers/HttpsServer';
import IServerContext from '../interfaces/IServerContext';
import ISessionPage from '../interfaces/ISessionPage';
import { addPageIndexToUrl, addSessionIdToUrl } from './DomainUtils';
import Document from './Document';
import Session from './Session';
import Http2Server from '../servers/Http2Server';

enum Protocol {
  all = 'all',
  allHttp1 = 'allHttp1',
  http = 'http',
  https = 'https',
  http2 = 'http2',
  ws = 'ws',
  wss = 'wss',
  tls = 'tls',
}

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

const releasedPorts: number[] = [];
let portCounter = Config.collect.pluginStartingPort;

interface IPagesByAssignmentType {
  [AssignmentType.Individual]: IPluginPage[];
  [AssignmentType.OverTime]: IPluginPage[];
}

export default abstract class Plugin extends EventEmitter implements IPlugin {
  public id: string;
  public dir: string;
  public summary: string;
  public outputFiles = 1;

  public pagesByAssignmentType: IPagesByAssignmentType = {
    [AssignmentType.Individual]: [],
    [AssignmentType.OverTime]: [],
  };

  protected routes: { [protocol: string]: { [path: string]: IRoute } } = {};

  protected httpServer: HttpServer;
  protected httpsServer: HttpsServer;
  protected http2Server: Http2Server;
  protected tlsServerBySessionId: { [sessionId: string]: TlsServer } = {};

  constructor(pluginDir: string) {
    super();
    this.dir = pluginDir;
    this.id = Path.basename(pluginDir);
    // eslint-disable-next-line global-require,import/no-dynamic-require
    const packageJson = require(`${pluginDir}/package.json`);
    if (packageJson) {
      this.summary = packageJson.description;
    }
    this.initialize();
  }

  abstract initialize(): void;

  public pagesForSession(session: Session): ISessionPage[] {
    return this.pagesByAssignmentType[session.assignmentType].map(
      (page: IPluginPage, pageIndex: number) => {
        return this.convertToSessionPage(page, session.id, pageIndex);
      },
    );
  }

  public convertToSessionPage(
    page: IPluginPage,
    sessionId: string,
    pageIndex: number,
  ): ISessionPage {
    const { protocol, path } = page.route;
    const { MainDomain, TlsDomain } = Config.collect.domains;
    const domain = page.domain || (protocol === Protocol.tls ? TlsDomain : MainDomain);
    const server = this.getServer(protocol, sessionId);

    let urlProtocol = protocol;
    if (protocol === Protocol.tls || protocol === Protocol.http2) {
      urlProtocol = Protocol.https;
    }
    const baseUrl = `${urlProtocol}://${domain}:${server.port}`;
    const fullPath = `/${this.id}${path.startsWith('/') ? path : `/${path}`}`;

    let url = new URL(fullPath, baseUrl).href;
    url = addPageIndexToUrl(url, pageIndex);
    url = addSessionIdToUrl(url, sessionId);

    const sessionPage: ISessionPage = { url };
    if (page.waitForReady || page.clickNext) {
      sessionPage.waitForElementSelector = Document.waitForElementSelector;
    }

    if (page.isRedirect) {
      sessionPage.isRedirect = page.isRedirect;
    }

    if (page.clickNext) {
      sessionPage.clickElementSelector = Document.clickElementSelector;
    }

    return sessionPage;
  }

  public async createServersForSession(session: Session): Promise<void> {
    if (!this.pagesByAssignmentType[session.assignmentType].length) return;
    const { sessionTracker, pluginDelegate } = session;
    const serverContext = { sessionTracker, pluginDelegate, plugin: this };
    for (const [protocol, routesByPath] of Object.entries(this.routes)) {
      if (protocol === Protocol.ws) {
        await this.createServer(Protocol.http, serverContext, session.id, routesByPath);
        await this.createServer(Protocol.https, serverContext, session.id, routesByPath);
        await this.createServer(Protocol.http2, serverContext, session.id, routesByPath);
      }
      await this.createServer(protocol as IServerProtocol, serverContext, session.id, routesByPath);
    }
  }

  public onServerStart(protocol: IServerProtocol, callback: () => void): void {
    this.once(`${protocol}-started`, callback);
  }

  public onServerStop(protocol: IServerProtocol, callback: () => void): void {
    this.once(`${protocol}-stopped`, callback);
  }

  public async stop(): Promise<void> {
    await Promise.all([this.http2Server?.stop(), this.httpServer?.stop(), this.httpsServer.stop()]);
    for (const tls of Object.values(this.tlsServerBySessionId)) {
      await tls.stop();
    }
  }

  public async closeServersForSession(sessionId: string): Promise<void> {
    if (!this.tlsServerBySessionId[sessionId]) return;
    await this.tlsServerBySessionId[sessionId].stop();
    releasedPorts.push(this.tlsServerBySessionId[sessionId].port);
    delete this.tlsServerBySessionId[sessionId];
  }

  public getServer(
    protocol: IRoutableServerProtocol,
    sessionId: string,
    currentProtocol?: IServerProtocol,
  ): Http2Server | HttpsServer | HttpServer | TlsServer {
    if (protocol === Protocol.ws || protocol === Protocol.wss) {
      protocol = currentProtocol;
    }
    if (protocol === Protocol.tls) {
      return this.tlsServerBySessionId[sessionId];
    }
    if (protocol === Protocol.http) {
      return this.httpServer;
    }
    if (protocol === Protocol.https) {
      return this.httpsServer;
    }
    if (protocol === Protocol.http2) {
      return this.http2Server;
    }
  }

  protected registerRoute(
    protocol: IFlexibleServerProtocol,
    path: string,
    handlerFn: IHandlerFn,
    preflightHandlerFn?: IHandlerFn,
  ): void {
    if (protocol === Protocol.all || protocol === Protocol.ws || protocol === Protocol.allHttp1) {
      this.registerRoute(Protocol.http, path, handlerFn, preflightHandlerFn);
      this.registerRoute(Protocol.https, path, handlerFn, preflightHandlerFn);
      if (protocol === Protocol.all) {
        this.registerRoute(Protocol.http2, path, handlerFn, preflightHandlerFn);
      }
      return;
    }

    this.routes[protocol] = this.routes[protocol] || {};
    if (this.routes[protocol][path]) {
      throw new Error(`Path already exists: ${protocol}:${path}`);
    }

    const route: IRoute = {
      protocol,
      path,
      handlerFn: handlerFn.bind(this),
    };
    if (preflightHandlerFn) {
      route.preflightHandlerFn = preflightHandlerFn.bind(this);
    }
    this.routes[protocol][path] = route;
  }

  protected registerAsset(
    protocol: IFlexibleServerProtocol,
    path: string,
    handler: IHandlerFn,
  ): void {
    if (protocol === Protocol.all || protocol === Protocol.allHttp1) {
      this.registerAsset(Protocol.http, path, handler);
      this.registerAsset(Protocol.https, path, handler);
      if (protocol === Protocol.all) {
        this.registerAsset(Protocol.http2, path, handler);
      }
      return;
    }

    this.routes[protocol] = this.routes[protocol] || {};
    if (this.routes[protocol][path]) {
      throw new Error(`Path already exists: ${protocol}:${path}`);
    }

    this.routes[protocol][path] = {
      protocol,
      path,
      handlerFn: handler.bind(this),
      isAsset: true,
    };
  }

  protected registerPages(...pages: IPluginPage[]): void {
    this.pagesByAssignmentType[AssignmentType.Individual] = pages;
  }

  protected registerPagesOverTime(...pages: IPluginPage[]): void {
    this.pagesByAssignmentType[AssignmentType.OverTime] = pages;
  }

  private async createServer(
    protocol: IServerProtocol,
    serverContext: IServerContext,
    sessionId: string,
    routesByPath: IRoutesByPath,
  ): Promise<void> {
    const port = generatePort();
    if (protocol === Protocol.tls) {
      this.tlsServerBySessionId[sessionId] = await new TlsServer(port, routesByPath).start(
        serverContext,
      );
      console.log(`${this.id} listening on ${port} (TLS)`);
    } else if (protocol === Protocol.http) {
      if (this.httpServer) return;
      this.httpServer = await new HttpServer(port, routesByPath).start(serverContext);
      console.log(`${this.id} listening on ${port} (HTTP)`);
    } else if (protocol === Protocol.https) {
      if (this.httpsServer) return;
      this.httpsServer = await new HttpsServer(port, routesByPath).start(serverContext);
      console.log(`${this.id} listening on ${port} (HTTPS)`);
    } else if (protocol === Protocol.http2) {
      if (this.http2Server) return;
      this.http2Server = await new Http2Server(port, routesByPath).start(serverContext);
      console.log(`${this.id} listening on ${port} (HTTP2)`);
    }
    this.emit(`${protocol}-started`);
  }
}

function generatePort(): number {
  if (releasedPorts.length) {
    return releasedPorts.shift();
  }
  if (portCounter > Config.collect.pluginMaxPort) {
    portCounter = Config.collect.pluginStartingPort;
    return portCounter++;
  }
  return (portCounter += 1);
}
