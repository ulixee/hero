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

export class NetworkManager extends TypedEventEmitter<IPuppetNetworkEvents> {
  protected readonly logger: IBoundLog;
  private readonly cdpSession: CDPSession;
  private readonly attemptedAuthentications = new Set<string>();
  private readonly publishedResources = new Set<string>();
  private readonly requestsById = new Map<string, IHttpResourceLoadDetails>();
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
    await Promise.all([
      this.cdpSession.send('Network.enable', {
        maxPostDataSize: 0,
        maxResourceBufferSize: 0,
        maxTotalBufferSize: 0,
      }),
      this.cdpSession.send('Fetch.enable', {
        handleAuthRequests: true,
      }),
    ]);
  }

  public close(): void {
    eventUtils.removeEventListeners(this.registeredEvents);
    this.cancelPendingEvents('NetworkManager closed');
  }

  public async initializeFromParent(parentManager: NetworkManager): Promise<void> {
    this.parentManager = parentManager;
    await Promise.all([this.setUserAgentOverrides(parentManager.emulation), this.initialize()]);
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

  private onRequestPaused(networkRequest: RequestPausedEvent): void {
    this.cdpSession
      .send('Fetch.continueRequest', {
        requestId: networkRequest.requestId,
      })
      .catch(error => {
        if (error instanceof CanceledPromiseError) return;
        this.logger.info('NetworkManager.continueRequestError', {
          error,
          requestId: networkRequest.requestId,
          url: networkRequest.request.url,
        });
      });

    const resource = <IHttpResourceLoadDetails>{
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
      requestHeaders: networkRequest.request.headers,
      requestOriginalHeaders: networkRequest.request.headers,
      hasUserGesture: false,
      documentUrl: networkRequest.request.headers.Referer,
    };

    if (networkRequest.networkId && !this.requestsById.has(networkRequest.networkId)) {
      this.requestsById.set(networkRequest.networkId, resource);
    }
    if (networkRequest.requestId !== networkRequest.networkId) {
      this.requestsById.set(networkRequest.requestId, resource);
    }

    const event = <IPuppetNetworkEvents['resource-will-be-requested']>{
      resource,
      url: networkRequest.request.url,
      origin: networkRequest.request.headers.Origin,
      referer: networkRequest.request.headers.Referer,
      isDocumentNavigation: false,
      frameId: networkRequest.frameId,
      redirectedFromUrl: null,
    };
    // requests from service workers (and others?) will never register with RequestWillBeSentEvent
    // -- they don't have networkIds
    if (!networkRequest.networkId) {
      this.emitResource(event);
    } else {
      // send on delay in case we never get a Network.requestWillBeSent (happens for certain types of requests)
      setTimeout(this.emitResource.bind(this), 500, event).unref();
    }
  }

  private onNetworkRequestWillBeSent(networkRequest: RequestWillBeSentEvent): void {
    const isNavigation =
      networkRequest.requestId === networkRequest.loaderId && networkRequest.type === 'Document';

    const redirectedFromUrl = networkRequest.redirectResponse?.url;

    const resource = <IHttpResourceLoadDetails>{
      url: new URL(networkRequest.request.url),
      isSSL: networkRequest.request.url.startsWith('https'),
      isFromRedirect: !!redirectedFromUrl,
      isUpgrade: false,
      isHttp2Push: false,
      isServerHttp2: false,
      isClientHttp2: false,
      requestTime: new Date(),
      clientAlpn: null,
      browserRequestId: networkRequest.requestId,
      resourceType: getResourceTypeForChromeValue(networkRequest.type),
      method: networkRequest.request.method,
      hasUserGesture: networkRequest.hasUserGesture,
      documentUrl: networkRequest.documentURL,
      requestHeaders: networkRequest.request.headers,
      requestOriginalHeaders: networkRequest.request.headers,
    };
    this.requestsById.set(resource.browserRequestId, resource);

    const didEmit = this.emitResource({
      resource,
      url: resource.url.href,
      origin: networkRequest.request.headers.Origin,
      referer: networkRequest.request.headers.Referer,
      isDocumentNavigation: isNavigation,
      frameId: networkRequest.frameId,
      redirectedFromUrl,
    });
    if (!didEmit) {
      // this can happen in 2 cases observed so far:
      // 1: the fetch comes first and Network.requestWillBeSent takes > 500 ms
      // 2: a duplicated resource is loaded across frames and piggybacks the first request
      this.logger.info('ResourceEmittedTwice', resource);
    }
  }

  private emitResource(event: IPuppetNetworkEvents['resource-will-be-requested']): boolean {
    const { browserRequestId, url } = event.resource;

    // NOTE: same requestId will be used in devtools for redirected resources
    if (this.publishedResources.has(`${browserRequestId}_${url}`)) return false;
    this.publishedResources.add(`${browserRequestId}_${url}`);

    this.emit('resource-will-be-requested', event);
    return true;
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

      if (response.requestHeaders) resource.requestHeaders = response.requestHeaders;
      // clear out after serve so we don't double-publish
      this.emitLoaded(requestId, frameId);
    }

    const isNavigation = requestId === loaderId && type === 'Document';
    if (!isNavigation) return;

    this.emit('navigation-response', {
      frameId,
      browserRequestId: requestId,
      status: response.status,
      location: response.headers.location,
      url: response.url,
    });
  }

  private onNetworkRequestServedFromCache(event: RequestServedFromCacheEvent): void {
    const { requestId } = event;
    const resource = this.requestsById.get(requestId);
    if (resource) {
      resource.browserServedFromCache = 'unspecified';
      this.emitLoaded(requestId);
    }
  }

  private onLoadingFailed(event: LoadingFailedEvent): void {
    const { requestId, canceled, blockedReason, errorText } = event;

    const resource = this.requestsById.get(requestId);
    if (resource) {
      if (canceled) resource.browserCanceled = true;
      if (blockedReason) resource.browserBlockedReason = blockedReason;
      if (errorText) resource.browserLoadFailure = errorText;
      this.emit('resource-failed', {
        resource,
      });
    }
  }

  private onLoadingFinished(event: LoadingFinishedEvent): void {
    const { requestId } = event;
    if (this.requestsById.has(requestId)) {
      this.emitLoaded(requestId);
    }
  }

  private emitLoaded(id: string, frameId?: string): void {
    setTimeout(() => {
      const resource = this.requestsById.get(id);
      if (resource) {
        this.requestsById.delete(id);
        this.emit('resource-loaded', { resource, frameId });
      }
    }, 500);
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
