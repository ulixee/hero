import { Protocol } from 'devtools-protocol';
import { getResourceTypeForChromeValue } from '@secret-agent/core-interfaces/ResourceType';
import * as eventUtils from '@secret-agent/commons/eventUtils';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { IPuppetNetworkEvents } from '@secret-agent/puppet-interfaces/IPuppetNetworkEvents';
import IBrowserEmulationSettings from '@secret-agent/puppet-interfaces/IBrowserEmulationSettings';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import IRegisteredEventListener from '@secret-agent/core-interfaces/IRegisteredEventListener';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import IHttpResourceLoadDetails from '@secret-agent/core-interfaces/IHttpResourceLoadDetails';
import { URL } from 'url';
import { CDPSession } from './CDPSession';
import AuthChallengeResponse = Protocol.Fetch.AuthChallengeResponseResponse;
import Fetch = Protocol.Fetch;
import RequestWillBeSentEvent = Protocol.Network.RequestWillBeSentEvent;
import WebSocketFrameSentEvent = Protocol.Network.WebSocketFrameSentEvent;
import WebSocketFrameReceivedEvent = Protocol.Network.WebSocketFrameReceivedEvent;
import WebSocketWillSendHandshakeRequestEvent = Protocol.Network.WebSocketWillSendHandshakeRequestEvent;
import ResponseReceivedEvent = Protocol.Network.ResponseReceivedEvent;
import RequestPausedEvent = Protocol.Fetch.RequestPausedEvent;
import LoadingFinishedEvent = Protocol.Network.LoadingFinishedEvent;
import LoadingFailedEvent = Protocol.Network.LoadingFailedEvent;
import RequestServedFromCacheEvent = Protocol.Network.RequestServedFromCacheEvent;
import RequestWillBeSentExtraInfoEvent = Protocol.Network.RequestWillBeSentExtraInfoEvent;

type ResourceRequest = IHttpResourceLoadDetails & {
  frameId?: string;
  redirectedFromUrl?: string;
  publishing?: {
    timeout?: NodeJS.Timeout;
    published?: boolean;
    details?: boolean;
  };
};

export class NetworkManager extends TypedEventEmitter<IPuppetNetworkEvents> {
  protected readonly logger: IBoundLog;
  private readonly cdpSession: CDPSession;
  private readonly attemptedAuthentications = new Set<string>();
  private readonly requestsById = new Map<string, ResourceRequest>();

  private readonly navigationRequestIds = new Set<string>();
  private emulation?: IBrowserEmulationSettings;

  private parentManager?: NetworkManager;
  private readonly registeredEvents: IRegisteredEventListener[];

  constructor(cdpSession: CDPSession, logger: IBoundLog) {
    super();
    this.cdpSession = cdpSession;
    this.logger = logger.createChild(module);
    this.registeredEvents = eventUtils.addEventListeners(this.cdpSession, [
      ['Fetch.requestPaused', this.onRequestPaused.bind(this)],
      ['Fetch.authRequired', this.onAuthRequired.bind(this)],

      ['Network.webSocketWillSendHandshakeRequest', this.onWebsocketHandshake.bind(this)],
      ['Network.webSocketFrameReceived', this.onWebsocketFrame.bind(this, true)],
      ['Network.webSocketFrameSent', this.onWebsocketFrame.bind(this, false)],

      ['Network.requestWillBeSent', this.onNetworkRequestWillBeSent.bind(this)],
      ['Network.requestWillBeSentExtraInfo', this.onNetworkRequestWillBeSentExtraInfo.bind(this)],
      ['Network.responseReceived', this.onNetworkResponseReceived.bind(this)],
      ['Network.loadingFinished', this.onLoadingFinished.bind(this)],
      ['Network.loadingFailed', this.onLoadingFailed.bind(this)],
      ['Network.requestServedFromCache', this.onNetworkRequestServedFromCache.bind(this)],
    ]);
  }

  public emit<
    K extends (keyof IPuppetNetworkEvents & string) | (keyof IPuppetNetworkEvents & symbol)
  >(eventType: K, event?: IPuppetNetworkEvents[K]): boolean {
    if (this.parentManager) {
      this.parentManager.emit(eventType, event);
    }
    return super.emit(eventType, event);
  }

  public setUserAgentOverrides(emulation: IBrowserEmulationSettings): Promise<void> {
    this.emulation = emulation;
    return this.cdpSession.send('Network.setUserAgentOverride', {
      userAgent: emulation.userAgent,
      acceptLanguage: emulation.locale,
      platform: emulation.platform,
    });
  }

  public async initialize(): Promise<void> {
    const errors = await Promise.all([
      this.cdpSession
        .send('Network.enable', {
          maxPostDataSize: 0,
          maxResourceBufferSize: 0,
          maxTotalBufferSize: 0,
        })
        .catch(err => err),
      this.cdpSession
        .send('Fetch.enable', {
          handleAuthRequests: true,
        })
        .catch(err => err),
    ]);
    for (const error of errors) {
      if (error && error instanceof Error) throw error;
    }
  }

  public close(): void {
    eventUtils.removeEventListeners(this.registeredEvents);
    this.cancelPendingEvents('NetworkManager closed');
  }

  public async initializeFromParent(parentManager: NetworkManager): Promise<void> {
    this.parentManager = parentManager;
    const errors = await Promise.all([
      this.setUserAgentOverrides(parentManager.emulation).catch(err => err),
      this.initialize().catch(err => err),
    ]);
    for (const error of errors) {
      if (error && error instanceof Error) throw error;
    }
  }

  private onAuthRequired(event: Protocol.Fetch.AuthRequiredEvent): void {
    const authChallengeResponse = {
      response: AuthChallengeResponse.Default,
    } as Fetch.AuthChallengeResponse;

    if (this.attemptedAuthentications.has(event.requestId)) {
      authChallengeResponse.response = AuthChallengeResponse.CancelAuth;
    } else if (this.emulation.proxyPassword) {
      this.attemptedAuthentications.add(event.requestId);

      authChallengeResponse.response = AuthChallengeResponse.ProvideCredentials;
      authChallengeResponse.username = 'puppet-chrome';
      authChallengeResponse.password = this.emulation.proxyPassword;
    }
    this.cdpSession
      .send('Fetch.continueWithAuth', {
        requestId: event.requestId,
        authChallengeResponse,
      })
      .catch(error => {
        if (error instanceof CanceledPromiseError) return;
        this.logger.info('NetworkManager.continueWithAuthError', {
          error,
          requestId: event.requestId,
          url: event.request.url,
        });
      });
  }

  private async onRequestPaused(networkRequest: RequestPausedEvent): Promise<void> {
    try {
      await this.cdpSession.send('Fetch.continueRequest', {
        requestId: networkRequest.requestId,
      });
    } catch (error) {
      if (error instanceof CanceledPromiseError) return;
      this.logger.info('NetworkManager.continueRequestError', {
        error,
        requestId: networkRequest.requestId,
        url: networkRequest.request.url,
      });
    }

    // networkId corresponds to onNetworkRequestWillBeSent
    const resource = <ResourceRequest>{
      browserRequestId: networkRequest.networkId ?? networkRequest.requestId,
      resourceType: getResourceTypeForChromeValue(networkRequest.resourceType),
      url: new URL(networkRequest.request.url),
      method: networkRequest.request.method,
      isSSL: networkRequest.request.url.startsWith('https'),
      isFromRedirect: false,
      isUpgrade: false,
      isHttp2Push: false,
      isServerHttp2: false,
      isClientHttp2: false,
      requestTime: new Date(),
      clientAlpn: null,
      hasUserGesture: false,
      documentUrl: networkRequest.request.headers.Referer,
      frameId: networkRequest.frameId,
    };

    const existing = this.requestsById.get(resource.browserRequestId);

    if (existing) {
      if (existing.url === resource.url) {
        resource.requestHeaders = existing.requestHeaders ?? {};
        resource.requestLowerHeaders = existing.requestLowerHeaders ?? {};
        resource.requestOriginalHeaders = existing.requestOriginalHeaders ?? {};
      }
      resource.redirectedFromUrl = existing.redirectedFromUrl;
    }
    this.mergeRequestHeaders(resource, networkRequest.request.headers);

    if (networkRequest.networkId && !this.requestsById.has(networkRequest.networkId)) {
      this.requestsById.set(networkRequest.networkId, resource);
    }
    if (networkRequest.requestId !== networkRequest.networkId) {
      this.requestsById.set(networkRequest.requestId, resource);
    }

    // requests from service workers (and others?) will never register with RequestWillBeSentEvent
    // -- they don't have networkIds
    this.emitResourceRequested(resource.browserRequestId);
  }

  private onNetworkRequestWillBeSent(networkRequest: RequestWillBeSentEvent): void {
    const redirectedFromUrl = networkRequest.redirectResponse?.url;

    const isNavigation =
      networkRequest.requestId === networkRequest.loaderId && networkRequest.type === 'Document';
    if (isNavigation) {
      this.navigationRequestIds.add(networkRequest.requestId);
    }

    const resource = <ResourceRequest>{
      url: new URL(networkRequest.request.url),
      isSSL: networkRequest.request.url.startsWith('https'),
      isFromRedirect: !!redirectedFromUrl,
      isUpgrade: false,
      isHttp2Push: false,
      isServerHttp2: false,
      isClientHttp2: false,
      requestTime: new Date(networkRequest.wallTime * 1e3),
      clientAlpn: null,
      browserRequestId: networkRequest.requestId,
      resourceType: getResourceTypeForChromeValue(networkRequest.type),
      method: networkRequest.request.method,
      hasUserGesture: networkRequest.hasUserGesture,
      documentUrl: networkRequest.documentURL,
      redirectedFromUrl,
      frameId: networkRequest.frameId,
    };

    const existing = this.requestsById.get(resource.browserRequestId);

    const shouldReplace = redirectedFromUrl && existing.url !== resource.url;

    // NOTE: same requestId will be used in devtools for redirected resources
    if (existing && !shouldReplace) {
      // preserve headers and frameId from a fetch or networkWillRequestExtraInfo
      resource.requestHeaders = existing.requestHeaders ?? {};
      resource.requestLowerHeaders = existing.requestLowerHeaders ?? {};
      resource.requestOriginalHeaders = existing.requestOriginalHeaders ?? {};
      resource.publishing = existing.publishing;
    }

    this.requestsById.set(resource.browserRequestId, resource);
    this.mergeRequestHeaders(resource, networkRequest.request.headers);

    this.emitResourceRequested(resource.browserRequestId);
  }

  private onNetworkRequestWillBeSentExtraInfo(
    networkRequest: RequestWillBeSentExtraInfoEvent,
  ): void {
    const requestId = networkRequest.requestId;
    let resource = this.requestsById.get(requestId);
    const hasNetworkRequest = !!resource?.url;
    if (!resource) {
      resource = {} as any;
      this.requestsById.set(requestId, resource);
    }

    this.mergeRequestHeaders(resource, networkRequest.headers);

    if (hasNetworkRequest) {
      clearTimeout(resource.publishing?.timeout);
      this.doEmitResourceRequested(resource.browserRequestId);
    }
  }

  private mergeRequestHeaders(
    resource: IHttpResourceLoadDetails,
    requestHeaders: RequestWillBeSentEvent['request']['headers'],
  ): void {
    resource.requestHeaders ??= {};
    resource.requestOriginalHeaders ??= {};
    resource.requestLowerHeaders ??= {};
    for (const [key, value] of Object.entries(requestHeaders)) {
      const lowerKey = key.toLowerCase();
      resource.requestLowerHeaders[lowerKey] = value;
      resource.requestOriginalHeaders[key] = value;
      resource.requestHeaders[key] = value;
    }
  }

  private emitResourceRequested(browserRequestId: string): void {
    const resource = this.requestsById.get(browserRequestId);
    if (!resource) return;

    if (!resource.publishing) resource.publishing = {};
    // if we're already waiting, go ahead and publish now
    if (resource.publishing?.timeout && !resource.publishing?.published) {
      this.doEmitResourceRequested(browserRequestId);
      return;
    }
    // give it a small period to add extra info. no network id means it's running outside the normal "requestWillBeSent" flow
    setTimeout(this.doEmitResourceRequested.bind(this), 200, browserRequestId).unref();
  }

  private doEmitResourceRequested(browserRequestId: string): boolean {
    const resource = this.requestsById.get(browserRequestId);
    if (!resource) return false;
    if (!resource.url) return false;

    clearTimeout(resource.publishing?.timeout);
    resource.publishing ??= {};
    resource.publishing.timeout = undefined;

    const event = <IPuppetNetworkEvents['resource-will-be-requested']>{
      resource,
      isDocumentNavigation: this.navigationRequestIds.has(browserRequestId),
      frameId: resource.frameId,
      redirectedFromUrl: resource.redirectedFromUrl,
    };

    // NOTE: same requestId will be used in devtools for redirected resources
    if (!resource.publishing.published) {
      resource.publishing.published = true;
      this.emit('resource-will-be-requested', event);
    } else if (!resource.publishing.details) {
      resource.publishing.details = true;
      this.emit('resource-was-requested', event);
    }
  }

  private onNetworkResponseReceived(event: ResponseReceivedEvent): void {
    const { response, requestId, loaderId, frameId, type } = event;

    const resource = this.requestsById.get(requestId);
    if (resource) {
      resource.responseHeaders = response.headers;
      resource.status = response.status;
      resource.statusMessage = response.statusText;
      resource.remoteAddress = `${response.remoteIPAddress}:${response.remotePort}`;
      resource.clientAlpn = response.protocol;
      resource.responseUrl = response.url;
      resource.responseTime = new Date();
      if (response.fromDiskCache) resource.browserServedFromCache = 'disk';
      if (response.fromServiceWorker) resource.browserServedFromCache = 'service-worker';
      if (response.fromPrefetchCache) resource.browserServedFromCache = 'prefetch';

      if (response.requestHeaders) this.mergeRequestHeaders(resource, response.requestHeaders);
      if (!resource.url) {
        resource.url = new URL(response.url);
        resource.frameId = frameId;
        resource.browserRequestId = requestId;
      }
      if (!resource.publishing?.published && resource.url?.href) {
        this.doEmitResourceRequested(requestId);
      }
    }

    const isNavigation = requestId === loaderId && type === 'Document';
    if (isNavigation) {
      this.emit('navigation-response', {
        frameId,
        browserRequestId: requestId,
        status: response.status,
        location: response.headers.location,
        url: response.url,
      });
    }
  }

  private onNetworkRequestServedFromCache(event: RequestServedFromCacheEvent): void {
    const { requestId } = event;
    const resource = this.requestsById.get(requestId);
    if (resource) {
      resource.browserServedFromCache = 'memory';
      setTimeout(() => this.emitLoaded(requestId), 500);
    }
  }

  private onLoadingFailed(event: LoadingFailedEvent): void {
    const { requestId, canceled, blockedReason, errorText } = event;

    const resource = this.requestsById.get(requestId);
    if (resource) {
      if (!resource.publishing?.published) {
        this.doEmitResourceRequested(requestId);
      }
      if (canceled) resource.browserCanceled = true;
      if (blockedReason) resource.browserBlockedReason = blockedReason;
      if (errorText) resource.browserLoadFailure = errorText;
      this.emit('resource-failed', {
        resource,
      });
      this.requestsById.delete(requestId);
    }
  }

  private onLoadingFinished(event: LoadingFinishedEvent): void {
    const { requestId } = event;
    this.emitLoaded(requestId);
  }

  private emitLoaded(id: string, frameId?: string): void {
    const resource = this.requestsById.get(id);
    if (resource) {
      if (!resource.publishing?.published) this.emitResourceRequested(id);
      this.requestsById.delete(id);
      this.emit('resource-loaded', { resource, frameId });
    }
  }

  /////// WEBSOCKET EVENT HANDLERS /////////////////////////////////////////////////////////////////

  private onWebsocketHandshake(handshake: WebSocketWillSendHandshakeRequestEvent): void {
    this.emit('websocket-handshake', {
      browserRequestId: handshake.requestId,
      headers: handshake.request.headers,
    });
  }

  private onWebsocketFrame(
    isFromServer: boolean,
    event: WebSocketFrameSentEvent | WebSocketFrameReceivedEvent,
  ): void {
    const browserRequestId = event.requestId;
    const { opcode, payloadData } = event.response;
    const message = opcode === 1 ? payloadData : Buffer.from(payloadData, 'base64');
    this.emit('websocket-frame', {
      message,
      browserRequestId,
      isFromServer,
    });
  }
}
