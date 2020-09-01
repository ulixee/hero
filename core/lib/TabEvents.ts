import Log from "@secret-agent/commons/Logger";
import { EventEmitter } from "events";
import { LocationStatus } from "@secret-agent/core-interfaces/Location";
import { redirectCodes } from "@secret-agent/mitm/handlers/HttpRequestHandler";
import { IRequestSessionResponseEvent } from "@secret-agent/mitm/handlers/RequestSession";
import Protocol from "devtools-protocol";
import IResourceMeta from "@secret-agent/core-interfaces/IResourceMeta";
import { Tab } from "..";
import { exceptionDetailsToError, printStackTrace } from "./Utils";
import RequestWillBeSentEvent = Protocol.Network.RequestWillBeSentEvent;
import WebSocketFrameSentEvent = Protocol.Network.WebSocketFrameSentEvent;
import WebSocketFrameReceivedEvent = Protocol.Network.WebSocketFrameReceivedEvent;
import WebSocketWillSendHandshakeRequestEvent = Protocol.Network.WebSocketWillSendHandshakeRequestEvent;
import FrameRequestedNavigationEvent = Protocol.Page.FrameRequestedNavigationEvent;
import NavigatedWithinDocumentEvent = Protocol.Page.NavigatedWithinDocumentEvent;
import ResponseReceivedEvent = Protocol.Network.ResponseReceivedEvent;
import ExceptionThrownEvent = Protocol.Runtime.ExceptionThrownEvent;
import ConsoleAPICalledEvent = Protocol.Runtime.ConsoleAPICalledEvent;
import RequestPausedEvent = Protocol.Fetch.RequestPausedEvent;

const { log } = Log(module);

export default class TabEvents {
  private readonly tab: Tab;
  private emitter = new EventEmitter();

  private get sessionState() {
    return this.tab.sessionState;
  }

  private get devtoolsClient() {
    return this.tab.devtoolsClient;
  }

  private get lastCommandId() {
    return this.tab.lastCommandId;
  }

  private get mainFrameId() {
    return this.tab.frameTracker.mainFrameId;
  }

  private get pageUrl() {
    return this.tab.frameTracker.mainFrame?.url;
  }

  constructor(tab: Tab) {
    this.tab = tab;
    this.listenToErrors();
  }

  public async listen() {
    this.listenToMitm();
    await this.listenToDevtoolsEvents();
  }

  public on<K extends keyof ITabEventParams>(
    eventType: K,
    listenerFn: (this: this, event?: ITabEventParams[K]) => any,
  ) {
    this.emitter.on(eventType, listenerFn);
    return this;
  }

  public once<K extends keyof ITabEventParams>(
    eventType: K,
    listenerFn: (this: this, event?: ITabEventParams[K]) => any,
  ) {
    this.emitter.once(eventType, listenerFn);
    return this;
  }

  public emit<K extends keyof ITabEventParams>(eventType: K, event?: ITabEventParams[K]) {
    return this.emitter.emit(eventType, event);
  }

  private listenToMitm() {
    const requestSession = this.tab.session.requestMitmProxySession;
    requestSession.on('httpError', () => this.emit('request-intercepted'));

    requestSession.on('request', event => {
      this.sessionState.captureResource(event, false);
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

    devtoolsClient.on('Fetch.requestPaused', this.onFetchPaused.bind(this));
    devtoolsClient.on('Network.requestWillBeSent', this.onNetworkRequestWillBeSent.bind(this));
    devtoolsClient.on('Network.responseReceived', this.onNetworkResponseReceived.bind(this));

    devtoolsClient.on('Page.frameRequestedNavigation', this.onFrameRequestedNavigation.bind(this));

    devtoolsClient.on('Page.navigatedWithinDocument', this.onNavigatedWithinDocument.bind(this));

    devtoolsClient.on('Page.loadEventFired', this.onPageLoaded.bind(this));
    devtoolsClient.on('Page.domContentEventFired', this.onPageDomContentLoaded.bind(this));
  }

  private listenToErrors() {
    const devtoolsClient = this.devtoolsClient;
    devtoolsClient.on('Runtime.exceptionThrown', this.onRuntimeException.bind(this));
    devtoolsClient.on('Inspector.targetCrashed', this.onTargetCrashed.bind(this));
    devtoolsClient.on('Runtime.consoleAPICalled', this.onRuntimeConsole.bind(this));
  }

  /////// REQUESTS EVENT HANDLERS  /////////////////////////////////////////////////////////////////

  private onFetchPaused(networkRequest: RequestPausedEvent) {
    const { session } = this.tab;
    // requests from service workers (and others?) will never register with RequestWillBeSentEvent
    // -- they don't have networkIds
    if (!networkRequest.networkId) {
      session.requestMitmProxySession.registerResource({
        browserRequestId: networkRequest.requestId,
        resourceType: networkRequest.resourceType,
        url: networkRequest.request.url,
        method: networkRequest.request.method,
        hasUserGesture: false,
        isUserNavigation: false,
        documentUrl: networkRequest.request.headers.Referer,
      });
    }
  }

  private onNetworkRequestWillBeSent(networkRequest: RequestWillBeSentEvent) {
    const { session, lastCommandId } = this.tab;
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
      this.sessionState.pages.update(
        LocationStatus.HttpRequested,
        networkRequest.request.url,
        networkRequest.frameId,
        lastCommandId,
      );
    }
  }

  private onMitmRequestResponse(responseEvent: IRequestSessionResponseEvent) {
    const { request, wasCached, body } = responseEvent;
    const sessionId = this.tab.session.id;
    log.info('Http.Response', {
      sessionId,
      url: request.url,
      method: request.method,
      headers: responseEvent.response?.headers,
      wasCached,
      executionMillis: responseEvent.executionMillis,
      bytes: body ? Buffer.byteLength(body) : -1,
    });

    const resource = this.sessionState.captureResource(responseEvent, true);
    if (request.method !== 'OPTIONS') {
      if (resource.url === this.tab.navigationUrl) {
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
        this.tab.recordUserActivity(this.tab.navigationUrl);
      } catch (error) {
        this.sessionState.captureError(frameId, 'handleResponse', error);
      }
    }
  }

  /////// WEBSOCKET EVENT HANDLERS /////////////////////////////////////////////////////////////////

  private onWebsocketHandshake(handshake: WebSocketWillSendHandshakeRequestEvent) {
    const requestSession = this.tab.session.requestMitmProxySession;
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
    log.info('Page.navigatedWithinDocument', { sessionId: this.tab.session.id, ...navigation });
    const { url, frameId } = navigation;
    if (this.mainFrameId === frameId) {
      // set load state back to all loaded
      this.sessionState.pages.triggerInPageNavigation(url, this.lastCommandId, frameId);
    }
  }

  /////// FRAMES  //////////////////////////////////////////////////////////////////////////////////

  // client-side frame navigations (form posts/gets, redirects/ page reloads)
  private async onFrameRequestedNavigation(frameNavigationRequest: FrameRequestedNavigationEvent) {
    log.info('Page.frameRequestedNavigation', {
      sessionId: this.tab.session.id,
      ...frameNavigationRequest,
    });
    // disposition options: currentTab, newTab, newWindow, download
    const { frameId, url, reason } = frameNavigationRequest;
    if (this.mainFrameId === frameId) {
      this.sessionState.pages.updateNavigationReason(frameId, url, reason);
    }
  }

  /////// LOGGGING EVENTS //////////////////////////////////////////////////////////////////////////

  private onRuntimeException(msg: ExceptionThrownEvent) {
    const error = exceptionDetailsToError(msg.exceptionDetails);
    const frameId = this.tab.frameTracker.getFrameIdForExecutionContext(
      msg.exceptionDetails.executionContextId,
    );
    this.emit('pageerror', error);
    this.sessionState.captureError(frameId, `events.pageerror`, error);
  }

  private async onRuntimeConsole(event: ConsoleAPICalledEvent) {
    const { executionContextId, args, stackTrace, type, context } = event;
    const frameId = this.tab.frameTracker.getFrameIdForExecutionContext(executionContextId);

    const message = args
      .map(arg => {
        const objectId = arg.objectId;
        if (objectId) {
          this.devtoolsClient.send('Runtime.releaseObject', { objectId }).catch(() => {
            // sometimes this dies, not a problem
          });
          return arg.toString();
        }
        return arg.value;
      })
      .join(' ');

    const location = `//#${context ?? 'nocontext'}${printStackTrace(stackTrace)}`;
    this.sessionState.captureLog(frameId, type, message, location);
  }

  private onTargetCrashed() {
    const error = new Error('Target Crashed');
    this.emit('error', error);
    this.sessionState.captureError(this.mainFrameId, `events.error`, error);
  }
}

export interface ITabEventParams {
  load: undefined;
  domcontentloaded: undefined;
  'request-intercepted': IResourceMeta | undefined;
  error: Error;
  pageerror: Error;
  response: ResponseReceivedEvent;
}
