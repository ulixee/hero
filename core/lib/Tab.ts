import Log from '@ulixee/commons/lib/Logger';
import { IBlockedResourceType } from '@ulixee/hero-interfaces/ITabOptions';
import * as Url from 'url';
import IWaitForResourceOptions from '@ulixee/hero-interfaces/IWaitForResourceOptions';
import Timer from '@ulixee/commons/lib/Timer';
import IResourceMeta from '@ulixee/hero-interfaces/IResourceMeta';
import { createPromise } from '@ulixee/commons/lib/utils';
import TimeoutError from '@ulixee/commons/interfaces/TimeoutError';
import { IPuppetPage, IPuppetPageEvents } from '@ulixee/hero-interfaces/IPuppetPage';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IWebsocketResourceMessage from '@ulixee/hero-interfaces/IWebsocketResourceMessage';
import IWaitForOptions from '@ulixee/hero-interfaces/IWaitForOptions';
import IScreenshotOptions from '@ulixee/hero-interfaces/IScreenshotOptions';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { IInteractionGroups, InteractionCommand } from '@ulixee/hero-interfaces/IInteractions';
import IExecJsPathResult from '@ulixee/hero-interfaces/IExecJsPathResult';
import { ILoadStatus, ILocationTrigger, LoadStatus } from '@ulixee/hero-interfaces/Location';
import IFrameMeta from '@ulixee/hero-interfaces/IFrameMeta';
import IPuppetDialog from '@ulixee/hero-interfaces/IPuppetDialog';
import IFileChooserPrompt from '@ulixee/hero-interfaces/IFileChooserPrompt';
import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import INavigation from '@ulixee/hero-interfaces/INavigation';
import injectedSourceUrl from '@ulixee/hero-interfaces/injectedSourceUrl';
import IResourceFilterProperties from '@ulixee/hero-interfaces/IResourceFilterProperties';
import IDomStateListenArgs from '@ulixee/hero-interfaces/IDomStateListenArgs';
import FrameNavigations from './FrameNavigations';
import CommandRecorder from './CommandRecorder';
import FrameEnvironment from './FrameEnvironment';
import InjectedScripts from './InjectedScripts';
import Session from './Session';
import FrameNavigationsObserver from './FrameNavigationsObserver';
import { IDomChangeRecord } from '../models/DomChangesTable';
import { ICommandableTarget } from './CommandRunner';
import Resources from './Resources';
import DomStateListener from './DomStateListener';
import ICollectedElement from '@ulixee/hero-interfaces/ICollectedElement';
import ScreenshotsTable from '../models/ScreenshotsTable';
import { IStorageChangesEntry } from '../models/StorageChangesTable';
import { IRemoteEmitFn, IRemoteEventListener } from '../interfaces/IRemoteEventListener';
import GlobalPool, { disableMitm } from './GlobalPool';
import IWebsocketMessage from '@ulixee/hero-interfaces/IWebsocketMessage';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import MirrorPage from '@ulixee/hero-timetravel/lib/MirrorPage';
import MirrorNetwork from '@ulixee/hero-timetravel/lib/MirrorNetwork';
import { IMouseEventRecord } from '../models/MouseEventsTable';
import { IScrollRecord } from '../models/ScrollEventsTable';
import { IFocusRecord } from '../models/FocusEventsTable';
import IResourceSummary from '@ulixee/hero-interfaces/IResourceSummary';
import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';
import ICollectedResource from '@ulixee/hero-interfaces/ICollectedResource';

const { log } = Log(module);

export default class Tab
  extends TypedEventEmitter<ITabEventParams>
  implements ISessionMeta, ICommandableTarget, IRemoteEventListener
{
  public readonly id: number;
  public readonly parentTabId?: number;
  public readonly session: Session;
  public readonly frameEnvironmentsById = new Map<number, FrameEnvironment>();
  public readonly frameEnvironmentsByPuppetId = new Map<string, FrameEnvironment>();
  public puppetPage: IPuppetPage;
  public isClosing = false;
  public isReady: Promise<void>;
  public readonly mirrorPage: MirrorPage;

  protected readonly logger: IBoundLog;
  private readonly mirrorNetwork: MirrorNetwork;

  private collectedElementsPendingHTML = new Set<Resolvable<ICollectedElement>>();

  private events = new EventSubscriber();
  private commandRecorder: CommandRecorder;
  private readonly createdAtCommandId: number;
  private waitTimeouts: { timeout: NodeJS.Timeout; reject: (reason?: any) => void }[] = [];
  private lastFileChooserEvent: {
    event: IPuppetPageEvents['filechooser'];
    atCommandId: number;
  };

  private readonly domStateListenersByJsPathId: {
    [domStateJsPathId: string]: DomStateListener;
  } = {};

  private onFrameCreatedResourceEventsByFrameId: {
    [frameId: string]: {
      type: keyof IPuppetPageEvents;
      event: IPuppetPageEvents[keyof IPuppetPageEvents];
    }[];
  } = {};

  public get navigations(): FrameNavigations {
    return this.mainFrameEnvironment.navigations;
  }

  public get navigationsObserver(): FrameNavigationsObserver {
    return this.mainFrameEnvironment.navigationsObserver;
  }

  public get url(): string {
    return this.navigations.currentUrl;
  }

  public get lastCommandId(): number | undefined {
    return this.session.commands.lastId;
  }

  // need to implement ISessionMeta for serialization
  public get tabId(): number {
    return this.id;
  }

  public get sessionId(): string {
    return this.session.id;
  }

  public get mainFrameId(): number {
    return this.mainFrameEnvironment.id;
  }

  public get mainFrameEnvironment(): FrameEnvironment {
    return this.frameEnvironmentsByPuppetId.get(this.puppetPage.mainFrame.id);
  }

  private constructor(
    session: Session,
    puppetPage: IPuppetPage,
    parentTabId?: number,
    windowOpenParams?: { url: string; windowName: string; loaderId: string },
  ) {
    super();
    this.setEventsToLog(['child-tab-created', 'close', 'dialog', 'websocket-message']);
    this.id = session.db.tabs.nextId;
    this.logger = log.createChild(module, {
      tabId: this.id,
      sessionId: session.id,
    });
    this.session = session;
    this.parentTabId = parentTabId;
    this.createdAtCommandId = session.commands.lastId;
    this.puppetPage = puppetPage;

    for (const puppetFrame of puppetPage.frames) {
      const frame = new FrameEnvironment(this, puppetFrame);
      this.frameEnvironmentsByPuppetId.set(frame.devtoolsFrameId, frame);
      this.frameEnvironmentsById.set(frame.id, frame);
    }

    if (windowOpenParams) {
      this.navigations.onNavigationRequested(
        'newFrame',
        windowOpenParams.url,
        this.lastCommandId,
        windowOpenParams.loaderId,
      );
    }

    this.mirrorNetwork = new MirrorNetwork({
      ignoreJavascriptRequests: true,
      headersFilter: ['set-cookie'],
      loadResourceDetails: MirrorNetwork.loadResourceFromDb.bind(MirrorNetwork, this.session.db),
    });
    this.mirrorPage = this.createMirrorPage();

    this.listen();
    this.isReady = this.waitForReady();
    this.commandRecorder = new CommandRecorder(this, this.session, this.id, this.mainFrameId, [
      this.focus,
      this.dismissDialog,
      this.findResource,
      this.findResources,
      this.getFrameEnvironments,
      this.goto,
      this.goBack,
      this.goForward,
      this.reload,
      this.assert,
      this.takeScreenshot,
      this.collectResource,
      this.registerFlowHandler,
      this.registerFlowCommand,
      this.waitForFileChooser,
      this.waitForMillis,
      this.waitForNewTab,
      this.waitForResources,
      this.runPluginCommand,
      this.addRemoteEventListener,
      this.removeRemoteEventListener,
      // DO NOT ADD waitForReady
    ]);
  }

  public createMirrorPage(): MirrorPage {
    const mirrorPage = new MirrorPage(this.mirrorNetwork, {
      paintEvents: [],
      mainFrameIds: new Set([this.mainFrameId]),
      documents: [],
      domNodePathByFrameId: this.session.db.frames.frameDomNodePathsById,
    });
    mirrorPage.subscribe(this);
    return mirrorPage;
  }

  public getFrameEnvironment(frameId?: number): FrameEnvironment {
    return frameId ? this.frameEnvironmentsById.get(frameId) : this.mainFrameEnvironment;
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
  ): boolean {
    if (resource.type !== 'Document') return;

    const frame = this.frameWithPendingNavigation(
      browserRequestId,
      resource.request?.url,
      resource.response?.url,
    );
    if (frame && !resource.isRedirect) {
      frame.navigations.onResourceLoaded(resource.id, resource.response?.statusCode, error);
      return true;
    }
    return false;
  }

  public frameWithPendingNavigation(
    browserRequestId: string,
    requestedUrl: string,
    finalUrl: string,
  ): FrameEnvironment | null {
    for (const frame of this.frameEnvironmentsById.values()) {
      const isMatch = frame.navigations.doesMatchPending(browserRequestId, requestedUrl, finalUrl);
      if (isMatch) return frame;
    }
  }

  public async setBlockedResourceTypes(
    blockedResourceTypes: IBlockedResourceType[],
    blockedUrls?: string[],
  ): Promise<void> {
    const mitmSession = this.session.mitmRequestSession;

    let interceptor = mitmSession.interceptorHandlers.find(x => x.types && !x.handlerFn);
    if (!interceptor) {
      mitmSession.interceptorHandlers.push({ types: [] });
      interceptor = mitmSession.interceptorHandlers[mitmSession.interceptorHandlers.length - 1];
    }
    let enableJs = true;

    if (blockedResourceTypes.includes('None')) {
      interceptor.types.length = 0;
    } else if (blockedResourceTypes.includes('All')) {
      interceptor.types.push('Image', 'Stylesheet', 'Script', 'Font', 'Ico', 'Media');
      enableJs = false;
    } else if (blockedResourceTypes.includes('BlockAssets')) {
      interceptor.types.push('Image', 'Stylesheet', 'Script');
    } else {
      if (blockedResourceTypes.includes('BlockImages')) {
        interceptor.types.push('Image');
      }
      if (blockedResourceTypes.includes('BlockCssResources')) {
        interceptor.types.push('Stylesheet');
      }
      if (blockedResourceTypes.includes('BlockJsResources')) {
        interceptor.types.push('Script');
      }
      if (blockedResourceTypes.includes('JsRuntime')) {
        enableJs = false;
      }
    }
    await this.puppetPage.setJavaScriptEnabled(enableJs);
    interceptor.urls = blockedUrls;
  }

  public async close(): Promise<void> {
    if (this.isClosing) return;
    this.isClosing = true;
    const parentLogId = this.logger.stats('Tab.Closing');
    const errors: Error[] = [];

    await this.pendingCollects();
    try {
      this.mirrorNetwork?.close();
      await this.mirrorPage?.close();
    } catch (error) {
      if (!error.message.includes('Target closed') && !(error instanceof CanceledPromiseError)) {
        errors.push(error);
      }
    }

    try {
      await this.puppetPage.domStorageTracker.finalFlush(5e3);
    } catch (error) {
      if (!error.message.includes('Target closed') && !(error instanceof CanceledPromiseError)) {
        errors.push(error);
      }
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
      this.puppetPage.off('close', this.close);
      // run this one individually
      await this.puppetPage.close();
    } catch (error) {
      if (!error.message.includes('Target closed') && !(error instanceof CanceledPromiseError)) {
        errors.push(error);
      }
    }
    this.events.close();
    this.commandRecorder = null;
    this.emit('close');
    // clean up listener memory
    this.removeAllListeners();

    this.logger.stats('Tab.Closed', { parentLogId, errors });
  }

  public async setOrigin(origin: string): Promise<void> {
    const mitmSession = this.session.mitmRequestSession;
    const originalBlocker = mitmSession.interceptorHandlers;
    mitmSession.interceptorHandlers.unshift({
      urls: [origin],
      handlerFn(url, type, request, response) {
        response.end(`<html lang="en"><body>Empty</body></html>`);
        return true;
      },
    });
    try {
      await this.puppetPage.navigate(origin);
    } finally {
      // restore originals
      mitmSession.interceptorHandlers = originalBlocker;
    }
  }

  public async collectResource(name: string, resourceId: number, timestamp: number): Promise<void> {
    const resource = this.session.resources.get(resourceId);
    if (!resource) throw new Error('Unknown resource collected');
    this.session.db.collectedResources.insert(
      this.id,
      resourceId,
      name,
      timestamp,
      this.session.commands.lastId,
    );

    const collectedResource: ICollectedResource = {
      name,
      commandId: this.session.commands.lastId,
      timestamp,
      resource: resource as any,
      websocketMessages: [],
    };

    resource.response.buffer = await this.session.db.resources.getResourceBodyById(
      resourceId,
      true,
    );

    if (resource.type === 'Websocket') {
      collectedResource.websocketMessages = this.session.websocketMessages.getMessages(resourceId);
    }
    this.session.emit('collected-asset', { type: 'resource', asset: collectedResource });
  }

  public async getResourceProperty(
    resourceId: number,
    propertyPath: 'response.buffer' | 'messages' | 'request.postData',
  ): Promise<Buffer | IWebsocketMessage[]> {
    if (propertyPath === 'response.buffer') {
      return await this.session.db.resources.getResourceBodyById(resourceId, true);
    } else if (propertyPath === 'request.postData') {
      return this.session.db.resources.getResourcePostDataById(resourceId);
    } else if (propertyPath === 'messages') {
      return this.session.websocketMessages.getMessages(resourceId);
    }
  }

  public findResource(
    filter: IResourceFilterProperties,
    options?: { sinceCommandId: number },
  ): Promise<IResourceMeta> {
    // escape query string ? so it can run as regex
    if (typeof filter.url === 'string') {
      filter.url = stringToRegex(filter.url);
    }
    const sinceCommandId =
      options?.sinceCommandId ?? this.navigations.lastHttpNavigationRequest?.startCommandId;
    // find latest resource
    for (const resourceMeta of this.session.resources.getForTab(this.id).reverse()) {
      if (this.isResourceFilterMatch(resourceMeta, filter, sinceCommandId)) {
        return Promise.resolve(resourceMeta);
      }
    }
    return Promise.resolve(null);
  }

  public findResources(
    filter: IResourceFilterProperties,
    options?: { sinceCommandId: number },
  ): Promise<IResourceMeta[]> {
    // escape query string ? so it can run as regex
    if (typeof filter.url === 'string') {
      filter.url = stringToRegex(filter.url);
    }
    const sinceCommandId =
      options?.sinceCommandId ?? this.navigations.lastHttpNavigationRequest?.startCommandId;
    // find all resources
    const resourceMetas = this.session.resources.getForTab(this.id).filter(meta => {
      return this.isResourceFilterMatch(meta, filter, sinceCommandId);
    });
    return Promise.resolve(resourceMetas);
  }

  public findStorageChange(
    filter: Omit<IStorageChangesEntry, 'tabId' | 'timestamp' | 'value' | 'meta'>,
  ): IStorageChangesEntry {
    return this.session.db.storageChanges.findChange(this.id, filter);
  }

  /////// DELEGATED FNS ////////////////////////////////////////////////////////////////////////////////////////////////

  public interact(...interactionGroups: IInteractionGroups): Promise<void> {
    return this.mainFrameEnvironment.interact(...interactionGroups);
  }

  public isPaintingStable(): Promise<boolean> {
    return this.mainFrameEnvironment.isPaintingStable();
  }

  public isDomContentLoaded(): Promise<boolean> {
    return this.mainFrameEnvironment.isDomContentLoaded();
  }

  public isAllContentLoaded(): Promise<boolean> {
    return this.mainFrameEnvironment.isAllContentLoaded();
  }

  public getJsValue<T>(path: string): Promise<{ value: T; type: string }> {
    return this.mainFrameEnvironment.getJsValue(path);
  }

  public execJsPath<T>(jsPath: IJsPath): Promise<IExecJsPathResult<T>> {
    return this.mainFrameEnvironment.execJsPath<T>(jsPath);
  }

  public getUrl(): Promise<string> {
    return this.mainFrameEnvironment.getUrl();
  }

  public waitForLoad(status: ILoadStatus, options?: IWaitForOptions): Promise<INavigation> {
    return this.mainFrameEnvironment.waitForLoad(status, options);
  }

  public waitForLocation(
    trigger: ILocationTrigger,
    options?: IWaitForOptions,
  ): Promise<IResourceMeta> {
    return this.mainFrameEnvironment.waitForLocation(trigger, options);
  }

  /////// COMMANDS /////////////////////////////////////////////////////////////////////////////////////////////////////

  public getFrameEnvironments(): Promise<IFrameMeta[]> {
    return Promise.resolve(
      [...this.frameEnvironmentsById.values()].filter(x => x.isAttached).map(x => x.toJSON()),
    );
  }

  public async goto(url: string, options?: { timeoutMs?: number }): Promise<IResourceMeta> {
    const formattedUrl = Url.format(new Url.URL(url), { unicode: true });

    const navigation = this.navigations.onNavigationRequested(
      'goto',
      formattedUrl,
      this.lastCommandId,
      null,
    );

    const timeoutMessage = `Timeout waiting for "tab.goto(${url})"`;

    const timer = new Timer(options?.timeoutMs ?? 30e3, this.waitTimeouts);
    const loader = await timer.waitForPromise(
      this.puppetPage.navigate(formattedUrl),
      timeoutMessage,
    );
    this.navigations.assignLoaderId(navigation, loader.loaderId);

    const resource = await timer.waitForPromise(
      this.navigationsObserver.waitForNavigationResourceId(),
      timeoutMessage,
    );
    return this.session.resources.get(resource);
  }

  public async goBack(options?: { timeoutMs?: number }): Promise<string> {
    this.navigations.initiatedUserAction = { reason: 'goBack', startCommandId: this.lastCommandId };
    await this.puppetPage.goBack();
    await this.navigationsObserver.waitForLoad(LoadStatus.PaintingStable, options);
    return this.url;
  }

  public async goForward(options?: { timeoutMs?: number }): Promise<string> {
    this.navigations.initiatedUserAction = {
      reason: 'goForward',
      startCommandId: this.lastCommandId,
    };
    await this.puppetPage.goForward();
    await this.navigationsObserver.waitForLoad(LoadStatus.PaintingStable, options);
    return this.url;
  }

  public async reload(options?: { timeoutMs?: number }): Promise<IResourceMeta> {
    this.navigations.initiatedUserAction = { reason: 'reload', startCommandId: this.lastCommandId };

    const timer = new Timer(options?.timeoutMs ?? 30e3, this.waitTimeouts);
    const timeoutMessage = `Timeout waiting for "tab.reload()"`;

    const loaderId = this.puppetPage.mainFrame.activeLoader.id;
    await timer.waitForPromise(this.puppetPage.reload(), timeoutMessage);
    if (this.puppetPage.mainFrame.activeLoader.id === loaderId) {
      await timer.waitForPromise(
        this.puppetPage.mainFrame.waitOn('frame-navigated', null, options?.timeoutMs),
        timeoutMessage,
      );
    }
    const resource = await timer.waitForPromise(
      this.navigationsObserver.waitForNavigationResourceId(),
      timeoutMessage,
    );
    return this.session.resources.get(resource);
  }

  public async focus(): Promise<void> {
    await this.puppetPage.bringToFront();
  }

  public pendingCollects(): Promise<any> {
    return Promise.all(this.collectedElementsPendingHTML);
  }

  public onResource(x: ITabEventParams['resource']): void {
    if (!x) return;

    const resourceSummary: IResourceSummary = {
      id: x.id,
      frameId: x.frameId,
      tabId: x.tabId,
      url: x.url,
      method: x.request.method,
      type: x.type,
      statusCode: x.response.statusCode,
      redirectedToUrl: x.isRedirect ? x.response.url : null,
      timestamp: x.response.timestamp,
      hasResponse: x.response.headers && Object.keys(x.response.headers).length > 0,
      contentType: x.response.headers
        ? ((x.response.headers['content-type'] ?? x.response.headers['Content-Type']) as string)
        : '',
    };

    this.mirrorNetwork.addResource(resourceSummary);
  }

  public onElementRequested(collectedElement: ICollectedElement): Promise<ICollectedElement> {
    const resolvable = new Resolvable<ICollectedElement>();
    const resolveExisting = Promise.all(this.collectedElementsPendingHTML);
    this.collectedElementsPendingHTML.add(resolvable);

    this.session.db.collectedElements.insert(collectedElement);

    // Don't await this so promise explosions don't escape
    // eslint-disable-next-line promise/catch-or-return
    resolveExisting
      .then(() => this.getElementHtml(collectedElement))
      .then(resolvable.resolve)
      .catch(error => {
        this.logger.warn('CollectedElement.collectHTML:Error', {
          error,
          id: collectedElement.id,
        });
        resolvable.resolve(null);
      })
      .finally(() => this.collectedElementsPendingHTML.delete(resolvable));

    return resolvable.promise;
  }

  public async getElementHtml(collectedElement: ICollectedElement): Promise<ICollectedElement> {
    await this.flushDomChanges();
    const paintIndex = this.mirrorPage.getPaintIndex(collectedElement.domChangesTimestamp);
    try {
      await this.mirrorPage.open(
        await GlobalPool.getUtilityContext(),
        this.sessionId,
        this.session.viewport,
      );
      const frameDomNodeId = this.frameEnvironmentsById.get(collectedElement.frameId).domNodeId;
      const outerHtml = await this.mirrorPage.getNodeOuterHtml(
        paintIndex,
        collectedElement.nodePointerId,
        frameDomNodeId,
      );
      collectedElement.documentUrl = outerHtml.url;
      collectedElement.outerHTML = outerHtml.html;
      this.session.db.collectedElements.updateHtml(collectedElement);
      this.session.emit('collected-asset', { type: 'element', asset: collectedElement });
    } catch (error) {
      this.logger.warn('Tab.getElementHtml: ERROR', {
        Element: collectedElement,
        error,
      });
    }
    return collectedElement;
  }

  public takeScreenshot(options: IScreenshotOptions = {}): Promise<Buffer> {
    if (options.rectangle) options.rectangle.scale ??= 1;
    return this.puppetPage.screenshot(options);
  }

  public async dismissDialog(accept: boolean, promptText?: string): Promise<void> {
    const resolvable = createPromise();
    this.mainFrameEnvironment.interactor.play(
      [[{ command: InteractionCommand.willDismissDialog }]],
      resolvable,
    );
    await resolvable.promise;
    return this.puppetPage.dismissDialog(accept, promptText);
  }

  public async waitForNewTab(options: IWaitForOptions = {}): Promise<Tab> {
    // last command is the one running right now
    const startCommandId = Number.isInteger(options.sinceCommandId)
      ? options.sinceCommandId
      : this.lastCommandId - 1;
    let newTab: Tab;
    const startTime = new Date();
    if (startCommandId >= 0) {
      for (const tab of this.session.tabsById.values()) {
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
      const millis = Date.now() - startTime.getTime();
      timeoutMs -= millis;
      await newTab.navigations.waitOn('navigation-requested', null, timeoutMs).catch(() => null);
    }

    await newTab.navigationsObserver.waitForNavigationResourceId();
    return newTab;
  }

  public async waitForResources(
    filter: IResourceFilterProperties,
    options?: IWaitForResourceOptions,
  ): Promise<IResourceMeta[]> {
    const timer = new Timer(options?.timeoutMs ?? 60e3, this.waitTimeouts);
    const resourcesById: Record<number, IResourceMeta> = {};
    const promise = createPromise();
    let sinceCommandId = -1;
    if (options?.sinceCommandId !== undefined && Number.isInteger(options.sinceCommandId)) {
      sinceCommandId = options.sinceCommandId;
    } else {
      const history = this.session.commands.history;
      sinceCommandId = history[history.length - 2]?.id;
    }

    // escape query string ? if url filter is a string
    // ie http://test.com?param=1 will treat the question mark as an optional char
    if (typeof filter.url === 'string') {
      filter.url = stringToRegex(filter.url);
    }

    const onResource = (resourceMeta: IResourceMeta): void => {
      if (
        resourcesById[resourceMeta.id] ||
        !this.isResourceFilterMatch(resourceMeta, filter, sinceCommandId)
      )
        return;
      resourcesById[resourceMeta.id] = resourceMeta;
      // resolve if any match
      promise.resolve();
    };

    try {
      this.on('resource', onResource);
      for (const resource of this.session.resources.getForTab(this.id)) {
        onResource(resource);
      }
      await timer.waitForPromise(promise.promise, 'Timeout waiting for resources');
    } catch (err) {
      const shouldIgnoreError = err instanceof TimeoutError && options?.throwIfTimeout === false;
      if (!shouldIgnoreError) throw err;
    } finally {
      this.off('resource', onResource);
      timer.clear();
    }

    return Object.values(resourcesById);
  }

  public async waitForFileChooser(options?: IWaitForOptions): Promise<IFileChooserPrompt> {
    let startCommandId =
      options?.sinceCommandId && Number.isInteger(options.sinceCommandId)
        ? options.sinceCommandId
        : null;

    if (!startCommandId && this.session.commands.length >= 2) {
      startCommandId = this.session.commands.history[this.session.commands.length - 2]?.id;
    }

    let event: IPuppetPageEvents['filechooser'];
    if (this.lastFileChooserEvent) {
      const { atCommandId } = this.lastFileChooserEvent;
      if (atCommandId >= startCommandId) {
        event = this.lastFileChooserEvent.event;
      }
    }

    if (!event) {
      event = await this.puppetPage.waitOn('filechooser', null, options?.timeoutMs ?? 30e3);
    }

    const frameEnvironment = this.frameEnvironmentsByPuppetId.get(event.frameId);
    const nodeId = await frameEnvironment.getDomNodeId(event.objectId);
    return {
      jsPath: [nodeId],
      frameId: frameEnvironment.id,
      selectMultiple: event.selectMultiple,
    };
  }

  public waitForMillis(millis: number): Promise<void> {
    return new Timer(millis, this.waitTimeouts).waitForTimeout();
  }

  public async runPluginCommand(toPluginId: string, args: any[]): Promise<any> {
    const commandMeta = {
      puppetPage: this.puppetPage,
      puppetFrame: this.mainFrameEnvironment?.puppetFrame,
    };
    return await this.session.plugins.onPluginCommand(toPluginId, commandMeta, args);
  }

  public willRunCommand(command: ICommandMeta): void {
    const lastCommand = this.session.commands.last;
    const prevFrameId = lastCommand?.frameId ?? this.mainFrameId;
    if (lastCommand && prevFrameId !== command.frameId) {
      // if changing frames, need to clear out interactions
      this.frameEnvironmentsById.get(prevFrameId)?.setInteractionDisplay(false, true, true);
    }
  }

  public addDomStateListener(id: string, options: IDomStateListenArgs): DomStateListener {
    const listener = new DomStateListener(id, options, this);
    this.domStateListenersByJsPathId[id] = listener;
    this.events.once(listener, 'resolved', () => delete this.domStateListenersByJsPathId[id]);

    this.emit('wait-for-domstate', { listener });

    return listener;
  }

  public async flushDomChanges(): Promise<void> {
    for (const frame of this.frameEnvironmentsById.values()) {
      await frame.flushPageEventsRecorder();
    }
    this.session.db.flush();
  }

  public async getDomChanges(
    frameId?: number,
    sinceCommandId?: number,
  ): Promise<IDomChangeRecord[]> {
    await this.mainFrameEnvironment.flushPageEventsRecorder();
    this.session.db.flush();

    return this.session.db.domChanges.getFrameChanges(frameId ?? this.mainFrameId, sinceCommandId);
  }

  public registerFlowHandler(
    name: string,
    id: number,
    callsitePath: ISourceCodeLocation,
  ): Promise<void> {
    this.session.db.flowHandlers.insert({
      name,
      id,
      tabId: this.id,
      callsite: JSON.stringify(callsitePath),
    });
    return Promise.resolve();
  }

  public registerFlowCommand(
    id: number,
    parentId: number,
    callsitePath: ISourceCodeLocation,
  ): Promise<void> {
    this.session.db.flowCommands.insert({
      id,
      parentId,
      tabId: this.id,
      callsite: JSON.stringify(callsitePath),
    });
    return Promise.resolve();
  }

  /////// CLIENT EVENTS ////////////////////////////////////////////////////////////////////////////////////////////////

  public async assert(batchId: string, domStateIdJsPath: IJsPath): Promise<boolean> {
    const domStateListener = this.domStateListenersByJsPathId[JSON.stringify(domStateIdJsPath)];
    return await domStateListener.runBatchAssert(batchId);
  }

  public addRemoteEventListener(
    type: 'message' | 'dom-state' | keyof Tab['EventTypes'],
    emitFn: IRemoteEmitFn,
    jsPath?: IJsPath,
    options?: any,
  ): Promise<{ listenerId: string }> {
    const listener = this.session.commands.observeRemoteEvents(type, emitFn, jsPath, this.id);

    if (type === 'message') {
      const [domain, resourceId] = jsPath;
      if (domain !== 'resources') {
        throw new Error(`Unknown "message" type requested in JsPath - ${domain}`);
      }
      // need to give client time to register function sending events
      process.nextTick(() =>
        this.session.websocketMessages.listen(Number(resourceId), listener.listenFn),
      );
    } else if (type === 'dom-state') {
      const id = JSON.stringify(jsPath);
      const domStateListener = this.addDomStateListener(id, options);
      this.events.on(domStateListener, 'updated', listener.listenFn);
    } else {
      this.on(type, listener.listenFn);
    }
    return Promise.resolve({ listenerId: listener.id });
  }

  public removeRemoteEventListener(listenerId: string, options?: any): Promise<any> {
    const listener = this.session.commands.getRemoteEventListener(listenerId);
    const { listenFn, type, jsPath } = listener;
    if (jsPath) {
      if (type === 'message') {
        const [domain, resourceId] = jsPath;
        if (domain !== 'resources') {
          throw new Error(`Unknown "message" type requested in JsPath - ${domain}`);
        }
        this.session.websocketMessages.unlisten(Number(resourceId), listenFn);
      }

      if (type === 'dom-state') {
        const id = JSON.stringify(jsPath);
        this.domStateListenersByJsPathId[id]?.stop(options);
      }
    } else {
      this.off(type as any, listenFn);
    }
    return Promise.resolve();
  }

  /////// UTILITIES ////////////////////////////////////////////////////////////////////////////////////////////////////

  public toJSON(): ISessionMeta {
    return {
      tabId: this.id,
      frameId: this.mainFrameId,
      parentTabId: this.parentTabId,
      sessionId: this.sessionId,
      url: this.url,
      createdAtCommandId: this.createdAtCommandId,
    } as ISessionMeta; // must adhere to session meta spec
  }

  private async waitForReady(): Promise<void> {
    await this.mainFrameEnvironment.isReady;
    if (this.session.options?.blockedResourceTypes) {
      await this.setBlockedResourceTypes(this.session.options.blockedResourceTypes);
    }
  }

  private listen(): void {
    const page = this.puppetPage;
    this.events.on(this, 'resource', this.onResource.bind(this));

    this.close = this.close.bind(this);
    this.events.once(page, 'close', this.close);
    this.events.on(page, 'page-error', this.onPageError.bind(this), true);
    this.events.on(page, 'crashed', this.onTargetCrashed.bind(this));
    this.events.on(page, 'console', this.onConsole.bind(this), true);
    this.events.on(page, 'frame-created', this.onFrameCreated.bind(this), true);
    this.events.on(page, 'page-callback-triggered', this.onPageCallback.bind(this));
    this.events.on(page, 'dialog-opening', this.onDialogOpening.bind(this));
    this.events.on(page, 'filechooser', this.onFileChooser.bind(this));
    this.events.on(page, 'screenshot', this.onScreenshot.bind(this));

    // resource requested should registered before navigations so we can grab nav on new tab anchor clicks
    this.events.on(
      page,
      'resource-will-be-requested',
      this.onResourceWillBeRequested.bind(this),
      true,
    );
    this.events.on(page, 'resource-was-requested', this.onResourceWasRequested.bind(this), true);
    this.events.on(page, 'resource-loaded', this.onResourceLoaded.bind(this), true);
    this.events.on(page, 'resource-failed', this.onResourceFailed.bind(this), true);
    this.events.on(page, 'navigation-response', this.onNavigationResourceResponse.bind(this), true);

    this.events.on(page, 'dom-storage-updated', this.onStorageUpdated.bind(this), true);

    // websockets
    this.events.on(
      page,
      'websocket-handshake',
      this.session.resources.registerWebsocketHeaders.bind(this.session.resources, this.id),
    );
    this.events.on(page, 'websocket-frame', this.onWebsocketFrame.bind(this));
  }

  private onPageCallback(event: IPuppetPageEvents['page-callback-triggered']): void {
    if (event.name === InjectedScripts.PageEventsCallbackName) {
      const { frameId, payload } = event;
      if (!frameId || !this.frameEnvironmentsByPuppetId.has(frameId)) {
        log.warn('DomRecorder.bindingCalledBeforeExecutionTracked', {
          sessionId: this.sessionId,
          payload,
        });
        return;
      }

      this.frameEnvironmentsByPuppetId.get(frameId).onPageRecorderEvents(JSON.parse(payload));
    }
  }

  /////// REQUESTS EVENT HANDLERS  /////////////////////////////////////////////////////////////////

  private isResourceFilterMatch(
    resourceMeta: IResourceMeta,
    filter: IResourceFilterProperties,
    sinceCommandId?: number,
  ): boolean {
    if (resourceMeta.tabId !== this.id) return false;
    if (!resourceMeta.seenAtCommandId) {
      // need to set directly since passed in object is a copy
      this.session.resources.recordSeen(resourceMeta, this.lastCommandId);
    }
    if (sinceCommandId && resourceMeta.seenAtCommandId <= sinceCommandId) return false;
    if (filter.type && resourceMeta.type !== filter.type) return false;
    if (filter.url && !resourceMeta.url.match(filter.url)) return false;
    if (!filter.httpRequest) return true;

    const { method, statusCode } = filter.httpRequest;
    if (method && resourceMeta.request.method !== method) return false;
    if (statusCode && resourceMeta.response?.statusCode !== statusCode) {
      return false;
    }
    return true;
  }

  private onResourceWillBeRequested(event: IPuppetPageEvents['resource-will-be-requested']): void {
    const { session, lastCommandId } = this;
    const { resource, isDocumentNavigation, frameId, redirectedFromUrl } = event;
    const url = resource.url.href;

    const frame = frameId
      ? this.getFrameForEventOrQueueForReady('resource-will-be-requested', event)
      : this.mainFrameEnvironment;

    if (!frame) return;

    const navigations = frame.navigations;

    if (isDocumentNavigation && !navigations.top) {
      navigations.onNavigationRequested(
        'newFrame',
        url,
        lastCommandId,
        resource.browserRequestId,
        event.loaderId,
      );
    }
    resource.hasUserGesture ||= navigations.didGotoUrl(url);

    const pendingRequest = session.resources.onBrowserWillRequest(this.id, frame.id, resource);

    if (isDocumentNavigation && !event.resource.browserCanceled) {
      navigations.onHttpRequested(
        url,
        lastCommandId,
        redirectedFromUrl,
        resource.browserRequestId,
        event.loaderId,
      );
    }
    if (this.mirrorNetwork) {
      this.mirrorNetwork.addRequestedResource({
        id: pendingRequest.mitmResourceId,
        frameId: pendingRequest.frameId,
        tabId: pendingRequest.tabId,
        url: pendingRequest.url,
        method: pendingRequest.method,
        type: pendingRequest.resourceType,
        statusCode: resource.status,
        redirectedToUrl: resource.redirectedToUrl,
        timestamp: pendingRequest.requestTime,
        hasResponse: false,
        contentType: '',
      });
    }
  }

  private onResourceWasRequested(event: IPuppetPageEvents['resource-was-requested']): void {
    this.session.resources.onBrowserDidRequest(
      this.id,
      this.translatePuppetFrameId(event.frameId),
      event.resource,
    );
  }

  private onResourceLoaded(event: IPuppetPageEvents['resource-loaded']): void {
    const { resource, frameId, loaderId } = event;

    const frame = frameId
      ? this.getFrameForEventOrQueueForReady('resource-loaded', event as any)
      : this.mainFrameEnvironment;
    this.session.resources.onBrowserDidRequest(this.id, frame?.id, resource);

    // if we didn't get a frame, don't keep going
    if (!frame) return;

    const isPending = frame.navigations.doesMatchPending(
      resource.browserRequestId,
      resource.url?.href,
      resource.responseUrl,
    );
    if (isPending) {
      if (resource.browserServedFromCache) {
        frame.navigations.onHttpResponded(
          resource.browserRequestId,
          resource.responseUrl ?? resource.url?.href,
          loaderId,
          resource.browserLoadedTime,
        );
      }
      const existingResource = this.session.resources.getBrowserRequestLatestResource(
        resource.browserRequestId,
      );
      if (existingResource) {
        frame.navigations.onResourceLoaded(existingResource.id, resource.status);
      }
    }

    const isKnownResource = this.session.resources.onBrowserResourceLoaded(this.id, resource);

    if (
      !isKnownResource &&
      (resource.browserServedFromCache || resource.url?.protocol === 'blob:' || disableMitm)
    ) {
      this.session.resources
        .createNewResourceIfUnseen(this.id, frame.id, resource, event.body)
        .then(meta => meta && this.checkForResolvedNavigation(resource.browserRequestId, meta))
        .catch(() => null);
    }
  }

  private onResourceFailed(event: IPuppetPageEvents['resource-failed']): void {
    const { resource } = event;
    const loadError = Resources.translateResourceError(resource);

    const frame = this.frameEnvironmentsByPuppetId.get(resource.frameId);

    const resourceMeta = this.session.resources.onBrowserRequestFailed(
      this.id,
      frame?.id,
      resource,
      loadError,
    );

    if (resourceMeta) {
      const browserRequestId = resource.browserRequestId;
      this.checkForResolvedNavigation(browserRequestId, resourceMeta, loadError);
    }
  }

  private onNavigationResourceResponse(event: IPuppetPageEvents['navigation-response']): void {
    const frame = event.frameId
      ? this.getFrameForEventOrQueueForReady('navigation-response', event)
      : this.mainFrameEnvironment;

    if (!frame) {
      return;
    }

    frame.navigations.onHttpResponded(
      event.browserRequestId,
      event.url,
      event.loaderId,
      event.timestamp,
    );
    this.session.mitmRequestSession.recordDocumentUserActivity(event.url);
  }

  private onWebsocketFrame(event: IPuppetPageEvents['websocket-frame']): void {
    const resourceId = this.session.resources.getBrowserRequestLatestResource(
      event.browserRequestId,
    )?.id;
    this.session.websocketMessages.record({
      resourceId,
      message: event.message,
      isFromServer: event.isFromServer,
      lastCommandId: this.lastCommandId,
      timestamp: event.timestamp,
    });
  }

  private onFrameCreated(event: IPuppetPageEvents['frame-created']): void {
    if (this.frameEnvironmentsByPuppetId.has(event.frame.id)) return;
    const frame = new FrameEnvironment(this, event.frame);
    this.frameEnvironmentsByPuppetId.set(frame.devtoolsFrameId, frame);
    this.frameEnvironmentsById.set(frame.id, frame);
    const resourceEvents = this.onFrameCreatedResourceEventsByFrameId[frame.devtoolsFrameId];
    if (resourceEvents) {
      for (const { event: resourceEvent, type } of resourceEvents) {
        if (type === 'resource-will-be-requested')
          this.onResourceWillBeRequested(resourceEvent as any);
        else if (type === 'navigation-response')
          this.onNavigationResourceResponse(resourceEvent as any);
        else if (type === 'resource-loaded') this.onResourceLoaded(resourceEvent as any);
      }
    }
    delete this.onFrameCreatedResourceEventsByFrameId[frame.devtoolsFrameId];
  }

  private onScreenshot(event: IPuppetPageEvents['screenshot']): void {
    if (
      !this.session.db.screenshots.includeWhiteScreens &&
      ScreenshotsTable.isBlankImage(event.imageBase64)
    ) {
      return;
    }

    this.session.db.screenshots.insert({
      tabId: this.id,
      image: Buffer.from(event.imageBase64, 'base64'),
      timestamp: event.timestamp,
    });
  }

  private onStorageUpdated(event: IPuppetPageEvents['dom-storage-updated']): void {
    this.session.db.storageChanges.insert(this.id, null, event);
  }

  private getFrameForEventOrQueueForReady(
    type: keyof IPuppetPageEvents,
    event: IPuppetPageEvents[keyof IPuppetPageEvents] & { frameId: string },
  ): FrameEnvironment {
    const frame = this.frameEnvironmentsByPuppetId.get(event.frameId);
    if (event.frameId && !frame) {
      this.onFrameCreatedResourceEventsByFrameId[event.frameId] ??= [];
      const events = this.onFrameCreatedResourceEventsByFrameId[event.frameId];
      if (!events.some(x => x.event === event)) {
        events.push({ event, type });
      }
    }
    return frame;
  }

  /////// LOGGING EVENTS ///////////////////////////////////////////////////////////////////////////

  private onPageError(event: IPuppetPageEvents['page-error']): void {
    const { error, frameId } = event;
    this.logger.info('Window.pageError', { error, frameId });
    const translatedFrameId = this.translatePuppetFrameId(frameId);
    this.session.db.pageLogs.insert(
      this.id,
      translatedFrameId,
      `events.page-error`,
      error.stack || String(error),
      new Date(),
    );
  }

  private onConsole(event: IPuppetPageEvents['console']): void {
    const { frameId, type, message, location } = event;
    const translatedFrameId = this.translatePuppetFrameId(frameId);

    let level = 'info';
    if (message.startsWith('ERROR:') && message.includes(injectedSourceUrl)) {
      level = 'error';
    }
    this.logger[level]('Window.console', { message });
    this.session.db.pageLogs.insert(
      this.id,
      translatedFrameId,
      type,
      message,
      new Date(),
      location,
    );
  }

  private onTargetCrashed(event: IPuppetPageEvents['crashed']): void {
    const error = event.error;

    const errorLevel = event.fatal ? 'error' : 'info';
    this.logger[errorLevel]('BrowserEngine.Tab.crashed', { error });
    this.session.db.pageLogs.insert(
      this.id,
      this.mainFrameId,
      `events.error`,
      error.stack || String(error),
      new Date(),
    );
  }

  private translatePuppetFrameId(puppetFrameId: string): number {
    return this.frameEnvironmentsByPuppetId.get(puppetFrameId)?.id ?? this.mainFrameId;
  }

  /////// DIALOGS //////////////////////////////////////////////////////////////////////////////////

  private onDialogOpening(event: IPuppetPageEvents['dialog-opening']): void {
    this.emit('dialog', event.dialog);
  }

  private onFileChooser(event: IPuppetPageEvents['filechooser']): void {
    this.lastFileChooserEvent = { event, atCommandId: this.lastCommandId };
  }

  // CREATE

  public static create(
    session: Session,
    puppetPage: IPuppetPage,
    parentTabId?: number,
    openParams?: { url: string; windowName: string; loaderId: string },
  ): Tab {
    const tab = new Tab(session, puppetPage, parentTabId, openParams);
    tab.logger.info('Tab.created', {
      parentTab: parentTabId,
      openParams,
    });
    return tab;
  }
}

export interface ITabEventParams {
  'child-tab-created': Tab;
  close: null;
  dialog: IPuppetDialog;
  'page-events': {
    frame: FrameEnvironment;
    records: {
      domChanges: IDomChangeRecord[];
      focusEvents: IFocusRecord[];
      mouseEvents: IMouseEventRecord[];
      scrollEvents: IScrollRecord[];
    };
  };
  'wait-for-domstate': { listener: DomStateListener };
  'resource-requested': IResourceMeta;
  resource: IResourceMeta;
  'websocket-message': IWebsocketResourceMessage;
}

export function stringToRegex(str: string): RegExp {
  const escaped = str.replace(/[-[/\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  return new RegExp(escaped);
}
