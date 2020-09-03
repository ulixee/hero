import Log from '@secret-agent/commons/Logger';
import { IPipelineStatus, LocationStatus } from '@secret-agent/core-interfaces/Location';
import { redirectCodes } from '@secret-agent/mitm/handlers/HttpRequestHandler';
import { IRequestSessionResponseEvent } from '@secret-agent/mitm/handlers/RequestSession';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import { IPageEvents } from '@secret-agent/puppet-chrome/lib/Page';
import { INetworkEvents } from '@secret-agent/puppet-chrome/lib/NetworkManager';
import Protocol from 'devtools-protocol';
import { IFrameEvents } from '@secret-agent/puppet-chrome/lib/Frames';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { Tab } from '..';
import ResponseReceivedEvent = Protocol.Network.ResponseReceivedEvent;

const { log } = Log(module);

export default class TabEvents extends TypedEventEmitter<ITabEventParams> {
  private readonly tab: Tab;

  private get sessionState() {
    return this.tab.sessionState;
  }

  private get lastCommandId() {
    return this.tab.lastCommandId;
  }

  private get mainFrameId() {
    return this.tab.mainFrameId;
  }

  private get pageUrl() {
    return this.tab.puppetPage.url;
  }

  constructor(tab: Tab) {
    super();
    this.tab = tab;
    tab.puppetPage.on('pageError', this.onPageError.bind(this));
    tab.puppetPage.on('targetCrashed', this.onTargetCrashed.bind(this));
    tab.puppetPage.on('consoleLog', this.onConsole.bind(this));
  }

  public async listen() {
    const requestSession = this.tab.session.requestMitmProxySession;

    requestSession.on('httpError', () => this.emit('request-intercepted'));
    requestSession.on('request', event => {
      this.sessionState.captureResource(event, false);
      this.emit('request-intercepted');
    });
    requestSession.on('response', this.onMitmRequestResponse.bind(this));

    const page = this.tab.puppetPage;
    page.on('frameNavigated', this.onFrameNavigated.bind(this));
    page.on('frameRequestedNavigation', this.onFrameRequestedNavigation.bind(this));
    page.on('frameLifecycle', this.onFrameLifecycle.bind(this));

    const network = page.networkManager;
    network.on('websocketHandshake', this.onWebsocketHandshake.bind(this));
    network.on('websocketFrame', this.onWebsocketFrame.bind(this));
    network.on('resourceWillBeRequested', this.onResourceWillBeRequested.bind(this));
    network.on('navigationResponse', this.onNetworkResponseReceived.bind(this));
  }

  /////// REQUESTS EVENT HANDLERS  /////////////////////////////////////////////////////////////////

  private onResourceWillBeRequested(event: INetworkEvents['resourceWillBeRequested']) {
    const { session, lastCommandId } = this.tab;
    const { url, isDocumentNavigation, frameId } = event;
    session.requestMitmProxySession.registerResource({
      ...event,
      isUserNavigation: this.sessionState.pages.didGotoUrl(url),
    });

    // only track main frame for now
    if (isDocumentNavigation && frameId === this.mainFrameId) {
      this.sessionState.pages.update(LocationStatus.HttpRequested, url, frameId, lastCommandId);
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

  private async onNetworkResponseReceived(event: INetworkEvents['navigationResponse']) {
    if (event.frameId !== this.mainFrameId) return;

    const { location, url, status, frameId } = event;
    try {
      const isRedirect = redirectCodes.has(status) && !!location;

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
        url,
        frameId,
        this.lastCommandId,
      );
      this.tab.recordUserActivity(this.tab.navigationUrl);
    } catch (error) {
      this.sessionState.captureError(frameId, 'handleResponse', error);
    }
  }

  /////// WEBSOCKET EVENT HANDLERS /////////////////////////////////////////////////////////////////

  private onWebsocketHandshake(handshake: INetworkEvents['websocketHandshake']) {
    const requestSession = this.tab.session.requestMitmProxySession;
    requestSession.registerWebsocketHeaders(handshake.browserRequestId, handshake.headers);
  }

  private onWebsocketFrame(event: INetworkEvents['websocketFrame']) {
    const { browserRequestId, isFromServer, message } = event;
    this.sessionState.captureWebsocketMessage(browserRequestId, isFromServer, message);
  }

  /////// PAGE EVENTS  /////////////////////////////////////////////////////////////////////////////

  private onFrameLifecycle(event: IFrameEvents['frameLifecycle']) {
    if (event.frame.id === this.mainFrameId) {
      const eventName = event.name.toLowerCase();
      let status: IPipelineStatus;
      if (eventName === 'load') {
        this.emit(eventName);
        status = LocationStatus.AllContentLoaded;
      } else if (eventName === 'domcontentloaded') {
        this.emit(eventName);
        status = LocationStatus.DomContentLoaded;
      }
      if (status) {
        this.sessionState.pages.update(status, this.pageUrl, this.mainFrameId, this.lastCommandId);
      }
    }
  }

  // in-page navigation triggered (anchors and html5)
  private async onFrameNavigated(event: IFrameEvents['frameNavigated']) {
    const { navigatedInDocument, frame } = event;
    if (this.mainFrameId === frame.id && navigatedInDocument) {
      log.info('Page.navigatedWithinDocument', {
        sessionId: this.tab.session.id,
        ...event,
      });
      // set load state back to all loaded
      this.sessionState.pages.triggerInPageNavigation(frame.url, this.lastCommandId, frame.id);
    }
  }

  // client-side frame navigations (form posts/gets, redirects/ page reloads)
  private async onFrameRequestedNavigation(event: IFrameEvents['frameRequestedNavigation']) {
    log.info('Page.frameRequestedNavigation', {
      sessionId: this.tab.session.id,
      ...event,
    });
    // disposition options: currentTab, newTab, newWindow, download
    const { frame, url, reason } = event;
    if (this.mainFrameId === frame.id) {
      this.sessionState.pages.updateNavigationReason(frame.id, url, reason);
    }
  }

  /////// LOGGGING EVENTS //////////////////////////////////////////////////////////////////////////

  private onPageError(event: IPageEvents['pageError']) {
    const { error, frameId } = event;
    this.emit('pageerror', error);
    this.sessionState.captureError(frameId, `events.pageerror`, error);
  }

  private async onConsole(event: IPageEvents['consoleLog']) {
    const { frameId, type, message, location } = event;
    this.sessionState.captureLog(frameId, type, message, location);
  }

  private onTargetCrashed(event: IPageEvents['targetCrashed']) {
    const error = event.error;
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
