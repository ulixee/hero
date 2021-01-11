import { Protocol } from 'devtools-protocol';
import { getResourceTypeForChromeValue } from '@secret-agent/core-interfaces/ResourceType';
import * as eventUtils from '@secret-agent/commons/eventUtils';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { IPuppetNetworkEvents } from '@secret-agent/puppet-interfaces/IPuppetNetworkEvents';
import IBrowserEmulationSettings from '@secret-agent/puppet-interfaces/IBrowserEmulationSettings';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import IRegisteredEventListener from '@secret-agent/core-interfaces/IRegisteredEventListener';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import { CDPSession } from './CDPSession';
import AuthChallengeResponse = Protocol.Fetch.AuthChallengeResponseResponse;
import Fetch = Protocol.Fetch;
import RequestWillBeSentEvent = Protocol.Network.RequestWillBeSentEvent;
import WebSocketFrameSentEvent = Protocol.Network.WebSocketFrameSentEvent;
import WebSocketFrameReceivedEvent = Protocol.Network.WebSocketFrameReceivedEvent;
import WebSocketWillSendHandshakeRequestEvent = Protocol.Network.WebSocketWillSendHandshakeRequestEvent;
import ResponseReceivedEvent = Protocol.Network.ResponseReceivedEvent;
import RequestPausedEvent = Protocol.Fetch.RequestPausedEvent;

export class NetworkManager extends TypedEventEmitter<IPuppetNetworkEvents> {
  protected readonly logger: IBoundLog;
  private readonly cdpSession: CDPSession;
  private readonly attemptedAuthentications = new Set<string>();
  private readonly publishedResources = new Set<string>();
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

    const resource = <IPuppetNetworkEvents['resource-will-be-requested']>{
      browserRequestId: networkRequest.networkId ?? networkRequest.requestId,
      resourceType: getResourceTypeForChromeValue(networkRequest.resourceType),
      url: networkRequest.request.url,
      method: networkRequest.request.method,
      hasUserGesture: false,
      origin: networkRequest.request.headers.Origin,
      referer: networkRequest.request.headers.Referer,
      documentUrl: networkRequest.request.headers.Referer,
      isDocumentNavigation: false,
      frameId: networkRequest.frameId,
      redirectedFromUrl: null,
    };
    // requests from service workers (and others?) will never register with RequestWillBeSentEvent
    // -- they don't have networkIds
    if (!networkRequest.networkId) {
      this.emitResource(resource);
    } else {
      // send on delay in case we never get a Network.requestWillBeSent (happens for certain types of requests)
      setTimeout(this.emitResource.bind(this), 500, resource).unref();
    }
  }

  private onNetworkRequestWillBeSent(networkRequest: RequestWillBeSentEvent): void {
    const isNavigation =
      networkRequest.requestId === networkRequest.loaderId && networkRequest.type === 'Document';

    const redirectedFromUrl = networkRequest.redirectResponse?.url;
    const resource = {
      browserRequestId: networkRequest.requestId,
      resourceType: getResourceTypeForChromeValue(networkRequest.type),
      url: networkRequest.request.url,
      method: networkRequest.request.method,
      hasUserGesture: networkRequest.hasUserGesture,
      documentUrl: networkRequest.documentURL,
      origin: networkRequest.request.headers.Origin,
      referer: networkRequest.request.headers.Referer,
      isDocumentNavigation: isNavigation,
      frameId: networkRequest.frameId,
      redirectedFromUrl,
    };
    const didEmit = this.emitResource(resource);
    if (!didEmit) {
      // this can happen in 2 cases observed so far:
      // 1: the fetch comes first and Network.requestWillBeSent takes > 500 ms
      // 2: a duplicated resource is loaded across frames and piggybacks the first request
      this.logger.info('ResourceEmittedTwice', resource);
    }
  }

  private emitResource(event: IPuppetNetworkEvents['resource-will-be-requested']): boolean {
    // NOTE: same requestId will be used in devtools for redirected resources
    if (this.publishedResources.has(`${event.browserRequestId}_${event.url}`)) return false;
    this.publishedResources.add(`${event.browserRequestId}_${event.url}`);

    this.emit('resource-will-be-requested', event);
    return true;
  }

  private onNetworkResponseReceived(event: ResponseReceivedEvent): void {
    const { response, requestId, loaderId, frameId, type } = event;

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
