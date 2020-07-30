import * as http from 'http';
import { createPromise, IResolvablePromise } from '@secret-agent/commons/utils';
import ResourceType, {
  getResourceTypeForChromeValue,
} from '@secret-agent/core-interfaces/ResourceType';
import { EventEmitter } from 'events';
import IHttpRequestModifierDelegate from '@secret-agent/commons/interfaces/IHttpRequestModifierDelegate';
import IHttpResourceLoadDetails from '@secret-agent/commons/interfaces/IHttpResourceLoadDetails';
import IHttpOrH2Response from '../interfaces/IHttpOrH2Response';
import IResourceRequest from '@secret-agent/core-interfaces/IResourceRequest';
import Protocol from 'devtools-protocol';
import Log from '@secret-agent/commons/Logger';
import MitmRequestAgent from '../lib/MitmRequestAgent';
import MitmRequestContext from '../lib/MitmRequestContext';
import Network = Protocol.Network;
import IResourceHeaders from '@secret-agent/core-interfaces/IResourceHeaders';

const { log } = Log(module);

export default class RequestSession {
  public static sessions: { [sessionId: string]: RequestSession } = {};
  public static requestUpgradeSessionLookup: {
    [headersHash: string]: IResolvablePromise<IRequestUpgradeLookup>;
  } = {};
  private static headerSessionIdPrefix: string = 'mitm-session-id-';

  public delegate: IHttpRequestModifierDelegate = {};

  public isClosing = false;
  public blockImages: boolean = false;
  public blockUrls: string[] = [];
  public blockResponseHandlerFn?: (
    request: http.IncomingMessage,
    response: http.ServerResponse,
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

  public async getWebsocketUpgradeRequestId(headers: { [name: string]: string }) {
    const session = await RequestSession.waitForWebsocketSessionId(headers, 0);
    return session.browserRequestId;
  }

  public async waitForBrowserResourceRequest(
    url: string,
    method: string,
    headers: { [name: string]: string },
  ) {
    const resourceIdx = this.getResourceIndex(url, method);
    let resource = resourceIdx >= 0 ? this.pendingResources[resourceIdx] : null;
    if (!resource) {
      resource = {
        url,
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
    const redirect = this.requests.find(x => x.redirectedToUrl === resource.url);
    resource.isFromRedirect = !!redirect;
    if (redirect) {
      resource.previousUrl = redirect.url;
      resource.firstRedirectingUrl = redirect.url;
      if (redirect.isFromRedirect) {
        const seen = new Set();
        let prev = redirect;
        while (prev.isFromRedirect) {
          prev = this.requests.find(x => x.redirectedToUrl === prev.url);
          if (seen.has(prev)) break;
          seen.add(prev);
          if (!prev) break;
        }
        if (prev) {
          resource.firstRedirectingUrl = prev.url;
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

  // ugly workaround because chrome won't let me intercept http upgrades or add headers
  public registerWebsocketHeaders(browserRequestId: string, headers: object) {
    const headersKey = [];
    for (const key of websocketHeadersForKey) {
      headersKey.push(`${key}=${headers[key]}`);
    }

    const key = headersKey.join(',');
    if (!RequestSession.requestUpgradeSessionLookup[key]) {
      RequestSession.requestUpgradeSessionLookup[key] = createPromise<IRequestUpgradeLookup>();
    }
    RequestSession.requestUpgradeSessionLookup[key].resolve({
      sessionId: this.sessionId,
      browserRequestId,
    });
  }

  public async getUpstreamProxyUrl() {
    return this.upstreamProxyUrlProvider ? this.upstreamProxyUrlProvider : null;
  }

  public getTrackingHeaders() {
    return {
      [`${RequestSession.headerSessionIdPrefix}${this.sessionId}`]: '1',
    };
  }

  public async close() {
    this.isClosing = true;
    for (const headersKey of Object.keys(RequestSession.requestUpgradeSessionLookup)) {
      const wsSession = RequestSession.requestUpgradeSessionLookup[headersKey];
      if (wsSession.isResolved) {
        const session = await wsSession.promise;
        if (session.sessionId === this.sessionId) {
          delete RequestSession.requestUpgradeSessionLookup[headersKey];
        }
      }
    }

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
  public blockHandler(request: http.IncomingMessage, response: http.ServerResponse) {
    if (this.blockResponseHandlerFn) return this.blockResponseHandlerFn(request, response);
    return false;
  }

  public recordDocumentUserActivity(documentUrl: string) {
    if (this.delegate?.documentHasUserActivity) {
      this.delegate?.documentHasUserActivity(documentUrl);
    }
  }

  private getResourceIndex(url: string, method: string) {
    return this.pendingResources.findIndex(x => {
      return x.url === url && x.method === method;
    });
  }

  public static async close() {
    for (const session of Object.values(RequestSession.sessions)) {
      await session.close();
    }
  }

  public static async getSession(
    headers: { [name: string]: string },
    method: string,
    isWebsocket: boolean = false,
    timeout = 10e3,
  ) {
    let sessionId = RequestSession.getSessionId(headers, method);
    if (!sessionId && isWebsocket) {
      const result = await RequestSession.waitForWebsocketSessionId(headers, timeout);
      sessionId = result.sessionId;
    }
    return RequestSession.sessions[sessionId];
  }

  public static getSessionId(headers: { [name: string]: string }, method: string) {
    const keys = Object.keys(headers);
    const accessControlHeaders = Object.entries(headers).find(([key]) =>
      key.match(/access-control-request-headers/i),
    );
    // preflight
    if (accessControlHeaders && method === 'OPTIONS') {
      keys.push(...accessControlHeaders[1].split(','));
    }

    for (const key of keys) {
      if (key.startsWith(RequestSession.headerSessionIdPrefix)) {
        return key.replace(RequestSession.headerSessionIdPrefix, '');
      }
    }
  }

  public static async waitForWebsocketSessionId(
    headers: { [name: string]: string },
    timeout: number,
  ) {
    const headersKey: string[] = [];
    for (const key of websocketHeadersForKey) {
      headersKey.push(`${key}=${headers[key]}`);
    }
    const key = headersKey.join(',');
    if (!RequestSession.requestUpgradeSessionLookup[key]) {
      RequestSession.requestUpgradeSessionLookup[key] = createPromise<IRequestUpgradeLookup>(
        timeout,
      );
    }

    return RequestSession.requestUpgradeSessionLookup[key].promise;
  }
}

interface IRequestSessionEvents {
  response: IRequestSessionResponseEvent;
  request: IRequestSessionRequestEvent;
  httpError: IRequestSessionHttpErrorEvent;
}

export interface IRequestSessionResponseEvent extends IRequestSessionRequestEvent {
  browserRequestId: string;
  response: IHttpOrH2Response;
  wasCached: boolean;
  resourceType: ResourceType;
  remoteAddress: string;
  body: Buffer;
  redirectedToUrl?: string;
}

export interface IRequestSessionRequestEvent {
  id: number;
  request: IResourceRequest;
  serverAlpn: string;
  clientAlpn: string;
  originalHeaders: IResourceHeaders;
  localAddress: string;
  requestTime: Date;
}

export interface IRequestSessionHttpErrorEvent {
  request: http.IncomingMessage;
  error: Error;
}

const websocketHeadersForKey = [
  'Accept-Encoding',
  'Cache-Control',
  'Connection',
  'Host',
  'Origin',
  'Pragma',
  'Sec-WebSocket-Extensions',
  'Sec-WebSocket-Key',
  'Sec-WebSocket-Version',
  'Upgrade',
  'User-Agent',
];

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

interface IRequestUpgradeLookup {
  sessionId: string;
  browserRequestId: string;
}
