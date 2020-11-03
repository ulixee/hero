import { v1 as uuidv1 } from 'uuid';
import Log, { IBoundLog } from '@secret-agent/commons/Logger';
import ITabOptions from '@secret-agent/core-interfaces/ITabOptions';
import {
  ILocationStatus,
  ILocationTrigger,
  LocationStatus,
} from '@secret-agent/core-interfaces/Location';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import ICommandMeta from '@secret-agent/core-interfaces/ICommandMeta';
import { AllowedNames } from '@secret-agent/commons/AllowedNames';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import { IInteractionGroups } from '@secret-agent/core-interfaces/IInteractions';
import * as Url from 'url';
import { URL } from 'url';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import Timer from '@secret-agent/commons/Timer';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import { createPromise } from '@secret-agent/commons/utils';
import TimeoutError from '@secret-agent/commons/interfaces/TimeoutError';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import IExecJsPathResult from '@secret-agent/injected-scripts/interfaces/IExecJsPathResult';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import { IPuppetPage, IPuppetPageEvents } from '@secret-agent/puppet/interfaces/IPuppetPage';
import { IPuppetFrameEvents } from '@secret-agent/puppet/interfaces/IPuppetFrame';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import LocationTracker from './LocationTracker';
import Interactor from './Interactor';
import Session from './Session';
import DomEnv from './DomEnv';
import IResourceFilterProperties from '../interfaces/IResourceFilterProperties';
import DomRecorder from './DomRecorder';
import IWebsocketResourceMessage from '../interfaces/IWebsocketResourceMessage';

const { log } = Log(module);

export default class Tab extends TypedEventEmitter<ITabEventParams> {
  public readonly id: string;
  public readonly parentTabId?: string;
  public readonly session: Session;
  public readonly locationTracker: LocationTracker;
  public readonly domRecorder: DomRecorder;
  public readonly domEnv: DomEnv;
  public puppetPage: IPuppetPage;
  public isClosing = false;

  public isReady: Promise<void>;

  protected readonly logger: IBoundLog;

  private readonly createdAtCommandId: number;
  private readonly interactor: Interactor;
  private waitTimeouts: { timeout: NodeJS.Timeout; reject: (reason?: any) => void }[] = [];

  private get navigationTracker() {
    return this.sessionState.navigationsByTabId[this.id];
  }

  public get url() {
    return this.navigationTracker.currentUrl;
  }

  public get sessionState() {
    return this.session.sessionState;
  }

  public get lastCommandId() {
    return this.sessionState.lastCommand?.id;
  }

  public get sessionId() {
    return this.session.id;
  }

  public get mainFrameId() {
    return this.puppetPage.mainFrame.id;
  }

  private constructor(
    session: Session,
    puppetPage: IPuppetPage,
    parentTabId?: string,
    windowOpenParams?: { url: string; windowName: string },
  ) {
    super();
    this.setEventsToLog(['child-tab-created', 'close']);
    this.id = uuidv1();
    this.logger = log.createChild(module, {
      tabId: this.id,
      sessionId: session.id,
    });
    this.session = session;
    this.parentTabId = parentTabId;
    this.sessionState.registerTab(this.id);
    this.createdAtCommandId = this.sessionState.lastCommand?.id;
    this.puppetPage = puppetPage;
    this.interactor = new Interactor(this);
    this.locationTracker = new LocationTracker(this.navigationTracker);
    this.domEnv = new DomEnv(this, this.puppetPage);
    this.domRecorder = new DomRecorder(
      session.id,
      puppetPage,
      // bind session state to tab id
      this.sessionState.onPageEvents.bind(this.sessionState, this.id),
    );

    if (windowOpenParams) {
      this.navigationTracker.navigationRequested(
        'newTab',
        windowOpenParams.url,
        this.mainFrameId,
        this.lastCommandId,
      );
    }
    this.listen();
    this.isReady = this.install();
  }

  public async config(options: ITabOptions) {
    const mitmSession = this.session.mitmRequestSession;
    const blockedResources = mitmSession.blockedResources.types;
    const renderingOptions = options?.renderingOptions ?? [];
    let enableJs = true;

    if (renderingOptions.includes('All')) {
      blockedResources.length = 0;
    } else if (renderingOptions.includes('None')) {
      blockedResources.push('Image', 'Stylesheet', 'Script', 'Font', 'Ico', 'Media');
      enableJs = false;
    } else {
      if (!renderingOptions.includes('LoadImages')) {
        blockedResources.push('Image');
      }
      if (!renderingOptions.includes('LoadCssResources')) {
        blockedResources.push('Stylesheet');
      }
      if (!renderingOptions.includes('LoadJsResources')) {
        blockedResources.push('Script');
      }
      if (!renderingOptions.includes('JsRuntime')) {
        enableJs = false;
      }
    }
    await this.puppetPage.setJavaScriptEnabled(enableJs);
    mitmSession.blockedResources.urls = [];
  }

  public async close() {
    if (this.isClosing) return;
    this.isClosing = true;
    this.logger.info('Tab.Closing');

    if (this.navigationTracker.top?.frameId) {
      await this.domRecorder.flush(true);
    }

    try {
      const cancelMessage = 'Terminated command because session closing';
      Timer.expireAll(this.waitTimeouts, new CanceledPromiseError(cancelMessage));
      this.cancelPendingEvents(cancelMessage);
      await this.puppetPage.close();

      this.emit('close');
    } catch (error) {
      if (!error.message.includes('Target closed')) {
        this.logger.error('Tab.ClosingError', { error });
      }
    }
  }

  public async runCommand<T>(functionName: TabFunctionNames, ...args: any[]) {
    const commandHistory = this.sessionState.commands;

    const commandMeta = {
      id: commandHistory.length + 1,
      tabId: this.id,
      frameId: this.mainFrameId,
      name: functionName,
      args: args.length ? JSON.stringify(args) : undefined,
    } as ICommandMeta;

    this.locationTracker.willRunCommand(commandMeta, commandHistory);
    if (functionName !== 'goto') {
      await this.domRecorder.setCommandIdForPage(commandMeta.id);
    }
    const id = this.logger.info('Tab.runCommand', commandMeta);
    let result: T;
    try {
      const commandFn = this[functionName].bind(this, ...args);
      result = await this.sessionState.runCommand<T>(commandFn, commandMeta);
    } finally {
      this.logger.stats('Tab.ranCommand', { result, parentLogId: id });
    }
    return result;
  }

  public async setOrigin(origin: string) {
    const mitmSession = this.session.mitmRequestSession;
    const originalBlocker = mitmSession.blockedResources;
    mitmSession.blockedResources = {
      types: [],
      urls: [origin],
      handlerFn(request, response) {
        response.end(`<html lang="en"><body>Empty</body></html>`);
        return true;
      },
    };
    try {
      await this.puppetPage.navigate(origin);
    } finally {
      // restore originals
      mitmSession.blockedResources = originalBlocker;
    }
  }

  public async getResourceProperty(resourceid: number, propertyPath: string) {
    let finalResourceId = resourceid;
    // if no resource id, this is a request for the default resource (page)
    if (!resourceid) {
      await this.waitForLoad('READY');
      finalResourceId = await this.locationTracker.waitForLocationResourceId();
    }

    if (propertyPath === 'data' || propertyPath === 'response.data') {
      return await this.sessionState.getResourceData(finalResourceId);
    }

    const resource = this.sessionState.getResourceMeta(finalResourceId);

    const pathParts = propertyPath.split('.');

    let propertyParent: any = resource;
    if (pathParts.length > 1) {
      const parentProp = pathParts.shift();
      if (parentProp === 'request' || parentProp === 'response') {
        propertyParent = propertyParent[parentProp];
      }
    }
    const property = pathParts.shift();
    return propertyParent[property];
  }

  /////// COMMANDS /////////////////////////////////////////////////////////////////////////////////////////////////////

  public async goto(url: string) {
    const formattedUrl = Url.format(url);
    this.session.proxy.start(formattedUrl);

    this.navigationTracker.navigationRequested(
      'goto',
      formattedUrl,
      this.mainFrameId,
      this.lastCommandId,
    );

    await this.puppetPage.navigate(formattedUrl);

    return this.locationTracker
      .waitForLocationResourceId()
      .then(x => this.sessionState.getResourceMeta(x));
  }

  public async goBack() {
    await this.puppetPage.goBack();
    await this.locationTracker.waitFor('AllContentLoaded');
    return this.navigationTracker.currentUrl;
  }

  public async goForward() {
    await this.puppetPage.goForward();
    await this.locationTracker.waitFor('AllContentLoaded');
    return this.navigationTracker.currentUrl;
  }

  public async interact(interactionGroups: IInteractionGroups) {
    await this.locationTracker.waitFor('READY');
    await this.interactor.play(interactionGroups);
  }

  public async getJsValue<T>(path: string) {
    return this.domEnv.execNonIsolatedExpression<T>(path);
  }

  public async execJsPath<T>(
    jsPath: IJsPath,
    propertiesToExtract?: string[],
  ): Promise<IExecJsPathResult<T>> {
    // if nothing loaded yet, return immediately
    if (!this.navigationTracker.top) return null;
    await this.waitForLoad('READY');
    return this.domEnv.execJsPath<T>(jsPath, propertiesToExtract);
  }

  public createRequest(input: string | number, init?: IRequestInit) {
    return this.domEnv.createFetchRequest(input, init);
  }

  public fetch(input: string | number, init?: IRequestInit) {
    return this.domEnv.execFetch(input, init);
  }

  public async getLocationHref() {
    await this.waitForLoad('READY');
    return this.domEnv.locationHref();
  }

  public async getPageCookies(): Promise<ICookie[]> {
    await this.waitForLoad('READY');
    return await this.session.browserContext.getCookies(new URL(this.puppetPage.mainFrame.url));
  }

  public async getUserCookies(): Promise<ICookie[]> {
    await this.waitForLoad('READY');
    return await this.session.browserContext.getCookies();
  }

  public async focus() {
    await this.puppetPage.bringToFront();
  }

  public async isElementVisible(jsPath: IJsPath) {
    const isVisible = await this.domEnv.isJsPathVisible(jsPath);
    return isVisible.value;
  }

  public async waitForNewTab(sinceCommandId: number) {
    if (sinceCommandId >= 0) {
      for (const tab of this.session.tabs) {
        if (tab.parentTabId === this.id && tab.createdAtCommandId >= sinceCommandId) {
          return tab;
        }
      }
    }
    return this.waitOn('child-tab-created');
  }

  public async waitForResource(filter: IResourceFilterProperties, opts?: IWaitForResourceOptions) {
    const timer = new Timer(opts?.timeoutMs ?? 60e3, this.waitTimeouts);
    const resourceMetas: IResourceMeta[] = [];
    const promise = createPromise();

    const onResource = (resourceMeta: IResourceMeta) => {
      if (resourceMeta.tabId !== this.id) return;
      if (resourceMeta.seenAtCommandId === undefined) {
        resourceMeta.seenAtCommandId = this.lastCommandId;
        // need to set directly since passed in object is a copy
        this.sessionState.getResourceMeta(resourceMeta.id).seenAtCommandId = this.lastCommandId;
      }
      if (resourceMeta.seenAtCommandId <= opts?.sinceCommandId ?? -1) return;
      if (filter.type && resourceMeta.type !== filter.type) return;
      if (filter.url) {
        if (typeof filter.url === 'string') {
          // don't let query string url
          if (filter.url.match(/[\w.:/_\-@;$]\?[-+;%@.\w_]+=.+/) && !filter.url.includes('\\?')) {
            filter.url = filter.url.replace('?', '\\?');
          }
        }
        if (!resourceMeta.url.match(filter.url)) return;
      }
      // if already included, skip
      if (resourceMetas.some(x => x.id === resourceMeta.id)) return;

      resourceMetas.push(resourceMeta);
      // resolve if any match
      promise.resolve();
    };

    try {
      this.on('resource', onResource);
      for (const resource of this.sessionState.getResources(this.id)) {
        onResource(resource);
      }
      await timer.waitForPromise(promise.promise, 'Timeout waiting for DomContentLoaded');
    } catch (err) {
      const isTimeout = err instanceof TimeoutError;
      if (isTimeout && opts?.throwIfTimeout === false) {
        return resourceMetas;
      }
      throw err;
    } finally {
      this.off('resource', onResource);
      timer.clear();
    }

    return resourceMetas;
  }

  public async waitForElement(jsPath: IJsPath, options?: IWaitForElementOptions) {
    const waitForVisible = options?.waitForVisible ?? false;
    const timeoutMs = options?.timeoutMs ?? 30e3;
    const timeoutPerTry = timeoutMs < 1e3 ? timeoutMs : 1e3;
    const timeoutMessage = `Timeout waiting for element ${jsPath} to be visible`;

    const timer = new Timer(timeoutMs, this.waitTimeouts);
    await timer.waitForPromise(
      this.locationTracker.waitFor('READY'),
      'Timeout waiting for DomContentLoaded',
    );

    try {
      let isFound = false;
      do {
        const promise = this.domEnv
          .waitForElement(jsPath, waitForVisible, timeoutPerTry)
          .catch(() => null);

        const jsonValue = await timer.waitForPromise(promise, timeoutMessage);
        isFound = (jsonValue as any)?.value ?? false;
        if (isFound) return true;

        if (timer.isResolved()) return false;
        timer.throwIfExpired(timeoutMessage);
      } while (!isFound);
    } finally {
      timer.clear();
    }
  }

  public async waitForLoad(status: ILocationStatus | 'READY') {
    return await this.locationTracker.waitFor(status);
  }

  public async waitForLocation(trigger: ILocationTrigger) {
    return await this.locationTracker.waitFor(trigger);
  }

  public async waitForMillis(millis: number): Promise<void> {
    return await new Timer(millis, this.waitTimeouts).waitForTimeout();
  }

  public async waitForNode(pathToNode: IJsPath) {
    return await this.waitForElement(pathToNode);
  }

  /////// UTILITIES ////////////////////////////////////////////////////////////////////////////////////////////////////

  public async toJSON() {
    return {
      id: this.id,
      parentTabId: this.parentTabId,
      sessionId: this.sessionId,
      url: this.navigationTracker.currentUrl,
      createdAtCommandId: this.createdAtCommandId,
    };
  }

  private async install() {
    await this.domEnv.install();

    const page = this.puppetPage;
    const pageOverrides = await this.session.emulator.generatePageOverrides();
    for (const pageOverride of pageOverrides) {
      if (pageOverride.callbackWindowName) {
        await page.addPageCallback(pageOverride.callbackWindowName, payload => {
          pageOverride.callback(JSON.parse(payload));
        });
      }
      // overrides happen in main frame
      await page.addNewDocumentScript(pageOverride.script, false);
    }

    await this.domRecorder.install();
    if (this.parentTabId) {
      // the page is paused waiting for debugger, so it won't resume until "install" is complete
      this.domRecorder.setCommandIdForPage(this.lastCommandId).catch(error => {
        this.logger.warn('Tab.child.setCommandId.error', {
          error,
        });
      });
    }
  }

  private listen() {
    const page = this.puppetPage;

    page.on('page-error', this.onPageError.bind(this), true);
    page.on('crashed', this.onTargetCrashed.bind(this));
    page.on('console', this.onConsole.bind(this), true);
    page.on('frame-created', this.onFrameCreated.bind(this), true);

    // resource requested should registered before navigations so we can grab nav on new tab anchor clicks
    page.on('resource-will-be-requested', this.onResourceWillBeRequested.bind(this), true);
    page.on('navigation-response', this.onNavigationResourceResponse.bind(this), true);

    page.on('frame-navigated', this.onFrameNavigated.bind(this), true);
    page.on('frame-requested-navigation', this.onFrameRequestedNavigation.bind(this), true);
    page.on('frame-lifecycle', this.onFrameLifecycle.bind(this), true);

    // websockets
    page.on('websocket-handshake', ev => {
      this.session.mitmRequestSession?.registerWebsocketHeaders(this.id, ev);
    });
    page.on('websocket-frame', this.onWebsocketFrame.bind(this));
  }

  /////// REQUESTS EVENT HANDLERS  /////////////////////////////////////////////////////////////////

  private onResourceWillBeRequested(event: IPuppetPageEvents['resource-will-be-requested']) {
    const { session, lastCommandId } = this;
    const { url, isDocumentNavigation, frameId, redirectedFromUrl } = event;

    if (isDocumentNavigation && !this.navigationTracker.top) {
      this.navigationTracker.navigationRequested('newTab', url, frameId, lastCommandId);
    }

    session.mitmRequestSession.registerResource({
      ...event,
      tabId: this.id,
      isUserNavigation: event.hasUserGesture || this.navigationTracker.didGotoUrl(url),
    });

    // only track main frame for now
    if (isDocumentNavigation && frameId === this.mainFrameId) {
      this.navigationTracker.updatePipelineStatus({
        incomingStatus: LocationStatus.HttpRequested,
        url,
        redirectedFromUrl,
        lastCommandId,
        frameId,
      });
    }
  }

  private async onNavigationResourceResponse(event: IPuppetPageEvents['navigation-response']) {
    if (event.frameId !== this.mainFrameId) return;

    this.navigationTracker.updatePipelineStatus({
      incomingStatus: LocationStatus.HttpResponded,
      url: event.url,
      frameId: event.frameId,
      lastCommandId: this.lastCommandId,
    });
    this.session.mitmRequestSession.recordDocumentUserActivity(event.url);
  }

  private onWebsocketFrame(event: IPuppetPageEvents['websocket-frame']) {
    const wsResource = this.sessionState.captureWebsocketMessage(event);
    this.emit('websocket-message', wsResource);
  }

  /////// PAGE EVENTS  /////////////////////////////////////////////////////////////////////////////

  private onFrameLifecycle(event: IPuppetFrameEvents['frame-lifecycle']) {
    if (event.frame.id === this.mainFrameId) {
      const eventName = event.name.toLowerCase();
      const status = {
        load: LocationStatus.AllContentLoaded,
        domcontentloaded: LocationStatus.DomContentLoaded,
      }[eventName];

      if (status) {
        const frame = this.puppetPage.mainFrame;
        this.navigationTracker.updatePipelineStatus({
          incomingStatus: status,
          url: frame.url,
          frameId: frame.id,
          lastCommandId: this.lastCommandId,
        });
      }
    }
  }

  private async onFrameNavigated(event: IPuppetFrameEvents['frame-navigated']) {
    const { navigatedInDocument, frame } = event;
    if (this.mainFrameId === frame.id && navigatedInDocument) {
      this.logger.info('Page.navigatedWithinDocument', event);
      // set load state back to all loaded
      this.navigationTracker.triggerInPageNavigation(frame.url, this.lastCommandId, frame.id);
    } else if (this.mainFrameId !== frame.id) {
      this.sessionState.captureSubFrameNavigated(this.id, frame, navigatedInDocument);
    }
  }

  // client-side frame navigations (form posts/gets, redirects/ page reloads)
  private async onFrameRequestedNavigation(
    event: IPuppetFrameEvents['frame-requested-navigation'],
  ) {
    this.logger.info('Page.frameRequestedNavigation', event);
    // disposition options: currentTab, newTab, newWindow, download
    const { frame, url, reason } = event;
    if (this.mainFrameId === frame.id) {
      this.navigationTracker.updateNavigationReason(frame.id, url, reason);
    }
  }

  private async onFrameCreated(event: IPuppetFrameEvents['frame-created']) {
    const { frame } = event;
    let domNodeId: number = null;
    try {
      if (frame.parentId) {
        domNodeId = await frame.evaluateOnIsolatedFrameElement<number>('saTrackerNodeId');
      }
    } catch (error) {
      // This can happen if the node goes away. Still want to record frame
      this.logger.warn('FrameCreated.getDomNodeIdError', {
        error,
        frameId: frame.id,
      });
    }

    this.sessionState.captureFrameCreated(this.id, frame, domNodeId);
  }

  /////// LOGGGING EVENTS //////////////////////////////////////////////////////////////////////////

  private onPageError(event: IPuppetPageEvents['page-error']) {
    const { error, frameId } = event;
    this.sessionState.captureError(this.id, frameId, `events.page-error`, error);
  }

  private async onConsole(event: IPuppetPageEvents['console']) {
    const { frameId, type, message, location } = event;
    this.sessionState.captureLog(this.id, frameId, type, message, location);
  }

  private onTargetCrashed(event: IPuppetPageEvents['crashed']) {
    const error = event.error;
    this.sessionState.captureError(this.id, this.mainFrameId, `events.error`, error);
  }

  // CREATE

  public static create(
    session: Session,
    puppetPage: IPuppetPage,
    parentTab?: Tab,
    openParams?: { url: string; windowName: string },
  ) {
    const tab = new Tab(session, puppetPage, parentTab?.id, openParams);
    tab.logger.info('Tab.created', {
      parentTab: parentTab?.id,
      openParams,
    });
    return tab;
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
type TabFunctionNames = AllowedNames<Tab, Function>;

interface ITabEventParams {
  close: null;
  'resource-requested': IResourceMeta;
  resource: IResourceMeta;
  'websocket-message': IWebsocketResourceMessage;
  'child-tab-created': Tab;
}
