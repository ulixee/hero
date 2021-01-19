import { v1 as uuidv1 } from 'uuid';
import Log from '@secret-agent/commons/Logger';
import { IBlockedResourceType } from '@secret-agent/core-interfaces/ITabOptions';
import {
  ILocationStatus,
  ILocationTrigger,
  LocationStatus,
} from '@secret-agent/core-interfaces/Location';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import ICommandMeta from '@secret-agent/core-interfaces/ICommandMeta';
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
import IExecJsPathResult from '@secret-agent/core-interfaces/IExecJsPathResult';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import { IPuppetPage, IPuppetPageEvents } from '@secret-agent/puppet-interfaces/IPuppetPage';
import { IPuppetFrameEvents } from '@secret-agent/puppet-interfaces/IPuppetFrame';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import ISetCookieOptions from '@secret-agent/core-interfaces/ISetCookieOptions';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import IWebsocketResourceMessage from '@secret-agent/core-interfaces/IWebsocketResourceMessage';
import IAttachedState from 'awaited-dom/base/IAttachedState';
import IWaitForOptions from '@secret-agent/core-interfaces/IWaitForOptions';
import TabNavigations from './TabNavigations';
import SessionState from './SessionState';
import LocationTracker from './LocationTracker';
import Interactor from './Interactor';
import Session from './Session';
import DomEnv from './DomEnv';
import IResourceFilterProperties from '../interfaces/IResourceFilterProperties';
import DomRecorder from './DomRecorder';

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

  public get navigationTracker(): TabNavigations {
    return this.sessionState.navigationsByTabId[this.id];
  }

  public get url(): string {
    return this.navigationTracker.currentUrl;
  }

  public get sessionState(): SessionState {
    return this.session.sessionState;
  }

  public get lastCommandId(): number | undefined {
    return this.sessionState.lastCommand?.id;
  }

  public get sessionId(): string {
    return this.session.id;
  }

  public get mainFrameId(): string {
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
    this.wrapCommandLoggers([
      this.createRequest,
      this.execJsPath,
      this.fetch,
      this.focus,
      this.goto,
      this.goBack,
      this.goForward,
      this.getCookies,
      this.getJsValue,
      this.getLocationHref,
      this.interact,
      this.isElementVisible,
      this.removeCookie,
      this.setCookie,
      this.waitForMillis,
      this.waitForElement,
      this.waitForLoad,
      this.waitForLocation,
      this.waitForNewTab,
      this.waitForResource,
      // DO NOT ADD waitForReady
    ]);
  }

  public async setBlockedResourceTypes(
    blockedResourceTypes: IBlockedResourceType[],
  ): Promise<void> {
    const mitmSession = this.session.mitmRequestSession;
    const blockedResources = mitmSession.blockedResources.types;
    let enableJs = true;

    if (blockedResourceTypes.includes('None')) {
      blockedResources.length = 0;
    } else if (blockedResourceTypes.includes('All')) {
      blockedResources.push('Image', 'Stylesheet', 'Script', 'Font', 'Ico', 'Media');
      enableJs = false;
    } else if (blockedResourceTypes.includes('BlockAssets')) {
      blockedResources.push('Image', 'Stylesheet', 'Script');
    } else {
      if (blockedResourceTypes.includes('BlockImages')) {
        blockedResources.push('Image');
      }
      if (blockedResourceTypes.includes('BlockCssResources')) {
        blockedResources.push('Stylesheet');
      }
      if (blockedResourceTypes.includes('BlockJsResources')) {
        blockedResources.push('Script');
      }
      if (blockedResourceTypes.includes('JsRuntime')) {
        enableJs = false;
      }
    }
    await this.puppetPage.setJavaScriptEnabled(enableJs);
    mitmSession.blockedResources.urls = [];
  }

  public async close(): Promise<void> {
    if (this.isClosing) return;
    this.isClosing = true;
    this.logger.info('Tab.Closing');

    if (this.navigationTracker.top?.frameId) {
      await this.domRecorder.flush(true);
    }

    try {
      const cancelMessage = 'Terminated command because session closing';
      Timer.expireAll(this.waitTimeouts, new CanceledPromiseError(cancelMessage));
      this.locationTracker.cancelWaiting(cancelMessage);
      this.cancelPendingEvents(cancelMessage);
      await this.puppetPage.close();

      this.emit('close');
    } catch (error) {
      if (!error.message.includes('Target closed')) {
        this.logger.error('Tab.ClosingError', { error });
      }
    }
  }

  public async setOrigin(origin: string): Promise<void> {
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

  public async getResourceProperty<T = string | number | Buffer>(
    resourceid: number,
    propertyPath: string,
  ): Promise<T> {
    let finalResourceId = resourceid;
    // if no resource id, this is a request for the default resource (page)
    if (!resourceid) {
      await this.locationTracker.waitFor('READY');
      finalResourceId = await this.locationTracker.waitForLocationResourceId();
    }

    if (propertyPath === 'data' || propertyPath === 'response.data') {
      return ((await this.sessionState.getResourceData(finalResourceId)) as unknown) as Promise<T>;
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

  public async goto(url: string): Promise<IResourceMeta> {
    const formattedUrl = Url.format(url);

    this.navigationTracker.navigationRequested(
      'goto',
      formattedUrl,
      this.mainFrameId,
      this.lastCommandId,
    );

    await this.puppetPage.navigate(formattedUrl);

    const resource = await this.locationTracker.waitForLocationResourceId();
    return this.sessionState.getResourceMeta(resource);
  }

  public async goBack(): Promise<string> {
    await this.puppetPage.goBack();
    await this.locationTracker.waitFor('AllContentLoaded');
    return this.navigationTracker.currentUrl;
  }

  public async goForward(): Promise<string> {
    await this.puppetPage.goForward();
    await this.locationTracker.waitFor('AllContentLoaded');
    return this.navigationTracker.currentUrl;
  }

  public async interact(...interactionGroups: IInteractionGroups): Promise<void> {
    await this.locationTracker.waitFor('READY');
    await this.interactor.play(interactionGroups);
  }

  public getJsValue<T>(path: string): Promise<{ value: T; type: string }> {
    return this.domEnv.execNonIsolatedExpression<T>(path);
  }

  public async execJsPath<T>(
    jsPath: IJsPath,
    propertiesToExtract?: string[],
  ): Promise<IExecJsPathResult<T>> {
    // if nothing loaded yet, return immediately
    if (!this.navigationTracker.top) return null;
    await this.locationTracker.waitFor('READY');
    return this.domEnv.execJsPath<T>(jsPath, propertiesToExtract);
  }

  public createRequest(input: string | number, init?: IRequestInit): Promise<IAttachedState> {
    return this.domEnv.createFetchRequest(input, init);
  }

  public fetch(input: string | number, init?: IRequestInit): Promise<IAttachedState> {
    return this.domEnv.execFetch(input, init);
  }

  public async getLocationHref(): Promise<string> {
    await this.locationTracker.waitFor('READY');
    return this.domEnv.locationHref();
  }

  public async getCookies(): Promise<ICookie[]> {
    await this.locationTracker.waitFor('READY');
    return await this.session.browserContext.getCookies(
      new URL(this.puppetPage.mainFrame.securityOrigin ?? this.puppetPage.mainFrame.url),
    );
  }

  public async setCookie(
    name: string,
    value: string,
    options?: ISetCookieOptions,
  ): Promise<boolean> {
    await this.locationTracker.waitFor('READY');
    await this.session.browserContext.addCookies([
      {
        name,
        value,
        url: this.puppetPage.mainFrame.url,
        ...options,
      },
    ]);
    return true;
  }

  public async removeCookie(name: string): Promise<boolean> {
    await this.session.browserContext.addCookies([
      {
        name,
        value: '',
        expires: 0,
        url: this.puppetPage.mainFrame.url,
      },
    ]);
    return true;
  }

  public async focus(): Promise<void> {
    await this.puppetPage.bringToFront();
  }

  public async isElementVisible(jsPath: IJsPath): Promise<boolean> {
    const isVisible = await this.domEnv.isJsPathVisible(jsPath);
    return isVisible.value;
  }

  public async waitForNewTab(options: IWaitForOptions = {}): Promise<Tab> {
    // last command is the one running right now
    const startCommandId = options?.sinceCommandId ?? this.lastCommandId - 1;
    let newTab: Tab;
    if (startCommandId >= 0) {
      for (const tab of this.session.tabs) {
        if (tab.parentTabId === this.id && tab.createdAtCommandId >= startCommandId) {
          newTab = tab;
          break;
        }
      }
    }
    if (!newTab) newTab = await this.waitOn('child-tab-created', undefined, options?.timeoutMs);
    await newTab.locationTracker.waitForLocationResourceId();
    return newTab;
  }

  public async waitForResource(
    filter: IResourceFilterProperties,
    opts?: IWaitForResourceOptions,
  ): Promise<IResourceMeta[]> {
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

  public waitForElement(jsPath: IJsPath, options?: IWaitForElementOptions): Promise<boolean> {
    return this.waitForDom(jsPath, options);
  }

  public waitForLoad(status: ILocationStatus, options?: IWaitForOptions): Promise<void> {
    return this.locationTracker.waitFor(status, options);
  }

  public waitForLocation(trigger: ILocationTrigger, options?: IWaitForOptions): Promise<void> {
    return this.locationTracker.waitFor(trigger, options);
  }

  public waitForMillis(millis: number): Promise<void> {
    return new Timer(millis, this.waitTimeouts).waitForTimeout();
  }

  // NOTE: don't add this function to commands. It will record extra commands when called from interactor, which
  // can break waitForLocation
  public async waitForDom(jsPath: IJsPath, options?: IWaitForElementOptions): Promise<boolean> {
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
    return false;
  }

  public moveMouseToStartLocation(): Promise<void> {
    return this.interactor.initialize();
  }

  /////// UTILITIES ////////////////////////////////////////////////////////////////////////////////////////////////////

  public toJSON() {
    return {
      id: this.id,
      parentTabId: this.parentTabId,
      sessionId: this.sessionId,
      url: this.navigationTracker.currentUrl,
      createdAtCommandId: this.createdAtCommandId,
    };
  }

  private async install(): Promise<void> {
    await this.domEnv.install();

    const page = this.puppetPage;
    const newDocumentInjectedScripts = await this.session.browserEmulator.newDocumentInjectedScripts();
    for (const newDocumentScript of newDocumentInjectedScripts) {
      if (newDocumentScript.callbackWindowName) {
        await page.addPageCallback(newDocumentScript.callbackWindowName, payload => {
          newDocumentScript.callback(JSON.parse(payload));
        });
      }
      // overrides happen in main frame
      await page.addNewDocumentScript(newDocumentScript.script, false);
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

    await this.interactor.initialize();
    if (this.session.options?.blockedResourceTypes) {
      await this.setBlockedResourceTypes(this.session.options.blockedResourceTypes);
    }
  }

  private listen(): void {
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

  private onResourceWillBeRequested(event: IPuppetPageEvents['resource-will-be-requested']): void {
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

  private onNavigationResourceResponse(event: IPuppetPageEvents['navigation-response']): void {
    if (event.frameId !== this.mainFrameId) return;

    this.navigationTracker.updatePipelineStatus({
      incomingStatus: LocationStatus.HttpResponded,
      url: event.url,
      frameId: event.frameId,
      lastCommandId: this.lastCommandId,
    });
    this.session.mitmRequestSession.recordDocumentUserActivity(event.url);
  }

  private onWebsocketFrame(event: IPuppetPageEvents['websocket-frame']): void {
    const wsResource = this.sessionState.captureWebsocketMessage(event);
    this.emit('websocket-message', wsResource);
  }

  /////// PAGE EVENTS  /////////////////////////////////////////////////////////////////////////////

  private onFrameLifecycle(event: IPuppetFrameEvents['frame-lifecycle']): void {
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

  private onFrameNavigated(event: IPuppetFrameEvents['frame-navigated']): void {
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
  private onFrameRequestedNavigation(
    event: IPuppetFrameEvents['frame-requested-navigation'],
  ): void {
    this.logger.info('Page.frameRequestedNavigation', event);
    // disposition options: currentTab, newTab, newWindow, download
    const { frame, url, reason } = event;
    if (this.mainFrameId === frame.id) {
      this.navigationTracker.updateNavigationReason(frame.id, url, reason);
    }
  }

  private async onFrameCreated(event: IPuppetFrameEvents['frame-created']): Promise<void> {
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

  private onPageError(event: IPuppetPageEvents['page-error']): void {
    const { error, frameId } = event;
    this.sessionState.captureError(this.id, frameId, `events.page-error`, error);
  }

  private onConsole(event: IPuppetPageEvents['console']): void {
    const { frameId, type, message, location } = event;
    this.sessionState.captureLog(this.id, frameId, type, message, location);
  }

  private onTargetCrashed(event: IPuppetPageEvents['crashed']): void {
    const error = event.error;
    this.sessionState.captureError(this.id, this.mainFrameId, `events.error`, error);
  }

  /////// BIND COMMAND FUNCTIONS /////

  private wrapCommandLoggers<Func extends (...args: any[]) => Promise<any>>(
    functionsToWrap: Func[],
  ) {
    for (const func of functionsToWrap) {
      this[func.name] = (...args) => this.runCommandFn(func, ...args);
    }
  }

  private async runCommandFn<T, Func extends (...args: any[]) => Promise<T>>(
    fn: Func,
    ...args: any[]
  ): Promise<T> {
    const commandHistory = this.sessionState.commands;

    const commandMeta = {
      id: commandHistory.length + 1,
      tabId: this.id,
      frameId: this.mainFrameId,
      name: fn.name,
      args: args.length ? JSON.stringify(args) : undefined,
    } as ICommandMeta;

    this.locationTracker.willRunCommand(commandMeta, commandHistory);
    if (fn.name !== 'goto') {
      await this.domRecorder.setCommandIdForPage(commandMeta.id);
    }
    const id = this.logger.info('Tab.runCommand', commandMeta);
    let result: T;
    try {
      const commandFn = fn.bind(this, ...args);
      result = await this.sessionState.runCommand(commandFn, commandMeta);
    } finally {
      this.logger.stats('Tab.ranCommand', { result, parentLogId: id });
    }
    return result;
  }

  // CREATE

  public static create(
    session: Session,
    puppetPage: IPuppetPage,
    parentTab?: Tab,
    openParams?: { url: string; windowName: string },
  ): Tab {
    const tab = new Tab(session, puppetPage, parentTab?.id, openParams);
    tab.logger.info('Tab.created', {
      parentTab: parentTab?.id,
      openParams,
    });
    return tab;
  }
}

interface ITabEventParams {
  close: null;
  'resource-requested': IResourceMeta;
  resource: IResourceMeta;
  'websocket-message': IWebsocketResourceMessage;
  'child-tab-created': Tab;
}
