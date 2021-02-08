import * as http from 'http';
import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';
import { createPromise } from '@secret-agent/commons/utils';
import ResourceType from '@secret-agent/core-interfaces/ResourceType';
import INetworkInterceptorDelegate from '@secret-agent/core-interfaces/INetworkInterceptorDelegate';
import IHttpResourceLoadDetails from '@secret-agent/core-interfaces/IHttpResourceLoadDetails';
import IResourceRequest from '@secret-agent/core-interfaces/IResourceRequest';
import IResourceHeaders from '@secret-agent/core-interfaces/IResourceHeaders';
import * as http2 from 'http2';
import IResourceResponse from '@secret-agent/core-interfaces/IResourceResponse';
import net from 'net';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import Log from '@secret-agent/commons/Logger';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import MitmSocket from '@secret-agent/mitm-socket/index';
import MitmRequestAgent from '../lib/MitmRequestAgent';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import { Dns } from '../lib/Dns';
import ResourceState from '../interfaces/ResourceState';

const { log } = Log(module);

export default class RequestSession extends TypedEventEmitter<IRequestSessionEvents> {
  public static sessionById: { [sessionId: string]: RequestSession } = {};
  public static sessionIdByPort: { [port: number]: string } = {};
  public static portsBySessionId: { [sessionId: number]: Set<number> } = {};

  public websocketBrowserResourceIds: {
    [headersHash: string]: IResolvablePromise<string>;
  } = {};

  public isClosing = false;
  public blockedResources: {
    types: ResourceType[];
    urls: string[];
    handlerFn?: (
      request: http.IncomingMessage | http2.Http2ServerRequest,
      response: http.ServerResponse | http2.Http2ServerResponse,
    ) => boolean;
  } = {
    types: [],
    urls: [],
  };

  public requestAgent: MitmRequestAgent;
  public requestedUrls: {
    url: string;
    redirectedToUrl: string;
    redirectChain: string[];
    responseTime: Date;
  }[] = [];

  // use this to bypass the mitm and just return a dummy response (ie for UserProfile setup)
  public bypassAllWithEmptyResponse: boolean;

  public browserRequestIdToTabId = new Map<string, string>();

  protected readonly logger: IBoundLog;

  private readonly resourcesRequestedByBrowser: IResourcePendingBrowserLoad[] = [];

  private readonly dns: Dns;

  constructor(
    readonly sessionId: string,
    readonly useragent: string,
    public upstreamProxyUrl?: string,
    readonly networkInterceptorDelegate: INetworkInterceptorDelegate = { http: {} },
  ) {
    super();
    RequestSession.sessionById[sessionId] = this;
    this.logger = log.createChild(module, {
      sessionId,
    });
    this.requestAgent = new MitmRequestAgent(this);
    this.dns = new Dns(this);
  }

  public async waitForBrowserResourceRequest(ctx: IMitmRequestContext): Promise<ILoadedResource> {
    const referer = ctx.requestLowerHeaders.referer as string;
    const origin = ctx.requestLowerHeaders.origin as string;
    const url = ctx.url.href;
    const method = ctx.method;

    let resource = this.getResourceRequestedByBrowser(
      url,
      method,
      origin,
      referer,
      ctx.isHttp2Push,
    );
    if (!resource) {
      resource = {
        url,
        method,
        origin,
        referer,
        isHttp2Push: ctx.isHttp2Push,
        isRequestedInBrowser: createPromise<IResourcePendingBrowserLoad>(),
      };
      this.resourcesRequestedByBrowser.push(resource);

      // new tab anchor navigations have an issue where they won't trigger on the new tab, so we have to make it move forward
      if (
        ctx.requestLowerHeaders['sec-fetch-mode'] === 'navigate' &&
        ctx.requestLowerHeaders['sec-fetch-dest'] === 'document'
      ) {
        this.browserRequestedResource({
          browserRequestId: 'fallback-navigation',
          resourceType: 'Document',
          referer,
          origin,
          url,
          method,
          hasUserGesture: resource.hasUserGesture,
          isUserNavigation: !!ctx.requestLowerHeaders['sec-fetch-user'],
          documentUrl: url,
        });
      }
    }

    await resource.isRequestedInBrowser.promise;

    const idx = this.resourcesRequestedByBrowser.indexOf(resource);
    if (idx >= 0) this.resourcesRequestedByBrowser.splice(idx, 1);

    return {
      browserRequestId: resource.browserRequestId,
      resourceType: resource.resourceType,
      originType: ctx.originType,
      hasUserGesture: resource.hasUserGesture,
      isUserNavigation: resource.isUserNavigation,
      documentUrl: resource.documentUrl,
    };
  }

  public browserRequestedResource(
    params: Omit<IResourcePendingBrowserLoad, 'isRequestedInBrowser'>,
  ): void {
    if (this.isClosing) return;

    this.browserRequestIdToTabId.set(params.browserRequestId, params.tabId);
    const { url, method, referer, origin } = params;

    let resource = this.getResourceRequestedByBrowser(url, method, origin, referer);

    // don't re-resolve same asset
    if (resource?.isRequestedInBrowser?.isResolved) resource = null;

    if (!resource) {
      resource = {
        url,
        method,
        origin,
        referer,
        isRequestedInBrowser: createPromise<IResourcePendingBrowserLoad>(),
      } as IResourcePendingBrowserLoad;
      this.resourcesRequestedByBrowser.push(resource);
    }

    resource.tabId = params.tabId;
    resource.browserRequestId = params.browserRequestId;
    resource.documentUrl = params.documentUrl;
    resource.resourceType = params.resourceType;
    resource.hasUserGesture = params.hasUserGesture;
    resource.isUserNavigation = params.isUserNavigation;
    resource.isRequestedInBrowser.resolve(resource);
  }

  public browserRequestFailed(event: {
    resource: IHttpResourceLoadDetails;
    tabId: string;
    loadError: Error;
  }): void {
    const match =
      this.resourcesRequestedByBrowser.find(
        x => x.browserRequestId === event.resource.browserRequestId,
      ) ??
      this.getResourceRequestedByBrowser(
        event.resource.url.href,
        event.resource.method,
        event.resource.requestHeaders.Origin as string,
        event.resource.requestHeaders.Referer as string,
      );
    if (match) {
      match.resourceType = event.resource.resourceType;
      match.isRequestedInBrowser.reject(event.loadError);
    } else {
      log.warn('BrowserViewOfResourceLoad::Failed', {
        sessionId: this.sessionId,
        ...event,
      });
    }
  }

  public trackResourceRedirects(resource: IHttpResourceLoadDetails): void {
    const resourceRedirect = {
      url: resource.url.href,
      redirectedToUrl: resource.redirectedToUrl,
      responseTime: resource.responseTime,
      redirectChain: [],
    };
    this.requestedUrls.push(resourceRedirect);

    const redirect = this.requestedUrls.find(
      x =>
        x.redirectedToUrl === resourceRedirect.url &&
        resource.requestTime.getTime() - x.responseTime.getTime() < 5e3,
    );
    resource.isFromRedirect = !!redirect;
    if (redirect) {
      const redirectChain = [redirect.url, ...redirect.redirectChain];
      resource.previousUrl = redirectChain[0];
      resource.firstRedirectingUrl = redirectChain[redirectChain.length - 1];
      resourceRedirect.redirectChain = redirectChain;
    }
  }

  public async lookupDns(host: string): Promise<string> {
    if (this.dns) {
      try {
        return await this.dns.lookupIp(host);
      } catch (error) {
        log.error('DnsLookup.Error', {
          sessionId: this.sessionId,
          error,
        });
        // if fails, pass through to returning host untouched
      }
    }
    return Promise.resolve(host);
  }

  public getProxyCredentials(): string {
    return `secret-agent:${this.sessionId}`;
  }

  public close(): void {
    const logid = this.logger.stats('MitmRequestSession.Closing');
    this.isClosing = true;
    for (const pending of this.resourcesRequestedByBrowser) {
      pending.isRequestedInBrowser.reject(
        new CanceledPromiseError('Canceling: Mitm Request Session Closing'),
      );
    }
    this.requestAgent.close();
    this.dns.close();
    this.logger.stats('MitmRequestSession.Closed', logid);

    // give it a second for lingering requests to finish
    setTimeout(
      sessionId => {
        const ports = RequestSession.portsBySessionId[sessionId] || [];
        for (const port of ports) {
          delete RequestSession.sessionIdByPort[port];
        }
        delete RequestSession.portsBySessionId[sessionId];
        delete RequestSession.sessionById[sessionId];
      },
      1e3,
      this.sessionId,
    ).unref();
  }

  public shouldBlockRequest(url: string): boolean {
    if (!this.blockedResources?.urls) {
      return false;
    }
    for (const blockedUrlFragment of this.blockedResources.urls) {
      if (url.includes(blockedUrlFragment)) {
        return true;
      }
    }
    return false;
  }

  // function to override for
  public blockHandler(
    request: http.IncomingMessage | http2.Http2ServerRequest,
    response: http.ServerResponse | http2.Http2ServerResponse,
  ): boolean {
    if (this.blockedResources?.handlerFn) return this.blockedResources.handlerFn(request, response);
    return false;
  }

  public recordDocumentUserActivity(documentUrl: string): void {
    if (this.networkInterceptorDelegate?.http.onOriginHasFirstPartyInteraction) {
      this.networkInterceptorDelegate.http.onOriginHasFirstPartyInteraction(documentUrl);
    }
  }

  /////// Websockets ///////////////////////////////////////////////////////////

  public getWebsocketUpgradeRequestId(headers: IResourceHeaders): Promise<string> {
    const key = this.getWebsocketHeadersKey(headers);
    if (!this.websocketBrowserResourceIds[key]) {
      this.websocketBrowserResourceIds[key] = createPromise<string>(30e3);
    }

    return this.websocketBrowserResourceIds[key].promise;
  }

  public registerWebsocketHeaders(
    tabId: string,
    message: {
      browserRequestId: string;
      headers: IResourceHeaders;
    },
  ): void {
    this.browserRequestIdToTabId.set(message.browserRequestId, tabId);
    const key = this.getWebsocketHeadersKey(message.headers);
    if (!this.websocketBrowserResourceIds[key]) {
      this.websocketBrowserResourceIds[key] = createPromise<string>();
    }
    this.websocketBrowserResourceIds[key].resolve(message.browserRequestId);
  }

  private getWebsocketHeadersKey(headers: IResourceHeaders): string {
    let websocketKey: string;
    let host: string;
    for (const key of Object.keys(headers)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'sec-websocket-key') websocketKey = headers[key] as string;
      if (lowerKey === 'host') host = headers[key] as string;
    }
    return [host, websocketKey].join(',');
  }

  private getResourceRequestedByBrowser(
    url: string,
    method: string,
    origin: string,
    referer: string,
    isHttp2Push?: boolean,
  ): IResourcePendingBrowserLoad | null {
    const matches = this.resourcesRequestedByBrowser.filter(x => {
      return x.url === url && x.method === method;
    });

    // if http2 push, we don't know what referer/origin headers the browser will use
    const h2Push = matches.find(x => x.isHttp2Push);
    if (h2Push) return h2Push;
    if (isHttp2Push && matches.length) return matches[0];

    if (matches.length === 1) return matches[0];

    if (method === 'OPTIONS') {
      return matches.find(x => x.origin === origin);
    }

    // otherwise, use referer
    return matches.find(x => x.referer === referer);
  }

  public static async close(): Promise<void> {
    await Promise.all(Object.values(RequestSession.sessionById).map(x => x.close()));
  }

  public static readSessionId(
    requestHeaders: { [key: string]: string | string[] | undefined },
    remotePort: number,
  ): string {
    const authHeader = requestHeaders['proxy-authorization'] as string;
    if (!authHeader) {
      return RequestSession.sessionIdByPort[remotePort];
    }

    const [, sessionId] = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    return sessionId;
  }

  public static registerProxySession(loopbackProxySocket: net.Socket, sessionId: string): void {
    // local port is the side that originates from our http server
    this.portsBySessionId[sessionId] = this.portsBySessionId[sessionId] || new Set();
    this.portsBySessionId[sessionId].add(loopbackProxySocket.localPort);
    this.sessionIdByPort[loopbackProxySocket.localPort] = sessionId;
  }

  public static sendNeedsAuth(socket: net.Socket): void {
    socket.end(
      'HTTP/1.1 407 Proxy Authentication Required\r\n' +
        'Proxy-Authenticate: Basic realm="sa"\r\n\r\n',
    );
  }
}

interface IRequestSessionEvents {
  response: IRequestSessionResponseEvent;
  request: IRequestSessionRequestEvent;
  'http-error': IRequestSessionHttpErrorEvent;
  'resource-state': IResourceStateChangeEvent;
  'socket-connect': ISocketEvent;
  'socket-close': ISocketEvent;
}

export interface ISocketEvent {
  socket: MitmSocket;
}

export interface IResourceStateChangeEvent {
  context: IMitmRequestContext;
  state: ResourceState;
}

export interface IRequestSessionResponseEvent extends IRequestSessionRequestEvent {
  browserRequestId: string;
  response: IResourceResponse;
  wasCached: boolean;
  dnsResolvedIp?: string;
  resourceType: ResourceType;
  body: Buffer;
  redirectedToUrl?: string;
  executionMillis: number;
  browserServedFromCache?: 'service-worker' | 'disk' | 'prefetch' | 'unspecified';
  browserLoadFailure?: string;
  browserBlockedReason?: string;
  browserCanceled?: boolean;
}

export interface IRequestSessionRequestEvent {
  id: number;
  request: IResourceRequest;
  serverAlpn: string;
  clientAlpn: string;
  socketId: number;
  isHttp2Push: boolean;
  didBlockResource: boolean;
  originalHeaders: IResourceHeaders;
  localAddress: string;
}

export interface IRequestSessionHttpErrorEvent {
  request: IRequestSessionResponseEvent;
  error: Error;
}

interface ILoadedResource {
  browserRequestId: string;
  resourceType: ResourceType;
  originType: string;
  hasUserGesture: boolean;
  isUserNavigation: boolean;
  documentUrl: string;
}

interface IResourcePendingBrowserLoad {
  url: string;
  method: string;
  origin: string;
  referer: string;
  isRequestedInBrowser: IResolvablePromise<IResourcePendingBrowserLoad>;
  tabId?: string;
  browserRequestId?: string;
  resourceType?: ResourceType;
  documentUrl?: string;
  hasUserGesture?: boolean;
  isUserNavigation?: boolean;
  isHttp2Push?: boolean;
}
