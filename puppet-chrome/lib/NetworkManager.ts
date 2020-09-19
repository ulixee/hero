import { Protocol } from 'devtools-protocol';
import { getResourceTypeForChromeValue } from '@secret-agent/core-interfaces/ResourceType';
import { IRegisteredEventListener, TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { IPuppetNetworkEvents } from '@secret-agent/puppet/interfaces/IPuppetNetworkEvents';
import IBrowserEmulation from '@secret-agent/puppet/interfaces/IBrowserEmulation';
import { debug } from '@secret-agent/commons/Debug';
import * as eventUtils from '@secret-agent/commons/eventUtils';
import { CDPSession } from './CDPSession';
import AuthChallengeResponse = Protocol.Fetch.AuthChallengeResponseResponse;
import Fetch = Protocol.Fetch;
import RequestWillBeSentEvent = Protocol.Network.RequestWillBeSentEvent;
import WebSocketFrameSentEvent = Protocol.Network.WebSocketFrameSentEvent;
import WebSocketFrameReceivedEvent = Protocol.Network.WebSocketFrameReceivedEvent;
import WebSocketWillSendHandshakeRequestEvent = Protocol.Network.WebSocketWillSendHandshakeRequestEvent;
import ResponseReceivedEvent = Protocol.Network.ResponseReceivedEvent;
import RequestPausedEvent = Protocol.Fetch.RequestPausedEvent;

const debugError = debug('puppet-chrome:network-error');

export class NetworkManager extends TypedEventEmitter<IPuppetNetworkEvents> {
  private readonly cdpSession: CDPSession;
  private readonly attemptedAuthentications = new Set<string>();
  private emulation?: IBrowserEmulation;

  private parentManager?: NetworkManager;
  private readonly registeredEvents: IRegisteredEventListener[];

  constructor(cdpSession: CDPSession) {
    super();
    this.cdpSession = cdpSession;
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

  public async initialize(emulation: IBrowserEmulation) {
    this.emulation = emulation;

    await Promise.all([
      this.cdpSession.send('Network.setUserAgentOverride', {
        userAgent: emulation.userAgent,
        acceptLanguage: emulation.acceptLanguage,
        platform: emulation.platform,
      }),
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

  public close() {
    eventUtils.removeEventListeners(this.registeredEvents);
  }

  public async initializeFromParent(parentManager: NetworkManager) {
    this.parentManager = parentManager;
    return this.initialize(parentManager.emulation);
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
      .catch(debugError);
  }

  private onRequestPaused(networkRequest: RequestPausedEvent) {
    this.cdpSession
      .send('Fetch.continueRequest', {
        requestId: networkRequest.requestId,
      })
      .catch(debugError);

    // requests from service workers (and others?) will never register with RequestWillBeSentEvent
    // -- they don't have networkIds
    if (!networkRequest.networkId) {
      this.emit('resource-will-be-requested', {
        browserRequestId: networkRequest.requestId,
        resourceType: getResourceTypeForChromeValue(networkRequest.resourceType),
        url: networkRequest.request.url,
        method: networkRequest.request.method,
        hasUserGesture: false,
        origin: networkRequest.request.headers.Origin,
        referer: networkRequest.request.headers.Referer,
        documentUrl: networkRequest.request.headers.Referer,
        isDocumentNavigation: false,
        frameId: networkRequest.frameId,
      });
    }
  }

  private onNetworkRequestWillBeSent(networkRequest: RequestWillBeSentEvent) {
    const isNavigation =
      networkRequest.requestId === networkRequest.loaderId && networkRequest.type === 'Document';

    if (isNavigation) {
      debug('resource')({ url: networkRequest.request.url, listeners: this.listenerCount('resource-will-be-requested') });
    }
    this.emit('resource-will-be-requested', {
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
    });
  }

  private async onNetworkResponseReceived(event: ResponseReceivedEvent) {
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

  private onWebsocketHandshake(handshake: WebSocketWillSendHandshakeRequestEvent) {
    this.emit('websocket-handshake', {
      browserRequestId: handshake.requestId,
      headers: handshake.request.headers,
    });
  }

  private onWebsocketFrame(
    isFromServer: boolean,
    event: WebSocketFrameSentEvent | WebSocketFrameReceivedEvent,
  ) {
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
