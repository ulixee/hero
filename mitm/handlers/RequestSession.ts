import * as http from 'http';
import { createPromise, IResolvablePromise } from '@secret-agent/commons/utils';
import ResourceType, {
  getResourceTypeForChromeValue,
} from '@secret-agent/core-interfaces/ResourceType';
import { EventEmitter } from 'events';
import IHttpRequestModifierDelegate from '@secret-agent/commons/interfaces/IHttpRequestModifierDelegate';
import IHttpResourceLoadDetails from '@secret-agent/commons/interfaces/IHttpResourceLoadDetails';
import IResourceRequest from '@secret-agent/core-interfaces/IResourceRequest';
import Protocol from 'devtools-protocol';
import IResourceHeaders from '@secret-agent/core-interfaces/IResourceHeaders';
import * as http2 from 'http2';
import { URL } from 'url';
import IResourceResponse from '@secret-agent/core-interfaces/IResourceResponse';
import net from 'net';
import MitmRequestContext from '../lib/MitmRequestContext';
import MitmRequestAgent from '../lib/MitmRequestAgent';
import Network = Protocol.Network;

export default class RequestSession {
  public static sessions: { [sessionId: string]: RequestSession } = {};
  public static proxyPortSessionIds: { [port: number]: string } = {};

  public websocketBrowserResourceIds: {
    [headersHash: string]: IResolvablePromise<string>;
  } = {};

  public delegate: IHttpRequestModifierDelegate = {};

  public isClosing = false;
  public blockImages = false;
  public blockUrls: string[] = [];
  public blockResponseHandlerFn?: (
    request: http.IncomingMessage | http2.Http2ServerRequest,
    response: http.ServerResponse | http2.Http2ServerResponse,
  ) => boolean;

  public requestAgent: MitmRequestAgent;
  public requests: IHttpResourceLoadDetails[] = [];

  private readonly pendingResources: IPendingResourceLoad[] = [];
  private emitter = new EventEmitter();

  constructor(
    readonly sessionId: string,
    readonly useragent: string,
    readonly upstreamProxyUrlProvider: Promise<string>,
  ) {
    RequestSession.sessions[sessionId] = this;
    this.requestAgent = new MitmRequestAgent(this);
  }

  public on<K extends keyof IRequestSessionEvents>(
    eventType: K,
    listenerFn: (this: this, event: IRequestSessionEvents[K]) => any,
  ) {
    this.emitter.on(eventType, listenerFn);
    return this;
  }

  public emit<K extends keyof IRequestSessionEvents>(
    eventType: K,
    event: IRequestSessionEvents[K],
  ) {
    return this.emitter.emit(eventType, event);
  }

  public async waitForBrowserResourceRequest(url: URL, method: string, headers: IResourceHeaders) {
    const resourceIdx = this.getResourceIndex(url.href, method);
    let resource = resourceIdx >= 0 ? this.pendingResources[resourceIdx] : null;
    if (!resource) {
      resource = {
        url: url.href,
        method,
        load: createPromise<IPendingResourceLoad>(),
      };
      this.pendingResources.push(resource);
    }

    await resource.load.promise;

    return {
      browserRequestId: resource.browserRequestId,
      resourceType: resource.resourceType,
      originType: MitmRequestContext.getOriginType(url, headers),
      hasUserGesture: resource.hasUserGesture,
      isUserNavigation: resource.isUserNavigation,
      documentUrl: resource.documentUrl,
    };
  }

  public trackResource(resource: IHttpResourceLoadDetails) {
    this.requests.push(resource);
    const redirect = this.requests.find(x => x.redirectedToUrl === resource.url.href);
    resource.isFromRedirect = !!redirect;
    if (redirect) {
      resource.previousUrl = redirect.url.href;
      resource.firstRedirectingUrl = redirect.url.href;
      if (redirect.isFromRedirect) {
        const seen = new Set();
        const findRequest = req => this.requests.find(x => x.redirectedToUrl === req.url.href);
        let prev = redirect;
        while (prev.isFromRedirect) {
          prev = findRequest(prev);
          if (seen.has(prev)) break;
          seen.add(prev);
          if (!prev) break;
        }
        if (prev) {
          resource.firstRedirectingUrl = prev.url.href;
        }
      }
    }
  }

  public registerResource(params: {
    browserRequestId: string;
    url: string;
    method: string;
    resourceType: Network.ResourceType;
    hasUserGesture: boolean;
    documentUrl: string;
    isUserNavigation: boolean;
  }) {
    const { url, method, resourceType } = params;

    const resourceIdx = this.getResourceIndex(url, method);
    let resource: IPendingResourceLoad;
    if (resourceIdx >= 0) {
      resource = this.pendingResources[resourceIdx];
    } else {
      resource = {
        url,
        method,
        load: createPromise<IPendingResourceLoad>(),
      } as IPendingResourceLoad;
      this.pendingResources.push(resource);
    }

    resource.browserRequestId = params.browserRequestId;
    resource.documentUrl = params.documentUrl;
    resource.resourceType = getResourceTypeForChromeValue(resourceType);
    resource.hasUserGesture = params.hasUserGesture;
    resource.isUserNavigation = params.isUserNavigation;
    resource.load.resolve(resource);
  }

  public async getUpstreamProxyUrl() {
    return this.upstreamProxyUrlProvider ? this.upstreamProxyUrlProvider : null;
  }

  public getProxyCredentials(windowId = '') {
    return `${windowId}:${this.sessionId}`;
  }

  public async close() {
    this.isClosing = true;
    await this.requestAgent.close();
    delete RequestSession.sessions[this.sessionId];
  }

  public shouldBlockRequest(url: string) {
    if (!this.blockUrls) {
      return false;
    }
    for (const blockedUrlFragment of this.blockUrls) {
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
  ) {
    if (this.blockResponseHandlerFn) return this.blockResponseHandlerFn(request, response);
    return false;
  }

  public recordDocumentUserActivity(documentUrl: string) {
    if (this.delegate?.documentHasUserActivity) {
      this.delegate?.documentHasUserActivity(documentUrl);
    }
  }

  /////// Websockets ///////////////////////////////////////////////////////////

  public async getWebsocketUpgradeRequestId(headers: IResourceHeaders) {
    const key = this.getWebsocketHeadersKey(headers);
    if (!this.websocketBrowserResourceIds[key]) {
      this.websocketBrowserResourceIds[key] = createPromise<string>(100);
    }

    return this.websocketBrowserResourceIds[key].promise;
  }

  public registerWebsocketHeaders(browserRequestId: string, headers: IResourceHeaders) {
    const key = this.getWebsocketHeadersKey(headers);
    if (!this.websocketBrowserResourceIds[key]) {
      this.websocketBrowserResourceIds[key] = createPromise<string>();
    }
    this.websocketBrowserResourceIds[key].resolve(browserRequestId);
  }

  private getWebsocketHeadersKey(headers: IResourceHeaders) {
    let websocketKey: string;
    let host: string;
    for (const key of Object.keys(headers)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'sec-websocket-key') websocketKey = headers[key] as string;
      if (lowerKey === 'host') host = headers[key] as string;
    }
    return [host, websocketKey].join(',');
  }

  private getResourceIndex(url: string, method: string) {
    return this.pendingResources.findIndex(x => {
      return x.url === url && x.method === method;
    });
  }

  public static async close() {
    await Promise.all(Object.values(RequestSession.sessions).map(x => x.close()));
  }

  public static readSessionId(
    requestHeaders: { [key: string]: string | string[] | undefined },
    remotePort: number,
  ) {
    const authHeader = requestHeaders['proxy-authorization'] as string;
    if (!authHeader) {
      return RequestSession.proxyPortSessionIds[remotePort];
    }

    const [, sessionId] = Buffer.from(authHeader.split(' ')[1], 'base64')
      .toString()
      .split(':');
    return sessionId;
  }

  public static registerProxySession(socket: net.Socket, sessionId: string) {
    this.proxyPortSessionIds[socket.remotePort] = sessionId;
  }

  public static sendNeedsAuth(socket: net.Socket) {
    socket.end(
      'HTTP/1.1 407 Proxy Authentication Required\r\n' +
        'Proxy-Authenticate: Basic realm="sa"\r\n\r\n',
    );
  }
}

interface IRequestSessionEvents {
  response: IRequestSessionResponseEvent;
  request: IRequestSessionRequestEvent;
  httpError: IRequestSessionHttpErrorEvent;
}

export interface IRequestSessionResponseEvent extends IRequestSessionRequestEvent {
  browserRequestId: string;
  response: IResourceResponse;
  wasCached: boolean;
  resourceType: ResourceType;
  body: Buffer;
  redirectedToUrl?: string;
  executionMillis: number;
}

export interface IRequestSessionRequestEvent {
  id: number;
  request: IResourceRequest;
  serverAlpn: string;
  clientAlpn: string;
  isHttp2Push: boolean;
  didBlockResource: boolean;
  originalHeaders: IResourceHeaders;
  localAddress: string;
}

export interface IRequestSessionHttpErrorEvent {
  url: string;
  method: string;
  error: Error;
}

interface IPendingResourceLoad {
  url: string;
  method: string;
  load: IResolvablePromise<IPendingResourceLoad>;
  browserRequestId?: string;
  resourceType?: ResourceType;
  documentUrl?: string;
  hasUserGesture?: boolean;
  isUserNavigation?: boolean;
}
