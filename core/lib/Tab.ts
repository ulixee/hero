import Log from '@secret-agent/commons/Logger';
import { IBlockedResourceType } from '@secret-agent/core-interfaces/ITabOptions';
import * as Url from 'url';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import Timer from '@secret-agent/commons/Timer';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import { createPromise } from '@secret-agent/commons/utils';
import TimeoutError from '@secret-agent/commons/interfaces/TimeoutError';
import { IPuppetPage, IPuppetPageEvents } from '@secret-agent/puppet-interfaces/IPuppetPage';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import IWebsocketResourceMessage from '@secret-agent/core-interfaces/IWebsocketResourceMessage';
import IWaitForOptions from '@secret-agent/core-interfaces/IWaitForOptions';
import IScreenshotOptions from '@secret-agent/core-interfaces/IScreenshotOptions';
import MitmRequestContext from '@secret-agent/mitm/lib/MitmRequestContext';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { IInteractionGroups } from '@secret-agent/core-interfaces/IInteractions';
import IExecJsPathResult from '@secret-agent/core-interfaces/IExecJsPathResult';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import { ILocationTrigger, IPipelineStatus } from '@secret-agent/core-interfaces/Location';
import IFrameMeta from '@secret-agent/core-interfaces/IFrameMeta';
import { INodeData } from '@secret-agent/core-interfaces/IDomChangeEvent';
import FrameNavigations from './FrameNavigations';
import CommandRecorder from './CommandRecorder';
import FrameEnvironment from './FrameEnvironment';
import IResourceFilterProperties from '../interfaces/IResourceFilterProperties';
import InjectedScripts from './InjectedScripts';
import Session from './Session';
import SessionState from './SessionState';
import FrameNavigationsObserver from './FrameNavigationsObserver';
import { PageRecorderResultSet } from '../injected-scripts/pageEventsRecorder';
import { IDomChangeRecord } from '../models/DomChangesTable';

const { log } = Log(module);

export default class Tab extends TypedEventEmitter<ITabEventParams> {
  public readonly id: number;
  public readonly parentTabId?: number;
  public readonly session: Session;
  public readonly frameEnvironmentsById = new Map<string, FrameEnvironment>();
  public puppetPage: IPuppetPage;
  public isClosing = false;
  public isReady: Promise<void>;

  protected readonly logger: IBoundLog;

  private readonly commandRecorder: CommandRecorder;
  private readonly createdAtCommandId: number;
  private waitTimeouts: { timeout: NodeJS.Timeout; reject: (reason?: any) => void }[] = [];

  public get navigations(): FrameNavigations {
    return this.mainFrameEnvironment.navigations;
  }

  public get navigationsObserver(): FrameNavigationsObserver {
    return this.mainFrameEnvironment.navigationsObserver;
  }

  public get url(): string {
    return this.navigations.currentUrl;
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

  public get mainFrameEnvironment(): FrameEnvironment {
    return this.frameEnvironmentsById.get(this.mainFrameId);
  }

  private constructor(
    session: Session,
    puppetPage: IPuppetPage,
    parentTabId?: number,
    windowOpenParams?: { url: string; windowName: string; loaderId: string },
  ) {
    super();
    this.setEventsToLog(['child-tab-created', 'close']);
    this.id = session.nextTabId();
    this.logger = log.createChild(module, {
      tabId: this.id,
      sessionId: session.id,
    });
    this.session = session;
    this.parentTabId = parentTabId;
    this.createdAtCommandId = session.sessionState.lastCommand?.id;
    this.puppetPage = puppetPage;

    for (const puppetFrame of puppetPage.frames) {
      const frame = new FrameEnvironment(this, puppetFrame);
      this.frameEnvironmentsById.set(frame.id, frame);
    }

    if (windowOpenParams) {
      this.navigations.onNavigationRequested(
        'newTab',
        windowOpenParams.url,
        this.lastCommandId,
        windowOpenParams.loaderId,
      );
    }
    this.listen();
    this.isReady = this.install();
    this.commandRecorder = new CommandRecorder(this, this, this.mainFrameId, [
      this.focus,
      this.getFrameEnvironments,
      this.goto,
      this.goBack,
      this.goForward,
      this.reload,
      this.takeScreenshot,
      this.waitForMillis,
      this.waitForNewTab,
      this.waitForResource,
      // DO NOT ADD waitForReady
    ]);
  }

  public isAllowedCommand(method: string): boolean {
    return (
      this.commandRecorder.fnNames.has(method) ||
      method === 'close' ||
      method === 'getResourceProperty'
    );
  }

  public checkForResolvedNavigation(
    browserRequestId: string,
    resource: IResourceMeta,
    error?: Error,
  ) {
    if (resource.request.method !== 'GET') return;

    for (const frame of this.frameEnvironmentsById.values()) {
      if (!frame.isAttached) continue;

      const top = frame.navigations.top;
      if (!top || top.resourceId.isResolved) continue;

      if (
        resource.response?.url === top.finalUrl ||
        resource.request.url === top.requestedUrl ||
        browserRequestId === top.browserRequestId
      ) {
        frame.navigations.onResourceLoaded(resource.id, resource.response?.statusCode, error);
        break;
      }
    }
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
    const parentLogId = this.logger.stats('Tab.Closing');
    const errors: Error[] = [];

    try {
      if (this.navigations.top && this.puppetPage.mainFrame.isLoaded) {
        await this.flushPageEventsRecorder();
      }
    } catch (error) {
      // don't re-handle
      errors.push(error);
    }

    try {
      const cancelMessage = 'Terminated command because session closing';
      Timer.expireAll(this.waitTimeouts, new CanceledPromiseError(cancelMessage));
      for (const frame of this.frameEnvironmentsById.values()) {
        frame.close();
      }
      this.cancelPendingEvents(cancelMessage);
    } catch (error) {
      if (!error.message.includes('Target closed') && !(error instanceof CanceledPromiseError)) {
        errors.push(error);
      }
    }

    try {
      // run this one individually
      await this.puppetPage.close();
    } catch (error) {
      if (!error.message.includes('Target closed') && !(error instanceof CanceledPromiseError)) {
        errors.push(error);
      }
    }
    this.emit('close');
    this.logger.stats('Tab.Closed', { parentLogId, errors });
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
    resourceId: number,
    propertyPath: string,
  ): Promise<T> {
    let finalResourceId = resourceId;
    // if no resource id, this is a request for the default resource (page)
    if (!resourceId) {
      await this.navigationsObserver.waitForReady();
      finalResourceId = await this.navigationsObserver.waitForNavigationResourceId();
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

  /////// DELEGATED FNS ////////////////////////////////////////////////////////////////////////////////////////////////

  public interact(...interactionGroups: IInteractionGroups): Promise<void> {
    return this.mainFrameEnvironment.interact(...interactionGroups);
  }

  public getJsValue<T>(path: string): Promise<{ value: T; type: string }> {
    return this.mainFrameEnvironment.getJsValue(path);
  }

  public execJsPath<T>(
    jsPath: IJsPath,
    propertiesToExtract?: string[],
  ): Promise<IExecJsPathResult<T>> {
    return this.mainFrameEnvironment.execJsPath<T>(jsPath, propertiesToExtract);
  }

  public getLocationHref(): Promise<string> {
    return this.mainFrameEnvironment.getLocationHref();
  }

  public isElementVisible(jsPath: IJsPath): Promise<boolean> {
    return this.mainFrameEnvironment.isElementVisible(jsPath);
  }

  public waitForElement(jsPath: IJsPath, options?: IWaitForElementOptions): Promise<boolean> {
    return this.mainFrameEnvironment.waitForElement(jsPath, options);
  }

  public waitForLoad(status: IPipelineStatus, options?: IWaitForOptions): Promise<void> {
    return this.mainFrameEnvironment.waitForLoad(status, options);
  }

  public waitForLocation(trigger: ILocationTrigger, options?: IWaitForOptions): Promise<void> {
    return this.mainFrameEnvironment.waitForLocation(trigger, options);
  }

  /////// COMMANDS /////////////////////////////////////////////////////////////////////////////////////////////////////

  public getFrameEnvironments(): Promise<IFrameMeta[]> {
    return Promise.resolve(
      [...this.frameEnvironmentsById.values()].filter(x => x.isAttached).map(x => x.toJSON()),
    );
  }

  public async goto(url: string, timeoutMs = 30e3): Promise<IResourceMeta> {
    const formattedUrl = Url.format(url);

    const navigation = this.navigations.onNavigationRequested(
      'goto',
      formattedUrl,
      this.lastCommandId,
      null,
    );

    const timeoutMessage = `Timeout waiting for "tab.goto(${url})"`;

    const timer = new Timer(timeoutMs, this.waitTimeouts);
    await timer.waitForPromise(this.puppetPage.navigate(formattedUrl), timeoutMessage);
    this.navigations.assignLoaderId(navigation, this.puppetPage.mainFrame.activeLoaderId);

    const resource = await timer.waitForPromise(
      this.navigationsObserver.waitForNavigationResourceId(),
      timeoutMessage,
    );
    return this.sessionState.getResourceMeta(resource);
  }

  public async goBack(timeoutMs?: number): Promise<string> {
    await this.puppetPage.goBack();
    await this.navigationsObserver.waitForLoad('PaintingStable', { timeoutMs });
    return this.url;
  }

  public async goForward(timeoutMs?: number): Promise<string> {
    await this.puppetPage.goForward();
    await this.navigationsObserver.waitForLoad('PaintingStable', { timeoutMs });
    return this.url;
  }

  public async reload(timeoutMs?: number): Promise<IResourceMeta> {
    const navigation = this.navigations.onNavigationRequested(
      'reload',
      this.url,
      this.lastCommandId,
      null,
    );

    const timer = new Timer(timeoutMs, this.waitTimeouts);
    const timeoutMessage = `Timeout waiting for "tab.reload()"`;

    await timer.waitForPromise(this.puppetPage.reload(), timeoutMessage);
    this.navigations.assignLoaderId(navigation, this.puppetPage.mainFrame.activeLoaderId);

    const resource = await timer.waitForPromise(
      this.navigationsObserver.waitForNavigationResourceId(),
      timeoutMessage,
    );
    return this.sessionState.getResourceMeta(resource);
  }

  public async focus(): Promise<void> {
    await this.puppetPage.bringToFront();
  }

  public takeScreenshot(options: IScreenshotOptions = {}): Promise<Buffer> {
    return this.puppetPage.screenshot(options.format, options.rectangle, options.jpegQuality);
  }

  public async waitForNewTab(options: IWaitForOptions = {}): Promise<Tab> {
    // last command is the one running right now
    const startCommandId = options?.sinceCommandId ?? this.lastCommandId - 1;
    let newTab: Tab;
    const startTime = new Date();
    if (startCommandId >= 0) {
      for (const tab of this.session.tabs) {
        if (tab.parentTabId === this.id && tab.createdAtCommandId >= startCommandId) {
          newTab = tab;
          break;
        }
      }
    }
    if (!newTab) newTab = await this.waitOn('child-tab-created', undefined, options?.timeoutMs);

    // wait for a real url to be requested
    if (newTab.url === 'about:blank' || !newTab.url) {
      let timeoutMs = options?.timeoutMs ?? 10e3;
      const millis = new Date().getTime() - startTime.getTime();
      timeoutMs -= millis;
      await newTab.navigations.waitOn('navigation-requested', null, timeoutMs).catch(() => null);
    }

    await newTab.mainFrameEnvironment.navigationsObserver.waitForNavigationResourceId();
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

  public waitForMillis(millis: number): Promise<void> {
    return new Timer(millis, this.waitTimeouts).waitForTimeout();
  }

  public async getMainFrameDomChanges(
    sinceCommandId?: number,
  ): Promise<
    (Omit<IDomChangeRecord, 'attributes' | 'attributeNamespaces' | 'properties'> & INodeData)[]
  > {
    await this.flushPageEventsRecorder();
    this.sessionState.db.flush();

    return this.sessionState.db.domChanges
      .getFrameChanges(this.mainFrameId)
      .filter(x => {
        if (sinceCommandId) {
          return x.commandId > sinceCommandId;
        }
        return true;
      })
      .map(record => {
        return {
          ...record,
          id: record.nodeId,
          attributes: record.attributes ? JSON.parse(record.attributes) : undefined,
          attributeNamespaces: record.attributeNamespaces
            ? JSON.parse(record.attributeNamespaces)
            : undefined,
          properties: record.properties ? JSON.parse(record.properties) : undefined,
        };
      });
  }

  /////// UTILITIES ////////////////////////////////////////////////////////////////////////////////////////////////////

  public toJSON() {
    return {
      id: this.id,
      parentTabId: this.parentTabId,
      sessionId: this.sessionId,
      url: this.url,
      createdAtCommandId: this.createdAtCommandId,
    };
  }

  private async install(): Promise<void> {
    const page = this.puppetPage;

    await InjectedScripts.install(page, this.onPageRecorderEvents.bind(this));

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

    await this.mainFrameEnvironment.isReady;
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
    page.on('resource-was-requested', this.onResourceWasRequested.bind(this), true);
    page.on('resource-loaded', this.onResourceLoaded.bind(this), true);
    page.on('resource-failed', this.onResourceFailed.bind(this), true);
    page.on('navigation-response', this.onNavigationResourceResponse.bind(this), true);

    // websockets
    page.on('websocket-handshake', ev => {
      this.session.mitmRequestSession?.registerWebsocketHeaders(this.id, ev);
    });
    page.on('websocket-frame', this.onWebsocketFrame.bind(this));
  }

  private async flushPageEventsRecorder(): Promise<void> {
    await Promise.all(
      this.puppetPage.frames.map(async frame => {
        try {
          // don't wait for env to be available
          if (!frame.canEvaluate(true)) return;

          const results = await frame.evaluate<PageRecorderResultSet>(
            `window.flushPageRecorder()`,
            true,
          );
          await this.onPageRecorderEvents(results, frame.id);
        } catch (error) {
          // no op if it fails
        }
      }),
    );
  }

  private onPageRecorderEvents(results: PageRecorderResultSet, frameId: string) {
    if (!frameId) {
      log.warn('DomRecorder.bindingCalledBeforeExecutionTracked', {
        sessionId: this.sessionId,
        payload: results,
      });
      return;
    }
    const [domChanges, mouseEvents, focusEvents, scrollEvents, loadEvents] = results;
    this.logger.stats('Tab.onPageEvents', {
      tabId: this.id,
      frameId,
      dom: domChanges.length,
      mouse: mouseEvents.length,
      focusEvents: focusEvents.length,
      scrollEvents: scrollEvents.length,
      loadEvents,
    });

    const frame = this.frameEnvironmentsById.get(frameId);

    frame.onDomRecorderLoadEvents(loadEvents);

    this.sessionState.captureDomEvents(
      this.id,
      frameId,
      domChanges,
      mouseEvents,
      focusEvents,
      scrollEvents,
    );
  }

  /////// REQUESTS EVENT HANDLERS  /////////////////////////////////////////////////////////////////

  private onResourceWillBeRequested(event: IPuppetPageEvents['resource-will-be-requested']): void {
    const { session, lastCommandId } = this;
    const { resource, isDocumentNavigation, frameId, redirectedFromUrl } = event;
    const { browserRequestId } = resource;
    const url = resource.url.href;

    const navigations = this.frameEnvironmentsById.get(frameId)?.navigations ?? this.navigations;

    if (isDocumentNavigation && !navigations.top) {
      navigations.onNavigationRequested(
        'newTab',
        url,
        lastCommandId,
        browserRequestId,
        event.loaderId,
      );
    }
    resource.hasUserGesture ||= navigations.didGotoUrl(url);

    session.mitmRequestSession.browserRequestMatcher.onBrowserRequestedResource(resource, this.id);

    if (isDocumentNavigation && !event.resource.browserCanceled) {
      navigations.onHttpRequested(
        url,
        lastCommandId,
        redirectedFromUrl,
        browserRequestId,
        event.loaderId,
      );
    }
  }

  private onResourceWasRequested(event: IPuppetPageEvents['resource-was-requested']): void {
    this.session.mitmRequestSession.browserRequestMatcher.onBrowserRequestedResourceExtraDetails(
      event.resource,
      this.id,
    );
  }

  private onResourceLoaded(event: IPuppetPageEvents['resource-loaded']): void {
    this.session.mitmRequestSession.browserRequestMatcher.onBrowserRequestedResourceExtraDetails(
      event.resource,
      this.id,
    );
    const frame = this.frameEnvironmentsById.get(event.frameId) ?? this.mainFrameEnvironment;
    if (
      !!event.resource.browserServedFromCache &&
      event.resource.url?.href === frame.navigations?.top?.requestedUrl &&
      frame.navigations?.top?.resourceId?.isResolved === false
    ) {
      frame.navigations.onHttpResponded(
        event.resource.browserRequestId,
        event.resource.responseUrl ?? event.resource.url?.href,
        event.loaderId,
      );
    }

    const resourcesWithBrowserRequestId = this.sessionState.getBrowserRequestResources(
      event.resource.browserRequestId,
    );

    // if we get a cached response, it might never hit mitm, so record now
    if (event.resource.browserServedFromCache && !resourcesWithBrowserRequestId?.length) {
      const ctx = MitmRequestContext.createFromLoadedResource(event.resource);
      const resource = this.sessionState.captureResource(
        this.id,
        MitmRequestContext.toEmittedResource(ctx),
        true,
      );
      this.checkForResolvedNavigation(event.resource.browserRequestId, resource);
    }
  }

  private onResourceFailed(event: IPuppetPageEvents['resource-failed']): void {
    const { resource } = event;

    let loadError: Error;
    if (resource.browserLoadFailure) {
      loadError = new Error(resource.browserLoadFailure);
    } else if (resource.browserBlockedReason) {
      loadError = new Error(`Resource blocked: "${resource.browserBlockedReason}"`);
    } else if (resource.browserCanceled) {
      loadError = new Error('Load canceled');
    } else {
      loadError = new Error(
        'Resource failed to load, but the reason was not provided by devtools.',
      );
    }

    const browserRequestId = event.resource.browserRequestId;

    let resourceId = this.session.mitmRequestSession.browserRequestMatcher.onBrowserRequestFailed({
      resource,
      tabId: this.id,
      loadError,
    });

    if (!resourceId) {
      const resources = this.sessionState.getBrowserRequestResources(browserRequestId);
      if (resources?.length) {
        resourceId = resources[resources.length - 1].resourceId;
      }
    }

    // this function will resolve any pending resourceId for a navigation
    const resourceMeta = this.sessionState.captureResourceFailed(
      this.id,
      MitmRequestContext.toEmittedResource({ id: resourceId, ...resource } as any),
      loadError,
    );

    this.checkForResolvedNavigation(browserRequestId, resourceMeta, loadError);
  }

  private onNavigationResourceResponse(event: IPuppetPageEvents['navigation-response']): void {
    const frame = this.frameEnvironmentsById.get(event.frameId) ?? this.mainFrameEnvironment;

    frame.navigations.onHttpResponded(event.browserRequestId, event.url, event.loaderId);
    this.session.mitmRequestSession.recordDocumentUserActivity(event.url);
  }

  private onWebsocketFrame(event: IPuppetPageEvents['websocket-frame']): void {
    const wsResource = this.sessionState.captureWebsocketMessage(event);
    this.emit('websocket-message', wsResource);
  }

  private onFrameCreated(event: IPuppetPageEvents['frame-created']): void {
    if (this.frameEnvironmentsById.has(event.frame.id)) return;
    const frame = new FrameEnvironment(this, event.frame);
    this.frameEnvironmentsById.set(frame.id, frame);
  }

  /////// LOGGING EVENTS ///////////////////////////////////////////////////////////////////////////

  private onPageError(event: IPuppetPageEvents['page-error']): void {
    const { error, frameId } = event;
    this.logger.info('Window.pageError', { error, frameId });
    this.sessionState.captureError(this.id, frameId, `events.page-error`, error);
  }

  private onConsole(event: IPuppetPageEvents['console']): void {
    const { frameId, type, message, location } = event;
    this.sessionState.captureLog(this.id, frameId, type, message, location);
  }

  private onTargetCrashed(event: IPuppetPageEvents['crashed']): void {
    const error = event.error;

    const errorLevel = event.fatal ? 'error' : 'info';
    this.logger[errorLevel]('BrowserEngine.Tab.crashed', { error });

    this.sessionState.captureError(this.id, this.mainFrameId, `events.error`, error);
  }

  // CREATE

  public static create(
    session: Session,
    puppetPage: IPuppetPage,
    parentTab?: Tab,
    openParams?: { url: string; windowName: string; loaderId: string },
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
