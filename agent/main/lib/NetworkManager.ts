import { Protocol } from 'devtools-protocol';
import { getResourceTypeForChromeValue } from '@ulixee/unblocked-specification/agent/net/IResourceType';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import {
  IBrowserNetworkEvents,
  IBrowserResourceRequest,
} from '@ulixee/unblocked-specification/agent/browser/IBrowserNetworkEvents';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { URL } from 'url';
import DevtoolsSession from './DevtoolsSession';
import AuthChallengeResponse = Protocol.Fetch.AuthChallengeResponseResponse;
import Fetch = Protocol.Fetch;
import RequestWillBeSentEvent = Protocol.Network.RequestWillBeSentEvent;
import WebSocketCreatedEvent = Protocol.Network.WebSocketCreatedEvent;
import WebSocketFrameSentEvent = Protocol.Network.WebSocketFrameSentEvent;
import WebSocketFrameReceivedEvent = Protocol.Network.WebSocketFrameReceivedEvent;
import WebSocketWillSendHandshakeRequestEvent = Protocol.Network.WebSocketWillSendHandshakeRequestEvent;
import ResponseReceivedEvent = Protocol.Network.ResponseReceivedEvent;
import RequestPausedEvent = Protocol.Fetch.RequestPausedEvent;
import LoadingFinishedEvent = Protocol.Network.LoadingFinishedEvent;
import LoadingFailedEvent = Protocol.Network.LoadingFailedEvent;
import RequestServedFromCacheEvent = Protocol.Network.RequestServedFromCacheEvent;
import RequestWillBeSentExtraInfoEvent = Protocol.Network.RequestWillBeSentExtraInfoEvent;
import IProxyConnectionOptions from '../interfaces/IProxyConnectionOptions';

interface IResourcePublishing {
  hasRequestWillBeSentEvent: boolean;
  emitTimeout?: NodeJS.Timeout;
  isPublished?: boolean;
  isDetailsEmitted?: boolean;
}

const mbBytes = 1028 * 1028;

export default class NetworkManager extends TypedEventEmitter<IBrowserNetworkEvents> {
  protected readonly logger: IBoundLog;
  private readonly devtools: DevtoolsSession;
  private readonly attemptedAuthentications = new Set<string>();
  private readonly redirectsById = new Map<string, IBrowserResourceRequest[]>();
  private readonly requestsById = new Map<string, IBrowserResourceRequest>();
  private readonly requestPublishingById = new Map<string, IResourcePublishing>();

  private readonly navigationRequestIdsToLoaderId = new Map<string, string>();

  private readonly requestIdsToIgnore = new Set<string>();

  private parentManager?: NetworkManager;
  private readonly events = new EventSubscriber();
  private mockNetworkRequests?: (
    request: Protocol.Fetch.RequestPausedEvent,
  ) => Promise<Protocol.Fetch.FulfillRequestRequest | Protocol.Fetch.ContinueRequestRequest>;

  private readonly proxyConnectionOptions: IProxyConnectionOptions;
  private isChromeRetainingResources = false;

  private monotonicOffsetTime: number;

  constructor(
    devtoolsSession: DevtoolsSession,
    logger: IBoundLog,
    proxyConnectionOptions?: IProxyConnectionOptions,
    public secretKey?: string,
  ) {
    super();
    this.devtools = devtoolsSession;
    this.logger = logger.createChild(module);
    this.proxyConnectionOptions = proxyConnectionOptions;
    bindFunctions(this);
    const session = this.devtools;
    this.events.on(session, 'Fetch.requestPaused', this.onRequestPaused);
    this.events.on(session, 'Fetch.authRequired', this.onAuthRequired);
    this.events.on(session, 'Network.webSocketWillSendHandshakeRequest', this.onWebsocketHandshake);
    this.events.on(session, 'Network.webSocketCreated', this.onWebSocketCreated.bind(this));
    this.events.on(
      session,
      'Network.webSocketFrameReceived',
      this.onWebsocketFrame.bind(this, true),
    );
    this.events.on(session, 'Network.webSocketFrameSent', this.onWebsocketFrame.bind(this, false));

    this.events.on(session, 'Network.requestWillBeSent', this.onNetworkRequestWillBeSent);
    this.events.on(
      session,
      'Network.requestWillBeSentExtraInfo',
      this.onNetworkRequestWillBeSentExtraInfo,
    );
    this.events.on(session, 'Network.responseReceived', this.onNetworkResponseReceived);
    this.events.on(session, 'Network.loadingFinished', this.onLoadingFinished);
    this.events.on(session, 'Network.loadingFailed', this.onLoadingFailed);
    this.events.on(session, 'Network.requestServedFromCache', this.onNetworkRequestServedFromCache);
  }

  public override emit<
    K extends (keyof IBrowserNetworkEvents & string) | (keyof IBrowserNetworkEvents & symbol),
  >(eventType: K, event?: IBrowserNetworkEvents[K]): boolean {
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

    const patternsToIntercepts: Fetch.RequestPattern[] = [
      { urlPattern: 'http://hero.localhost/*' },
      { urlPattern: 'data://hero.localhost/*' },
    ];
    if (this.proxyConnectionOptions?.password) {
      // Pattern needs to match website url (not proxy url), so wildcard is only option we really have here
      patternsToIntercepts.push({ urlPattern: '*' });
    }

    const errors = await Promise.all([
      this.devtools
        .send('Network.enable', {
          maxPostDataSize: 0,
          maxResourceBufferSize,
          maxTotalBufferSize: maxResourceBufferSize * 5,
        })
        .catch(err => err),
      this.devtools
        .send('Fetch.enable', {
          handleAuthRequests: !!this.proxyConnectionOptions?.password,
          patterns: patternsToIntercepts,
        })
        .catch(err => err),
      // this.devtools.send('Security.setIgnoreCertificateErrors', { ignore: true }),
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
    if (mockNetworkRequests) {
      promises.push(
        this.devtools.send('Fetch.enable', {
          handleAuthRequests: !!this.proxyConnectionOptions?.password,
        }),
      );
    } else {
      promises.push(this.devtools.send('Fetch.disable'));
    }
    await Promise.all(promises);
  }

  public close(): void {
    this.events.close();
    this.cancelPendingEvents('NetworkManager closed');
  }

  public reset(): void {
    this.attemptedAuthentications.clear();
    this.navigationRequestIdsToLoaderId.clear();
    this.redirectsById.clear();
    this.requestsById.clear();
    this.requestPublishingById.clear();
    this.navigationRequestIdsToLoaderId.clear();
  }

  public initializeFromParent(parentManager: NetworkManager): Promise<void> {
    this.parentManager = parentManager;
    this.mockNetworkRequests = parentManager.mockNetworkRequests;
    return this.initialize();
  }

  public monotonicTimeToUnix(monotonicTime: number): number | undefined {
    if (this.monotonicOffsetTime) return 1e3 * (monotonicTime + this.monotonicOffsetTime);
  }

  private onAuthRequired(event: Protocol.Fetch.AuthRequiredEvent): void {
    const authChallengeResponse = {
      response: AuthChallengeResponse.Default,
    } as Fetch.AuthChallengeResponse;

    if (this.attemptedAuthentications.has(event.requestId)) {
      authChallengeResponse.response = AuthChallengeResponse.CancelAuth;
    } else if (event.authChallenge.source === 'Proxy' && this.proxyConnectionOptions?.password) {
      this.attemptedAuthentications.add(event.requestId);

      authChallengeResponse.response = AuthChallengeResponse.ProvideCredentials;
      authChallengeResponse.username = this.proxyConnectionOptions.username ?? 'browser-chrome';
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
      let continueDetails: Fetch.ContinueRequestRequest = {
        requestId: networkRequest.requestId,
      };
      // Internal hero requests
      if (networkRequest.request.url.includes(`hero.localhost/?secretKey=${this.secretKey}`)) {
        return await this.devtools.send('Fetch.fulfillRequest', {
          requestId: networkRequest.requestId,
          responseCode: 200,
        });
      }
      if (this.mockNetworkRequests) {
        const response = await this.mockNetworkRequests(networkRequest);
        if (response) {
          if ((response as Fetch.FulfillRequestRequest).body) {
            return await this.devtools.send('Fetch.fulfillRequest', response as any);
          }

          if ((response as Fetch.ContinueRequestRequest).url) {
            continueDetails = response;
            if (continueDetails.url) networkRequest.request.url = continueDetails.url;
            if (continueDetails.headers) {
              for (const [key, value] of Object.entries(continueDetails.headers)) {
                networkRequest.request.headers[key] = value as any;
              }
            }
          }
        }
      }

      await this.devtools.send('Fetch.continueRequest', continueDetails);
    } catch (error) {
      if (error instanceof CanceledPromiseError) return;
      this.logger.info('NetworkManager.continueRequestError', {
        error,
        requestId: networkRequest.requestId,
        url: networkRequest.request.url,
      });
    }

    let resource: IBrowserResourceRequest;
    try {
      // networkId corresponds to onNetworkRequestWillBeSent
      resource = <IBrowserResourceRequest>{
        browserRequestId: networkRequest.networkId ?? networkRequest.requestId,
        resourceType: getResourceTypeForChromeValue(
          networkRequest.resourceType,
          networkRequest.request.method,
        ),
        url: new URL(networkRequest.request.url),
        method: networkRequest.request.method,
        isSSL: networkRequest.request.url.startsWith('https'),
        isFromRedirect: false,
        isUpgrade: false,
        isHttp2Push: false,
        isServerHttp2: false,
        requestTime: Date.now(),
        protocol: null,
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

      if (existing.resourceType) {
        resource.resourceType = existing.resourceType;
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
    if (this.requestIdsToIgnore.has(networkRequest.requestId)) return;

    const url = networkRequest.request.url;
    if (url.includes(`hero.localhost/?secretKey=${this.secretKey}`)) {
      this.emit('internal-request', { request: networkRequest });
      this.addRequestIdToIgnore(networkRequest.requestId);
      return;
    }

    if (!this.monotonicOffsetTime)
      this.monotonicOffsetTime = networkRequest.wallTime - networkRequest.timestamp;
    const redirectedFromUrl = networkRequest.redirectResponse?.url;

    const isNavigation =
      networkRequest.requestId === networkRequest.loaderId && networkRequest.type === 'Document';
    if (isNavigation) {
      this.navigationRequestIdsToLoaderId.set(networkRequest.requestId, networkRequest.loaderId);
    }
    let resource: IBrowserResourceRequest;
    try {
      resource = <IBrowserResourceRequest>{
        url: new URL(networkRequest.request.url),
        isSSL: networkRequest.request.url.startsWith('https'),
        isFromRedirect: !!redirectedFromUrl,
        isUpgrade: false,
        isHttp2Push: false,
        isServerHttp2: false,
        requestTime: networkRequest.wallTime * 1e3,
        protocol: null,
        browserRequestId: networkRequest.requestId,
        resourceType: getResourceTypeForChromeValue(
          networkRequest.type,
          networkRequest.request.method,
        ),
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
    if (this.requestIdsToIgnore.has(requestId)) return;

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
    resource: IBrowserResourceRequest,
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
    if (this.requestIdsToIgnore.has(browserRequestId)) return;

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
      this.doEmitResourceRequested,
      200,
      browserRequestId,
    ).unref();
  }

  private doEmitResourceRequested(browserRequestId: string): boolean {
    if (this.requestIdsToIgnore.has(browserRequestId)) return;

    const resource = this.requestsById.get(browserRequestId);
    if (!resource) return false;
    if (!resource.url) return false;

    const publishing = this.getPublishingForRequestId(browserRequestId, true);
    clearTimeout(publishing.emitTimeout);
    publishing.emitTimeout = undefined;

    const event = <IBrowserNetworkEvents['resource-will-be-requested']>{
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
    if (this.requestIdsToIgnore.has(event.requestId)) return;

    const { response, requestId, loaderId, frameId, type } = event;

    const resource = this.requestsById.get(requestId);
    if (resource) {
      resource.responseHeaders = response.headers;
      resource.status = response.status;
      resource.statusMessage = response.statusText;
      resource.remoteAddress = `${response.remoteIPAddress}:${response.remotePort}`;
      resource.protocol = response.protocol;
      resource.responseUrl = response.url;
      resource.responseTime = response.responseTime;
      if (response.fromDiskCache) resource.browserServedFromCache = 'disk';
      if (response.fromServiceWorker) resource.browserServedFromCache = 'service-worker';
      if (response.fromPrefetchCache) resource.browserServedFromCache = 'prefetch';

      if (response.requestHeaders) this.mergeRequestHeaders(resource, response.requestHeaders);
      if (!resource.url) {
        try {
          resource.url = new URL(response.url);
        } catch {}
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
        timestamp: response.responseTime,
      });
    }
  }

  private onNetworkRequestServedFromCache(event: RequestServedFromCacheEvent): void {
    if (this.requestIdsToIgnore.has(event.requestId)) return;

    const { requestId } = event;
    const resource = this.requestsById.get(requestId);
    if (resource) {
      resource.browserServedFromCache = 'memory';
      setTimeout(() => this.emitLoaded(requestId, resource.requestTime), 500).unref();
    }
  }

  private onLoadingFailed(event: LoadingFailedEvent): void {
    if (this.requestIdsToIgnore.has(event.requestId)) return;

    const { requestId, canceled, blockedReason, errorText, timestamp } = event;

    const resource = this.requestsById.get(requestId);
    if (resource) {
      if (!resource.url || !resource.requestTime) {
        return;
      }

      if (canceled) resource.browserCanceled = true;
      if (blockedReason) resource.browserBlockedReason = blockedReason;
      if (errorText) resource.browserLoadFailure = errorText;
      resource.browserLoadedTime = this.monotonicTimeToUnix(timestamp);

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
    if (this.requestIdsToIgnore.has(event.requestId)) return;

    const { requestId, timestamp } = event;
    const eventTime = this.monotonicTimeToUnix(timestamp);
    this.emitLoaded(requestId, eventTime);
  }

  private emitLoaded(id: string, timestamp: number): void {
    if (this.requestIdsToIgnore.has(id)) return;

    const resource = this.requestsById.get(id);
    if (resource) {
      if (!this.requestPublishingById.get(id)?.isPublished) this.emitResourceRequested(id);
      this.requestsById.delete(id);
      this.requestPublishingById.delete(id);
      const loaderId = this.navigationRequestIdsToLoaderId.get(id);

      resource.browserLoadedTime = timestamp;

      if (this.redirectsById.has(id)) {
        for (const redirect of this.redirectsById.get(id)) {
          redirect.browserLoadedTime = timestamp;
          this.emit('resource-loaded', {
            resource: redirect,
            frameId: redirect.frameId,
            loaderId,
            body: () => Promise.resolve(Buffer.from('')),
          });
        }
        this.redirectsById.delete(id);
      }

      const body = this.downloadRequestBody.bind(this, id);
      this.emit('resource-loaded', {
        resource,
        frameId: resource.frameId,
        loaderId,
        body,
      });
    }
  }

  private async downloadRequestBody(requestId: string): Promise<Buffer> {
    if (this.requestIdsToIgnore.has(requestId)) return;

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
    if (this.requestIdsToIgnore.has(id)) return;

    const publishing = this.requestPublishingById.get(id);
    if (publishing) return publishing;
    if (createIfNull) {
      this.requestPublishingById.set(id, { hasRequestWillBeSentEvent: false });
      return this.requestPublishingById.get(id);
    }
  }
  /////// WEBSOCKET EVENT HANDLERS /////////////////////////////////////////////////////////////////

  private onWebSocketCreated(_event: WebSocketCreatedEvent): void {}

  private onWebsocketHandshake(handshake: WebSocketWillSendHandshakeRequestEvent): void {
    if (this.requestIdsToIgnore.has(handshake.requestId)) return;

    this.emit('websocket-handshake', {
      browserRequestId: handshake.requestId,
      headers: handshake.request.headers,
    });
  }

  private onWebsocketFrame(
    isFromServer: boolean,
    event: WebSocketFrameSentEvent | WebSocketFrameReceivedEvent,
  ): void {
    if (this.requestIdsToIgnore.has(event.requestId)) return;

    const browserRequestId = event.requestId;
    const { opcode, payloadData } = event.response;
    const message = opcode === 1 ? payloadData : Buffer.from(payloadData, 'base64');
    this.emit('websocket-frame', {
      message,
      browserRequestId,
      isFromServer,
      timestamp: this.monotonicTimeToUnix(event.timestamp),
    });
  }

  /////// UTILS ///////////
  private addRequestIdToIgnore(id: string): void {
    this.requestIdsToIgnore.add(id);
    while (this.requestIdsToIgnore.size > 1000) {
      const value = this.requestIdsToIgnore.values().next().value;
      this.requestIdsToIgnore.delete(value);
    }
  }
}
