import Log from '@secret-agent/commons/Logger';
import { EventEmitter } from 'events';
import { LocationStatus } from '@secret-agent/core-interfaces/Location';
import { ConsoleMessage } from 'puppeteer';
import { redirectCodes } from '@secret-agent/mitm/lib/MitmRequestHandler';
import { Window } from '..';
import { IRequestSessionResponseEvent } from '@secret-agent/mitm/handlers/RequestSession';
import Protocol from 'devtools-protocol';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import RequestWillBeSentEvent = Protocol.Network.RequestWillBeSentEvent;
import WebSocketFrameSentEvent = Protocol.Network.WebSocketFrameSentEvent;
import WebSocketFrameReceivedEvent = Protocol.Network.WebSocketFrameReceivedEvent;
import WebSocketWillSendHandshakeRequestEvent = Protocol.Network.WebSocketWillSendHandshakeRequestEvent;
import FrameAttachedEvent = Protocol.Page.FrameAttachedEvent;
import FrameRequestedNavigationEvent = Protocol.Page.FrameRequestedNavigationEvent;
import NavigatedWithinDocumentEvent = Protocol.Page.NavigatedWithinDocumentEvent;
import ResponseReceivedEvent = Protocol.Network.ResponseReceivedEvent;

const { log } = Log(module);

export default class WindowEvents {
  private readonly window: Window;
  private emitter = new EventEmitter();

  private get sessionState() {
    return this.window.sessionState;
  }

  private get devtoolsClient() {
    return this.window.devtoolsClient;
  }

  private get lastCommandId() {
    return this.window.lastCommandId;
  }

  private get mainFrameId() {
    const puppPage = this.window.puppPage;
    if (!puppPage) return null;
    // @ts-ignore
    return puppPage.mainFrame()?._id as string;
  }

  private get pageUrl() {
    const puppPage = this.window.puppPage;
    if (puppPage) return puppPage.url();
  }

  constructor(window: Window) {
    this.window = window;
    this.listenToErrors();
  }

  public async listen() {
    this.listenToMitm();
    await this.listenToDevtoolsEvents();
  }

  public on<K extends keyof IWindowEventParams>(
    eventType: K,
    listenerFn: (this: this, event?: IWindowEventParams[K]) => any,
  ) {
    this.emitter.on(eventType, listenerFn);
    return this;
  }

  public once<K extends keyof IWindowEventParams>(
    eventType: K,
    listenerFn: (this: this, event?: IWindowEventParams[K]) => any,
  ) {
    this.emitter.once(eventType, listenerFn);
    return this;
  }

  public emit<K extends keyof IWindowEventParams>(eventType: K, event?: IWindowEventParams[K]) {
    return this.emitter.emit(eventType, event);
  }

  private listenToMitm() {
    const requestSession = this.window.session.requestMitmProxySession;
    requestSession.on('httpError', () => this.emit('request-intercepted'));

    requestSession.on('request', event => {
      const resource = this.sessionState.captureResource(event, false);
      this.emit('request-intercepted');
    });
    requestSession.on('response', this.onMitmRequestResponse.bind(this));
  }

  private async listenToDevtoolsEvents() {
    const devtoolsClient = this.devtoolsClient;

    await devtoolsClient.send('Network.enable', {
      maxPostDataSize: 0,
    });
    devtoolsClient.on(
      'Network.webSocketWillSendHandshakeRequest',
      this.onWebsocketHandshake.bind(this),
    );
    devtoolsClient.on('Network.webSocketFrameReceived', this.onWebsocketFrame.bind(this, true));
    devtoolsClient.on('Network.webSocketFrameSent', this.onWebsocketFrame.bind(this, false));

    devtoolsClient.on('Network.requestWillBeSent', this.onNetworkRequestWillBeSent.bind(this));
    devtoolsClient.on('Network.responseReceived', this.onNetworkResponseReceived.bind(this));

    devtoolsClient.on('Page.frameAttached', this.onFrameAttached.bind(this));
    devtoolsClient.on('Page.frameRequestedNavigation', this.onFrameRequestedNavigation.bind(this));

    devtoolsClient.on('Page.navigatedWithinDocument', this.onNavigatedWithinDocument.bind(this));

    devtoolsClient.on('Page.loadEventFired', this.onPageLoaded.bind(this));
    devtoolsClient.on('Page.domContentEventFired', this.onPageDomContentLoaded.bind(this));
  }

  private listenToErrors() {
    const puppPage = this.window.puppPage;

    puppPage.on('console', this.onConsoleLog.bind(this));
    puppPage.on('error', this.onError.bind(this, false));
    puppPage.on('pageerror', this.onError.bind(this, true));
  }

  /////// REQUESTS EVENT HANDLERS  /////////////////////////////////////////////////////////////////

  private onNetworkRequestWillBeSent(networkRequest: RequestWillBeSentEvent) {
    const { session, puppPage, lastCommandId } = this.window;
    session.requestMitmProxySession.registerResource({
      browserRequestId: networkRequest.requestId,
      resourceType: networkRequest.type,
      url: networkRequest.request.url,
      method: networkRequest.request.method,
      hasUserGesture: networkRequest.hasUserGesture,
      isUserNavigation: this.sessionState.pages.didGotoUrl(networkRequest.request.url),
      documentUrl: networkRequest.documentURL,
    });

    const isNavigation =
      networkRequest.requestId === networkRequest.loaderId && networkRequest.type === 'Document';
    // only track main frame for now
    if (isNavigation && networkRequest.frameId === this.mainFrameId) {
      this.sessionState.viewport = puppPage.viewport();
      this.sessionState.pages.update(
        LocationStatus.HttpRequested,
        networkRequest.request.url,
        networkRequest.frameId,
        lastCommandId,
      );
    }
  }

  private onMitmRequestResponse(responseEvent: IRequestSessionResponseEvent) {
    const { request, requestTime, wasCached, body, response } = responseEvent;
    const sessionId = this.window.session.id;
    log.info('Chrome.Response', {
      sessionId,
      url: request.url,
      method: request.method,
      wasCached,
      executionMillis: response.responseTime.getTime() - requestTime.getTime(),
      bytes: body ? Buffer.byteLength(body) : -1,
    });

    const resource = this.sessionState.captureResource(responseEvent, true);
    if (request.method !== 'OPTIONS') {
      if (resource.url === this.window.navigationUrl) {
        this.sessionState.pages.resourceLoadedForLocation(resource.id);
      }
      this.emit('request-intercepted', resource);
    } else {
      this.emit('request-intercepted');
    }
  }

  private async onNetworkResponseReceived(event: ResponseReceivedEvent) {
    const { response, requestId, loaderId, frameId, type } = event;
    this.emit('response', event);

    const isNavigation = requestId === loaderId && type === 'Document';
    if (!isNavigation) return;

    if (frameId === this.mainFrameId) {
      try {
        const location = response.headers.location;
        const isRedirect = redirectCodes.has(response.status) && !!location;

        if (isRedirect) {
          this.sessionState.pages.update(
            LocationStatus.HttpRedirected,
            location,
            frameId,
            this.lastCommandId,
          );
          return;
        }
        this.sessionState.pages.update(
          LocationStatus.HttpResponded,
          response.url,
          frameId,
          this.lastCommandId,
        );
        this.window.recordUserActivity(this.window.navigationUrl);
      } catch (error) {
        this.sessionState.captureError(frameId, 'handleResponse', error);
      }
    }
  }

  /////// WEBSOCKET EVENT HANDLERS /////////////////////////////////////////////////////////////////

  private onWebsocketHandshake(handshake: WebSocketWillSendHandshakeRequestEvent) {
    const requestSession = this.window.session.requestMitmProxySession;
    requestSession.registerWebsocketHeaders(handshake.requestId, handshake.request.headers);
  }

  private onWebsocketFrame(
    isFromServer: boolean,
    event: WebSocketFrameSentEvent | WebSocketFrameReceivedEvent,
  ) {
    const browserRequestId = event.requestId;
    const { opcode, payloadData } = event.response;
    const message = opcode === 1 ? payloadData : Buffer.from(payloadData, 'base64');
    this.sessionState.captureWebsocketMessage(browserRequestId, isFromServer, message);
  }

  /////// PAGE EVENTS  /////////////////////////////////////////////////////////////////////////////

  private async onPageLoaded() {
    this.emit('load');
    this.sessionState.pages.update(
      LocationStatus.AllContentLoaded,
      this.pageUrl,
      this.mainFrameId,
      this.lastCommandId,
    );
  }

  private async onPageDomContentLoaded() {
    this.emit('domcontentloaded');
    this.sessionState.pages.update(
      LocationStatus.DomContentLoaded,
      this.pageUrl,
      this.mainFrameId,
      this.lastCommandId,
    );
  }

  // in-page navigation triggered (anchors and html5)
  private async onNavigatedWithinDocument(navigation: NavigatedWithinDocumentEvent) {
    log.info('Page.navigatedWithinDocument', { sessionId: this.window.session.id, ...navigation });
    const { url, frameId } = navigation;
    if (this.mainFrameId === frameId) {
      // set load state back to all loaded
      this.sessionState.pages.triggerInPageNavigation(url, this.lastCommandId, frameId);
    }
  }

  /////// FRAMES  //////////////////////////////////////////////////////////////////////////////////

  // Fired when frame has been attached to its parent.
  private async onFrameAttached(frameAttached: FrameAttachedEvent) {
    const { frameId, parentFrameId } = frameAttached;
    this.sessionState.captureFrameCreated(frameId, parentFrameId);
  }

  // client-side frame navigations (form posts/gets, redirects/ page reloads)
  private async onFrameRequestedNavigation(frameNavigationRequest: FrameRequestedNavigationEvent) {
    log.info('Page.frameRequestedNavigation', {
      sessionId: this.window.session.id,
      ...frameNavigationRequest,
    });
    // disposition options: currentTab, newTab, newWindow, download
    const { frameId, url, reason } = frameNavigationRequest;
    if (this.mainFrameId === frameId) {
      this.sessionState.pages.updateNavigationReason(frameId, url, reason);
    }
  }

  /////// LOGGGING EVENTS //////////////////////////////////////////////////////////////////////////

  private onConsoleLog(msg: ConsoleMessage) {
    const location = msg.location()
      ? `${msg.location().url} ${msg.location().lineNumber ?? '_'}:${msg.location().columnNumber ??
          '_'}`
      : undefined;
    this.sessionState.captureLog(this.mainFrameId, msg.type(), msg.text(), location);
  }

  private onError(isPageError: boolean, error: Error) {
    const errorType = isPageError ? 'pageerror' : 'error';
    this.emit(errorType, error);
    this.sessionState.captureError(this.mainFrameId, `events.${errorType}`, error);
  }
}

export interface IWindowEventParams {
  load: undefined;
  domcontentloaded: undefined;
  'request-intercepted': IResourceMeta | undefined;
  error: Error;
  pageerror: Error;
  response: ResponseReceivedEvent;
}
