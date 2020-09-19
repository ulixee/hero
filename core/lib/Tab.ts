import { v1 as uuidv1 } from 'uuid';
import Log from '@secret-agent/commons/Logger';
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
import { IInteractionGroups, IMousePositionXY } from '@secret-agent/core-interfaces/IInteractions';
import * as Url from 'url';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import Timer from '@secret-agent/commons/Timer';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import { createPromise } from '@secret-agent/commons/utils';
import TimeoutError from '@secret-agent/commons/interfaces/TimeoutError';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import IExecJsPathResult from '@secret-agent/injected-scripts/interfaces/IExecJsPathResult';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { IPuppetPage, IPuppetPageEvents } from '@secret-agent/puppet/interfaces/IPuppetPage';
import { redirectCodes } from '@secret-agent/mitm/handlers/HttpRequestHandler';
import { IPuppetFrameEvents } from '@secret-agent/puppet/interfaces/IPuppetFrame';
import { URL } from 'url';
import LocationTracker from './LocationTracker';
import Interactor from './Interactor';
import Session from './Session';
import DomEnv from './DomEnv';
import IResourceFilterProperties from '../interfaces/IResourceFilterProperties';
import DomRecorder from './DomRecorder';
import IWebsocketResourceMessage from '../interfaces/IWebsocketResourceMessage';

const { log } = Log(module);

export default class Tab extends TypedEventEmitter<ITabEventParams> {
  public readonly id: string = uuidv1();
  public readonly parentTabId?: string;
  public readonly session: Session;
  public readonly locationTracker: LocationTracker;
  public readonly domRecorder: DomRecorder;
  public readonly domEnv: DomEnv;
  public puppetPage: IPuppetPage;
  public isClosing = false;

  private readonly createdAtCommandId: number;

  private readonly interactor: Interactor;
  private waitTimeouts: { timeout: NodeJS.Timeout; reject: (reason?: any) => void }[] = [];

  private get pages() {
    return this.sessionState.pagesByTabId[this.id];
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
    this.session = session;
    this.sessionState.registerTab(this.id, this.parentTabId);
    this.createdAtCommandId = this.sessionState.lastCommand?.id;
    this.puppetPage = puppetPage;
    this.parentTabId = parentTabId;
    this.interactor = new Interactor(this);
    this.locationTracker = new LocationTracker(this.sessionState.pagesByTabId[this.id]);
    this.domEnv = new DomEnv(this, this.puppetPage);
    this.puppetPage.on('pageError', this.onPageError.bind(this));
    this.puppetPage.on('targetCrashed', this.onTargetCrashed.bind(this));
    this.puppetPage.on('consoleLog', this.onConsole.bind(this));
    this.domRecorder = new DomRecorder(
      session.id,
      puppetPage,
      // bind session state to tab id
      this.sessionState.onPageEvents.bind(this.sessionState, this.id),
    );
    if (windowOpenParams) {
      this.pages.navigationRequested(
        'newTab',
        windowOpenParams.url,
        this.mainFrameId,
        this.lastCommandId,
      );
    }
  }

  public async listen() {
    const page = this.puppetPage;

    page.on('frameCreated', ({ frame }) => {
      this.sessionState.captureFrameCreated(this.id, frame.id, frame.parentId);
    });
    page.on('frameNavigated', this.onFrameNavigated.bind(this));
    page.on('frameRequestedNavigation', this.onFrameRequestedNavigation.bind(this));
    page.on('frameLifecycle', this.onFrameLifecycle.bind(this));

    const mitm = this.session.mitmRequestSession;
    page.on('websocketHandshake', ev => mitm.registerWebsocketHeaders(this.id, ev));
    page.on('websocketFrame', this.onWebsocketFrame.bind(this));
    page.on('resourceWillBeRequested', this.onResourceWillBeRequested.bind(this));
    page.on('navigationResponse', this.onNavigationResourceResponse.bind(this));
  }

  public async install() {
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
    if (this.pages.top?.frameId) {
      await this.domRecorder.flush(true);
    }

    log.info('Tab.Closing', {
      tabId: this.id,
      sessionId: this.session.id,
    });
    try {
      Timer.expireAll(this.waitTimeouts, new Error('Terminated command because session closing'));
      await this.puppetPage.close();

      this.emit('close');
    } catch (error) {
      if (!error.message.includes('Target closed')) {
        log.error('Tab.ClosingError', { sessionId: this.sessionId, error });
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

    const previousCommand = commandHistory.length
      ? commandHistory[commandHistory.length - 1]
      : null;

    this.locationTracker.willRunCommand(commandMeta, previousCommand);
    if (functionName !== 'goto') {
      await this.domRecorder.setCommandIdForPage(commandMeta.id);
    }
    const id = log.info('Tab.runCommand', { ...commandMeta, sessionId: this.sessionId });
    let result: T;
    try {
      const commandFn = this[functionName].bind(this, ...args);
      result = await this.sessionState.runCommand<T>(commandFn, commandMeta);
    } finally {
      log.stats('Tab.ranCommand', { sessionId: this.sessionId, result, parentLogId: id });
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

    this.pages.navigationRequested('goto', formattedUrl, this.mainFrameId, this.lastCommandId);

    await this.puppetPage.navigate(formattedUrl);

    return this.locationTracker
      .waitForLocationResourceId()
      .then(x => this.sessionState.getResourceMeta(x));
  }

  public async goBack() {
    await this.puppetPage.goBack();
    await this.locationTracker.waitFor('AllContentLoaded');
    return this.pages.currentUrl;
  }

  public async goForward() {
    await this.puppetPage.goForward();
    await this.locationTracker.waitFor('AllContentLoaded');
    return this.pages.currentUrl;
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
    if (!this.pages.top) return null;
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

    const timer = new Timer(options?.timeoutMs ?? 30e3, this.waitTimeouts);
    await timer.waitForPromise(
      this.locationTracker.waitFor('READY'),
      'Timeout waiting for DomContentLoaded',
    );

    try {
      let isFound = false;
      do {
        const jsonValue = await this.domEnv.isJsPathVisible(jsPath).catch(() => null);
        if (jsonValue) {
          if (waitForVisible) {
            isFound = jsonValue.value;
          } else {
            isFound = jsonValue.attachedState !== null;
          }
        }
        timer.throwIfExpired(`Timeout waiting for element ${jsPath} to be visible`);
        await new Promise(resolve => setTimeout(resolve, 50));
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

  public async scrollJsPathIntoView(jsPath: IJsPath) {
    await this.locationTracker.waitFor(LocationStatus.DomContentLoaded);
    await this.domEnv.scrollJsPathIntoView(jsPath);
  }

  public async scrollCoordinatesIntoView(coordinates: IMousePositionXY) {
    await this.locationTracker.waitFor(LocationStatus.DomContentLoaded);
    await this.domEnv.scrollCoordinatesIntoView(coordinates);
  }

  public async toJSON() {
    return {
      id: this.id,
      parentTabId: this.parentTabId,
      sessionId: this.sessionId,
      url: this.pages.currentUrl,
      createdAtCommandId: this.createdAtCommandId,
    };
  }

  /////// REQUESTS EVENT HANDLERS  /////////////////////////////////////////////////////////////////

  private onResourceWillBeRequested(event: IPuppetPageEvents['resourceWillBeRequested']) {
    const { session, lastCommandId } = this;
    const { url, isDocumentNavigation, frameId } = event;

    session.mitmRequestSession.registerResource({
      ...event,
      tabId: this.id,
      isUserNavigation: this.pages.didGotoUrl(url),
    });

    // only track main frame for now
    if (isDocumentNavigation && frameId === this.mainFrameId) {
      this.pages.update(LocationStatus.HttpRequested, url, frameId, lastCommandId);
    }
  }

  private async onNavigationResourceResponse(event: IPuppetPageEvents['navigationResponse']) {
    if (event.frameId !== this.mainFrameId) return;

    const { location, url, status, frameId } = event;
    const isRedirect = redirectCodes.has(status) && !!location;

    if (isRedirect) {
      this.pages.update(LocationStatus.HttpRedirected, location, frameId, this.lastCommandId);
      return;
    }
    this.pages.update(LocationStatus.HttpResponded, url, frameId, this.lastCommandId);
    this.session.mitmRequestSession.recordDocumentUserActivity(url);
  }

  private onWebsocketFrame(event: IPuppetPageEvents['websocketFrame']) {
    const wsResource = this.sessionState.captureWebsocketMessage(event);
    this.emit('websocket-message', wsResource);
  }

  /////// PAGE EVENTS  /////////////////////////////////////////////////////////////////////////////

  private onFrameLifecycle(event: IPuppetFrameEvents['frameLifecycle']) {
    if (event.frame.id === this.mainFrameId) {
      const eventName = event.name.toLowerCase();
      const status = {
        load: LocationStatus.AllContentLoaded,
        domcontentloaded: LocationStatus.DomContentLoaded,
      }[eventName];

      if (status) {
        this.pages.update(
          status,
          this.puppetPage.mainFrame.url,
          this.mainFrameId,
          this.lastCommandId,
        );
      }
    }
  }

  private async onFrameNavigated(event: IPuppetFrameEvents['frameNavigated']) {
    const { navigatedInDocument, frame } = event;
    if (this.mainFrameId === frame.id && navigatedInDocument) {
      log.info('Page.navigatedWithinDocument', {
        sessionId: this.sessionId,
        ...event,
      });
      // set load state back to all loaded
      this.pages.triggerInPageNavigation(frame.url, this.lastCommandId, frame.id);
    }
  }

  // client-side frame navigations (form posts/gets, redirects/ page reloads)
  private async onFrameRequestedNavigation(event: IPuppetFrameEvents['frameRequestedNavigation']) {
    log.info('Page.frameRequestedNavigation', {
      sessionId: this.sessionId,
      ...event,
    });
    // disposition options: currentTab, newTab, newWindow, download
    const { frame, url, reason } = event;
    if (this.mainFrameId === frame.id) {
      this.pages.updateNavigationReason(frame.id, url, reason);
    }
  }

  /////// LOGGGING EVENTS //////////////////////////////////////////////////////////////////////////

  private onPageError(event: IPuppetPageEvents['pageError']) {
    const { error, frameId } = event;
    this.sessionState.captureError(this.id, frameId, `events.pageerror`, error);
  }

  private async onConsole(event: IPuppetPageEvents['consoleLog']) {
    const { frameId, type, message, location } = event;
    this.sessionState.captureLog(this.id, frameId, type, message, location);
  }

  private onTargetCrashed(event: IPuppetPageEvents['targetCrashed']) {
    const error = event.error;
    this.sessionState.captureError(this.id, this.mainFrameId, `events.error`, error);
  }

  // CREATE

  public static async create(
    session: Session,
    puppetPage: IPuppetPage,
    parentTab?: Tab,
    openParams?: { url: string; windowName: string },
  ) {
    const logid = log.info('Tab.creating', {
      sessionId: session.id,
      parentTab: parentTab?.id,
      openParams,
    });
    const tab = new Tab(session, puppetPage, parentTab?.id, openParams);
    await tab.listen();
    await tab.install();
    if (parentTab) {
      parentTab.emit('child-tab-created', tab);
    }
    log.info('Tab.created', { sessionId: session.id, parentLogId: logid });
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
