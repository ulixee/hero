import { Protocol } from 'devtools-protocol';
import { getResourceTypeForChromeValue } from '@secret-agent/interfaces/ResourceType';
import * as eventUtils from '@secret-agent/commons/eventUtils';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import {
  IPuppetNetworkEvents,
  IPuppetResourceRequest,
} from '@secret-agent/interfaces/IPuppetNetworkEvents';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import IRegisteredEventListener from '@secret-agent/interfaces/IRegisteredEventListener';
import { IBoundLog } from '@secret-agent/interfaces/ILog';
import { URL } from 'url';
import IProxyConnectionOptions from '@secret-agent/interfaces/IProxyConnectionOptions';
import { DevtoolsSession } from './DevtoolsSession';
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

interface IResourcePublishing {
  hasRequestWillBeSentEvent: boolean;
  emitTimeout?: NodeJS.Timeout;
  isPublished?: boolean;
  isDetailsEmitted?: boolean;
}

const mbBytes = 1028 * 1028;

export class NetworkManager extends TypedEventEmitter<IPuppetNetworkEvents> {
  protected readonly logger: IBoundLog;
  private readonly devtools: DevtoolsSession;
  private readonly attemptedAuthentications = new Set<string>();
  private readonly redirectsById = new Map<string, IPuppetResourceRequest[]>();
  private readonly requestsById = new Map<string, IPuppetResourceRequest>();
  private readonly requestPublishingById = new Map<string, IResourcePublishing>();

  private readonly navigationRequestIdsToLoaderId = new Map<string, string>();

  private parentManager?: NetworkManager;
  private readonly registeredEvents: IRegisteredEventListener[];
  private mockNetworkRequests?: (
    request: Protocol.Fetch.RequestPausedEvent,
  ) => Promise<Protocol.Fetch.FulfillRequestRequest>;

  private readonly proxyConnectionOptions: IProxyConnectionOptions;
  private isChromeRetainingResources = false;

  constructor(
    devtoolsSession: DevtoolsSession,
    logger: IBoundLog,
    proxyConnectionOptions?: IProxyConnectionOptions,
  ) {
    super();
    this.devtools = devtoolsSession;
    this.logger = logger.createChild(module);
    this.proxyConnectionOptions = proxyConnectionOptions;
    this.registeredEvents = eventUtils.addEventListeners(this.devtools, [
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

  public async initialize(): Promise<void> {
    if (this.mockNetworkRequests) {
      return this.devtools
        .send('Fetch.enable', {
          handleAuthRequests: !!this.proxyConnectionOptions?.password,
        })
        .catch(err => err);
    }

    const maxResourceBufferSize = this.proxyConnectionOptions?.address ? mbBytes : 5 * mbBytes; // 5mb max
    if (maxResourceBufferSize > 0) this.isChromeRetainingResources = true;

    const errors = await Promise.all([
      this.devtools
        .send('Network.enable', {
          maxPostDataSize: 0,
          maxResourceBufferSize,
          maxTotalBufferSize: maxResourceBufferSize * 5,
        })
        .catch(err => err),
      this.proxyConnectionOptions?.password
        ? this.devtools
            .send('Fetch.enable', {
              handleAuthRequests: true,
            })
            .catch(err => err)
        : Promise.resolve(),
    ]);
    for (const error of errors) {
      if (error && error instanceof Error) throw error;
    }
  }

  public async setNetworkInterceptor(
    mockNetworkRequests: NetworkManager['mockNetworkRequests'],
    disableSessionLogging: boolean,
  ): Promise<void> {
    this.mockNetworkRequests = mockNetworkRequests;
    const promises: Promise<any>[] = [];
    if (disableSessionLogging) {
      promises.push(this.devtools.send('Network.disable'));
    }
    promises.push(
      this.devtools.send('Fetch.enable', {
        handleAuthRequests: !!this.proxyConnectionOptions?.password,
      }),
    );
    await Promise.all(promises);
  }

  public close(): void {
    eventUtils.removeEventListeners(this.registeredEvents);
    this.cancelPendingEvents('NetworkManager closed');
  }

  public initializeFromParent(parentManager: NetworkManager): Promise<void> {
    this.parentManager = parentManager;
    return this.initialize();
  }

  private onAuthRequired(event: Protocol.Fetch.AuthRequiredEvent): void {
    const authChallengeResponse = {
      response: AuthChallengeResponse.Default,
    } as Fetch.AuthChallengeResponse;

    if (this.attemptedAuthentications.has(event.requestId)) {
      authChallengeResponse.response = AuthChallengeResponse.CancelAuth;
    } else if (this.proxyConnectionOptions?.password) {
      this.attemptedAuthentications.add(event.requestId);

      authChallengeResponse.response = AuthChallengeResponse.ProvideCredentials;
      authChallengeResponse.username = 'puppet-chrome';
      authChallengeResponse.password = this.proxyConnectionOptions.password;
    }
    this.devtools
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
      if (this.mockNetworkRequests) {
        const response = await this.mockNetworkRequests(networkRequest);
        if (response) {
          return await this.devtools.send('Fetch.fulfillRequest', response);
        }
      }

      await this.devtools.send('Fetch.continueRequest', {
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

    let resource: IPuppetResourceRequest;
    try {
      // networkId corresponds to onNetworkRequestWillBeSent
      resource = <IPuppetResourceRequest>{
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
    } catch (error) {
      this.logger.warn('NetworkManager.onRequestPausedError', {
        error,
        url: networkRequest.request.url,
        browserRequestId: networkRequest.requestId,
      });
      return;
    }
    const existing = this.requestsById.get(resource.browserRequestId);

    if (existing) {
      if (existing.url === resource.url) {
        resource.requestHeaders = existing.requestHeaders ?? {};
      }

      if (existing.resourceType) resource.resourceType = existing.resourceType;
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
      this.navigationRequestIdsToLoaderId.set(networkRequest.requestId, networkRequest.loaderId);
    }
    let resource: IPuppetResourceRequest;
    try {
      resource = <IPuppetResourceRequest>{
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
    } catch (error) {
      this.logger.warn('NetworkManager.onNetworkRequestWillBeSentError', {
        error,
        url: networkRequest.request.url,
        browserRequestId: networkRequest.requestId,
      });
      return;
    }

    const publishing = this.getPublishingForRequestId(resource.browserRequestId, true);
    publishing.hasRequestWillBeSentEvent = true;

    const existing = this.requestsById.get(resource.browserRequestId);

    const isNewRedirect = redirectedFromUrl && existing && existing.url !== resource.url;

    // NOTE: same requestId will be used in devtools for redirected resources
    if (existing) {
      if (isNewRedirect) {
        const existingRedirects = this.redirectsById.get(resource.browserRequestId) ?? [];
        existing.redirectedToUrl = networkRequest.request.url;
        existing.responseHeaders = networkRequest.redirectResponse.headers;
        existing.status = networkRequest.redirectResponse.status;
        existing.statusMessage = networkRequest.redirectResponse.statusText;
        this.redirectsById.set(resource.browserRequestId, [...existingRedirects, existing]);
        publishing.isPublished = false;
        clearTimeout(publishing.emitTimeout);
        publishing.emitTimeout = undefined;
      } else {
        // preserve headers and frameId from a fetch or networkWillRequestExtraInfo
        resource.requestHeaders = existing.requestHeaders ?? {};
      }
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
    if (!resource) {
      resource = {} as any;
      this.requestsById.set(requestId, resource);
    }

    this.mergeRequestHeaders(resource, networkRequest.headers);

    const hasNetworkRequest =
      this.requestPublishingById.get(requestId)?.hasRequestWillBeSentEvent === true;
    if (hasNetworkRequest) {
      this.doEmitResourceRequested(resource.browserRequestId);
    }
  }

  private mergeRequestHeaders(
    resource: IPuppetResourceRequest,
    requestHeaders: RequestWillBeSentEvent['request']['headers'],
  ): void {
    resource.requestHeaders ??= {};
    for (const [key, value] of Object.entries(requestHeaders)) {
      const titleKey = `${key
        .split('-')
        .map(x => x[0].toUpperCase() + x.slice(1))
        .join('-')}`;
      if (resource.requestHeaders[titleKey] && titleKey !== key) {
        delete resource.requestHeaders[titleKey];
      }
      resource.requestHeaders[key] = value;
    }
  }

  private emitResourceRequested(browserRequestId: string): void {
    const resource = this.requestsById.get(browserRequestId);
    if (!resource) return;

    const publishing = this.getPublishingForRequestId(browserRequestId, true);
    // if we're already waiting, go ahead and publish now
    if (publishing.emitTimeout && !publishing.isPublished) {
      this.doEmitResourceRequested(browserRequestId);
      return;
    }

    // give it a small period to add extra info. no network id means it's running outside the normal "requestWillBeSent" flow
    publishing.emitTimeout = setTimeout(
      this.doEmitResourceRequested.bind(this),
      200,
      browserRequestId,
    ).unref();
  }

  private doEmitResourceRequested(browserRequestId: string): boolean {
    const resource = this.requestsById.get(browserRequestId);
    if (!resource) return false;
    if (!resource.url) return false;

    const publishing = this.getPublishingForRequestId(browserRequestId, true);
    clearTimeout(publishing.emitTimeout);
    publishing.emitTimeout = undefined;

    const event = <IPuppetNetworkEvents['resource-will-be-requested']>{
      resource,
      isDocumentNavigation: this.navigationRequestIdsToLoaderId.has(browserRequestId),
      frameId: resource.frameId,
      redirectedFromUrl: resource.redirectedFromUrl,
      loaderId: this.navigationRequestIdsToLoaderId.get(browserRequestId),
    };

    // NOTE: same requestId will be used in devtools for redirected resources
    if (!publishing.isPublished) {
      publishing.isPublished = true;
      this.emit('resource-will-be-requested', event);
    } else if (!publishing.isDetailsEmitted) {
      publishing.isDetailsEmitted = true;
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
      if (!this.requestPublishingById.get(requestId)?.isPublished && resource.url?.href) {
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
        loaderId: event.loaderId,
      });
    }
  }

  private onNetworkRequestServedFromCache(event: RequestServedFromCacheEvent): void {
    const { requestId } = event;
    const resource = this.requestsById.get(requestId);
    if (resource) {
      resource.browserServedFromCache = 'memory';
      setTimeout(() => this.emitLoaded(requestId), 500).unref();
    }
  }

  private onLoadingFailed(event: LoadingFailedEvent): void {
    const { requestId, canceled, blockedReason, errorText } = event;

    const resource = this.requestsById.get(requestId);
    if (resource) {
      if (!resource.url || !resource.requestTime) {
        return;
      }

      if (canceled) resource.browserCanceled = true;
      if (blockedReason) resource.browserBlockedReason = blockedReason;
      if (errorText) resource.browserLoadFailure = errorText;

      if (!this.requestPublishingById.get(requestId)?.isPublished) {
        this.doEmitResourceRequested(requestId);
      }

      this.emit('resource-failed', {
        resource,
      });
      this.redirectsById.delete(requestId);
      this.requestsById.delete(requestId);
      this.requestPublishingById.delete(requestId);
    }
  }

  private onLoadingFinished(event: LoadingFinishedEvent): void {
    const { requestId } = event;
    this.emitLoaded(requestId);
  }

  private emitLoaded(id: string): void {
    const resource = this.requestsById.get(id);
    if (resource) {
      if (!this.requestPublishingById.get(id)?.isPublished) this.emitResourceRequested(id);
      this.requestsById.delete(id);
      this.requestPublishingById.delete(id);
      const loaderId = this.navigationRequestIdsToLoaderId.get(id);
      if (this.redirectsById.has(id)) {
        for (const redirect of this.redirectsById.get(id)) {
          this.emit('resource-loaded', {
            resource: redirect,
            frameId: redirect.frameId,
            loaderId,
            // eslint-disable-next-line require-await
            body: async () => Buffer.from(''),
          });
        }
        this.redirectsById.delete(id);
      }
      const body = this.downloadRequestBody.bind(this, id);
      this.emit('resource-loaded', { resource, frameId: resource.frameId, loaderId, body });
    }
  }

  private async downloadRequestBody(requestId: string): Promise<Buffer> {
    if (this.isChromeRetainingResources === false || !this.devtools.isConnected()) {
      return null;
    }

    try {
      const body = await this.devtools.send('Network.getResponseBody', {
        requestId,
      });
      return Buffer.from(body.body, body.base64Encoded ? 'base64' : undefined);
    } catch (e) {
      return null;
    }
  }

  private getPublishingForRequestId(id: string, createIfNull = false): IResourcePublishing {
    const publishing = this.requestPublishingById.get(id);
    if (publishing) return publishing;
    if (createIfNull) {
      this.requestPublishingById.set(id, { hasRequestWillBeSentEvent: false });
      return this.requestPublishingById.get(id);
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
