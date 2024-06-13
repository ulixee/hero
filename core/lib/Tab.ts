import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';
import TimeoutError from '@ulixee/commons/interfaces/TimeoutError';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Log from '@ulixee/commons/lib/Logger';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import Timer from '@ulixee/commons/lib/Timer';
import { createPromise } from '@ulixee/commons/lib/utils';
import { injectedSourceUrl } from '@ulixee/default-browser-emulator/lib/DomOverridesBuilder';
import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import IDetachedElement from '@ulixee/hero-interfaces/IDetachedElement';
import IDetachedResource from '@ulixee/hero-interfaces/IDetachedResource';
import IDomStateListenArgs from '@ulixee/hero-interfaces/IDomStateListenArgs';
import IFrameMeta from '@ulixee/hero-interfaces/IFrameMeta';
import IResourceFilterProperties from '@ulixee/hero-interfaces/IResourceFilterProperties';
import IResourceSummary from '@ulixee/hero-interfaces/IResourceSummary';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import { IBlockedResourceType, InterceptedResource } from '@ulixee/hero-interfaces/ITabOptions';
import IWaitForOptions from '@ulixee/hero-interfaces/IWaitForOptions';
import IWaitForResourceOptions from '@ulixee/hero-interfaces/IWaitForResourceOptions';
import MirrorNetwork from '@ulixee/hero-timetravel/lib/MirrorNetwork';
import MirrorPage from '@ulixee/hero-timetravel/lib/MirrorPage';
import { IJsPath } from '@ulixee/js-path';
import BrowserContext from '@ulixee/unblocked-agent/lib/BrowserContext';
import FrameNavigations from '@ulixee/unblocked-agent/lib/FrameNavigations';
import FrameNavigationsObserver from '@ulixee/unblocked-agent/lib/FrameNavigationsObserver';
import Page from '@ulixee/unblocked-agent/lib/Page';
import { IWebsocketMessage } from '@ulixee/unblocked-agent/lib/WebsocketMessages';
import IDialog from '@ulixee/unblocked-specification/agent/browser/IDialog';
import IExecJsPathResult from '@ulixee/unblocked-specification/agent/browser/IExecJsPathResult';
import IFileChooserPrompt from '@ulixee/unblocked-specification/agent/browser/IFileChooserPrompt';
import INavigation from '@ulixee/unblocked-specification/agent/browser/INavigation';
import { IPageEvents } from '@ulixee/unblocked-specification/agent/browser/IPage';
import IScreenshotOptions from '@ulixee/unblocked-specification/agent/browser/IScreenshotOptions';
import {
  ILoadStatus,
  ILocationTrigger,
  LoadStatus,
} from '@ulixee/unblocked-specification/agent/browser/Location';
import { IInteractionGroups } from '@ulixee/unblocked-specification/agent/interact/IInteractions';
import IResourceMeta from '@ulixee/unblocked-specification/agent/net/IResourceMeta';
import { IRemoteEmitFn, IRemoteEventListener } from '../interfaces/IRemoteEventListener';
import { IDomChangeRecord } from '../models/DomChangesTable';
import { IFocusRecord } from '../models/FocusEventsTable';
import { IMouseEventRecord } from '../models/MouseEventsTable';
import ScreenshotsTable from '../models/ScreenshotsTable';
import { IScrollRecord } from '../models/ScrollEventsTable';
import { IStorageChangesEntry } from '../models/StorageChangesTable';
import CommandRecorder from './CommandRecorder';
import { ICommandableTarget } from './CommandRunner';
import DomStateListener from './DomStateListener';
import FrameEnvironment from './FrameEnvironment';
import InjectedScripts from './InjectedScripts';
import Session from './Session';

const { log } = Log(module);

export default class Tab
  extends TypedEventEmitter<ITabEventParams>
  implements ISessionMeta, ICommandableTarget, IRemoteEventListener
{
  public get id(): number {
    return this.page.tabId;
  }

  public readonly parentTabId?: number;
  public session: Session;
  public readonly frameEnvironmentsById = new Map<number, FrameEnvironment>();
  public readonly frameEnvironmentsByDevtoolsId = new Map<string, FrameEnvironment>();
  public page: Page;
  public isClosing = false;
  public isReady: Promise<void>;
  public readonly mirrorPage: MirrorPage;

  protected readonly logger: IBoundLog;
  private readonly mirrorNetwork: MirrorNetwork;

  private detachedElementsPendingHTML = new Set<Resolvable<IDetachedElement>>();

  private events = new EventSubscriber();
  private commandRecorder: CommandRecorder;
  private readonly createdAtCommandId: number;
  private waitTimeouts: { timeout: NodeJS.Timeout; reject: (reason?: any) => void }[] = [];
  private lastFileChooserEvent: {
    event: IPageEvents['filechooser'];
    atCommandId: number;
  };

  private readonly domStateListenersByJsPathId: {
    [domStateJsPathId: string]: DomStateListener;
  } = {};

  public get navigations(): FrameNavigations {
    return this.mainFrameEnvironment.navigations;
  }

  public get navigationsObserver(): FrameNavigationsObserver {
    return this.mainFrameEnvironment.frame.navigationsObserver;
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
    return this.frameEnvironmentsByDevtoolsId.get(this.page.mainFrame.id);
  }

  private constructor(session: Session, page: Page, parentTabId?: number) {
    super();
    this.session = session;
    this.page = page;
    this.parentTabId = parentTabId;
    this.createdAtCommandId = session.commands.lastId;
    this.logger = log.createChild(module, {
      tabId: this.id,
      sessionId: session.id,
    });
    this.setEventsToLog(this.logger, ['child-tab-created', 'close', 'dialog', 'websocket-message']);

    for (const frame of page.frames) {
      const frameEnvironment = new FrameEnvironment(this, frame);
      this.frameEnvironmentsByDevtoolsId.set(frameEnvironment.devtoolsFrameId, frameEnvironment);
      this.frameEnvironmentsById.set(frameEnvironment.id, frameEnvironment);
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
      this.detachResource,
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

  public createMirrorPage(cleanupOnTabClose = true): MirrorPage {
    const mirrorPage = new MirrorPage(this.mirrorNetwork, {
      paintEvents: [],
      mainFrameIds: new Set([this.mainFrameId]),
      documents: [],
      domNodePathByFrameId: this.session.db.frames.frameDomNodePathsById,
    });
    mirrorPage.subscribe(this, cleanupOnTabClose);
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

  public async setBlockedResourceTypes(
    blockedResourceTypes: IBlockedResourceType[],
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
      if (blockedResourceTypes.includes('BlockFonts')) {
        interceptor.types.push('Font');
      }
      if (blockedResourceTypes.includes('BlockIcons')) {
        interceptor.types.push('Ico');
      }
      if (blockedResourceTypes.includes('BlockMedia')) {
        interceptor.types.push('Media');
      }
      if (blockedResourceTypes.includes('BlockJsResources')) {
        interceptor.types.push('Script');
      }
      if (blockedResourceTypes.includes('JsRuntime')) {
        enableJs = false;
      }
    }
    await this.page.setJavaScriptEnabled(enableJs);
  }

  public setBlockedResourceUrls(blockedUrls: (string | RegExp)[]): void {
    const mitmSession = this.session.mitmRequestSession;

    let interceptor = mitmSession.interceptorHandlers.find(x => x.types && !x.handlerFn);
    if (!interceptor) {
      mitmSession.interceptorHandlers.push({ types: [] });
      interceptor = mitmSession.interceptorHandlers[mitmSession.interceptorHandlers.length - 1];
    }

    interceptor.urls = blockedUrls;
  }

  public setInterceptedResources(interceptedResources?: InterceptedResource[]): void {
    const mitmSession = this.session.mitmRequestSession;

    if (interceptedResources) {
      for (const resource of interceptedResources) {
        if (resource) {
          const interceptor = {
            types: [],
            urls: [resource.url],
            handlerFn: async (url, type, request, response): Promise<boolean> => {
              if (resource.statusCode) {
                response.statusCode = resource.statusCode;
              }

              if (resource.headers) {
                for (const [key, value] of Object.entries(resource.headers)) {
                  response.setHeader(key, value);
                }
              }

              if (resource.body) {
                response.end(resource.body);
              } else {
                response.end();
              }

              return true;
            },
          };

          mitmSession.interceptorHandlers.push(interceptor);
        }
      }
    }
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
      await this.page.domStorageTracker.finalFlush(5e3);
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
      this.page.off('close', this.close);
      // run this one individually
      await this.page.close();
    } catch (error) {
      if (!error.message.includes('Target closed') && !(error instanceof CanceledPromiseError)) {
        errors.push(error);
      }
    }
    this.events.close();
    this.commandRecorder.cleanup();
    this.commandRecorder = null;
    this.emit('close');
    // clean up listener memory
    this.removeAllListeners();
    this.session = null;
    this.frameEnvironmentsById.clear();
    this.frameEnvironmentsByDevtoolsId.clear();

    this.logger.stats('Tab.Closed', { parentLogId, errors });
  }

  public async setOrigin(origin: string): Promise<void> {
    const mitmSession = this.session.mitmRequestSession;
    const originalBlocker = [...mitmSession.interceptorHandlers];
    mitmSession.interceptorHandlers.unshift({
      urls: [origin],
      handlerFn(url, type, request, response) {
        response.end(
          `<html lang="en"><head><link rel="icon" href="data:,"></head><body>Empty</body></html>`,
        );
        return true;
      },
    });
    try {
      await this.page.navigate(origin);
    } finally {
      // restore originals
      mitmSession.interceptorHandlers = originalBlocker;
    }
  }

  public async detachResource(
    name: string,
    resourceId: number,
    timestamp: number,
  ): Promise<IDetachedResource> {
    const resource = this.session.resources.get(resourceId);
    if (!resource) throw new Error('Unknown resource collected');
    this.session.db.detachedResources.insert(
      this.id,
      resourceId,
      name,
      timestamp,
      this.session.commands.lastId,
    );

    const detachedResource: IDetachedResource = {
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
      detachedResource.websocketMessages = this.session.websocketMessages.getMessages(resourceId);
    }
    this.session.emit('collected-asset', { type: 'resource', asset: detachedResource });
    return detachedResource;
  }

  public async getResourceProperty(
    resourceId: number,
    propertyPath: 'response.buffer' | 'messages' | 'request.postData',
  ): Promise<Buffer | IWebsocketMessage[]> {
    if (propertyPath === 'response.buffer') {
      return await this.session.db.resources.getResourceBodyById(resourceId, true);
    }
    if (propertyPath === 'request.postData') {
      return this.session.db.resources.getResourcePostDataById(resourceId);
    }
    if (propertyPath === 'messages') {
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

  public async waitForLocation(
    trigger: ILocationTrigger,
    options?: IWaitForOptions,
  ): Promise<IResourceMeta> {
    return await this.mainFrameEnvironment.waitForLocation(trigger, options);
  }

  /////// COMMANDS /////////////////////////////////////////////////////////////////////////////////////////////////////

  public getFrameEnvironments(): Promise<IFrameMeta[]> {
    return Promise.resolve(
      [...this.frameEnvironmentsById.values()].filter(x => x.isAttached).map(x => x.toJSON()),
    );
  }

  public async goto(
    url: string,
    options?: { timeoutMs?: number; referrer?: string },
  ): Promise<IResourceMeta> {
    return await this.page.goto(url, options);
  }

  public async goBack(options?: { timeoutMs?: number }): Promise<string> {
    return await this.page.goBack(options);
  }

  public async goForward(options?: { timeoutMs?: number }): Promise<string> {
    return await this.page.goForward(options);
  }

  public async reload(options?: { timeoutMs?: number }): Promise<IResourceMeta> {
    return await this.page.reload(options);
  }

  public async focus(): Promise<void> {
    await this.page.bringToFront();
  }

  public pendingCollects(): Promise<any> {
    return Promise.all(this.detachedElementsPendingHTML);
  }

  public onResource(x: ITabEventParams['resource']): void {
    if (!x) return;

    x.response ??= {} as any;

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

  public onElementRequested(
    detachedElement: IDetachedElement,
    saveToDb = true,
  ): Promise<IDetachedElement> {
    const resolvable = new Resolvable<IDetachedElement>();
    const resolveExisting = Promise.all(this.detachedElementsPendingHTML);
    this.detachedElementsPendingHTML.add(resolvable);

    if (saveToDb) {
      this.session.db.detachedElements.insert(detachedElement);
    }

    // Don't await this so promise explosions don't escape
    // eslint-disable-next-line promise/catch-or-return
    resolveExisting
      .then(() => this.getElementHtml(detachedElement))
      .then(resolvable.resolve)
      .catch(error => {
        this.logger.warn('DetachedElement.collectHTML:Error', {
          error,
          id: detachedElement.id,
        });
        resolvable.resolve(null);
      })
      .finally(() => this.detachedElementsPendingHTML.delete(resolvable));

    return resolvable.promise;
  }

  public async getElementHtml(detachedElement: IDetachedElement): Promise<IDetachedElement> {
    await this.flushDomChanges();
    const paintIndex = this.mirrorPage.getPaintIndex(detachedElement.domChangesTimestamp);
    try {
      await this.mirrorPage.openInContext(
        await this.session.core.getUtilityContext(),
        this.sessionId,
        this.session.viewport,
      );
      const frameDomNodeId = this.frameEnvironmentsById.get(detachedElement.frameId).domNodeId;
      const outerHtml = await this.mirrorPage.getNodeOuterHtml(
        paintIndex,
        detachedElement.nodePointerId,
        frameDomNodeId,
      );
      detachedElement.documentUrl = outerHtml.url;
      detachedElement.outerHTML = outerHtml.html;
      this.session.db.detachedElements.updateHtml(detachedElement);
      this.session.emit('collected-asset', { type: 'element', asset: detachedElement });
    } catch (error) {
      this.logger.warn('Tab.getElementHtml: ERROR', {
        Element: detachedElement,
        error,
      });
    }
    return detachedElement;
  }

  public takeScreenshot(options: IScreenshotOptions = {}): Promise<Buffer> {
    if (options.rectangle) options.rectangle.scale ??= 1;
    return this.page.screenshot(options);
  }

  public async dismissDialog(accept: boolean, promptText?: string): Promise<void> {
    return await this.page.dismissDialog(accept, promptText);
  }

  public async waitForNewTab(options: IWaitForOptions = {}): Promise<Tab> {
    // last command is the one running right now
    const startCommandId = Number.isInteger(options.sinceCommandId)
      ? options.sinceCommandId
      : this.lastCommandId - 1;
    let newTab: Tab;
    const startTime = new Date();
    let timeoutMs = options?.timeoutMs ?? 30e3;

    if (startCommandId >= 0) {
      for (const tab of this.session.tabsById.values()) {
        if (tab.parentTabId === this.id && tab.createdAtCommandId >= startCommandId) {
          newTab = tab;
          break;
        }
      }
    }

    if (!newTab) newTab = await this.waitOn('child-tab-created', undefined, timeoutMs);

    // wait for a real url to be requested
    if (newTab.url === 'about:blank' || !newTab.url) {
      const millis = Date.now() - startTime.getTime();
      timeoutMs -= millis;
      await newTab.navigations.waitOn('navigation-requested', null, timeoutMs).catch(() => null);
    }

    const timeoutMsElapsed = Date.now() - startTime.getTime();
    timeoutMs -= timeoutMsElapsed;
    await newTab.mainFrameEnvironment.waitForLoad(LoadStatus.JavascriptReady, {
      timeoutMs,
    });
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

    let event: IPageEvents['filechooser'];
    if (this.lastFileChooserEvent) {
      const { atCommandId } = this.lastFileChooserEvent;
      if (atCommandId >= startCommandId) {
        event = this.lastFileChooserEvent.event;
      }
    }

    if (!event) {
      event = await this.page.waitOn('filechooser', null, options?.timeoutMs ?? 30e3);
    }

    return event.prompt;
  }

  public waitForMillis(millis: number): Promise<void> {
    return new Timer(millis, this.waitTimeouts).waitForTimeout();
  }

  public async runPluginCommand(toPluginId: string, args: any[]): Promise<any> {
    const commandMeta = {
      page: this.page,
      frame: this.mainFrameEnvironment?.frame,
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
    if (this.session.options?.blockedResourceUrls) {
      await this.setBlockedResourceUrls(this.session.options.blockedResourceUrls);
    }
    if (this.session.options?.interceptedResources) {
      await this.setInterceptedResources(this.session.options.interceptedResources);
    }
  }

  private listen(): void {
    const page = this.page;
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

    this.events.on(
      page.browserContext.resources,
      'browser-will-request',
      this.onResourceWillBeRequested.bind(this),
    );

    this.events.on(page, 'dom-storage-updated', this.onStorageUpdated.bind(this), true);
  }

  private onPageCallback(event: IPageEvents['page-callback-triggered']): void {
    if (event.name === InjectedScripts.PageEventsCallbackName) {
      const { frameId, payload } = event;
      if (!frameId || !this.frameEnvironmentsById.has(frameId)) {
        log.warn('DomRecorder.bindingCalledBeforeExecutionTracked', {
          sessionId: this.sessionId,
          payload,
        });
        return;
      }

      this.frameEnvironmentsById.get(frameId).onPageRecorderEvents(JSON.parse(payload));
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
      resourceMeta.seenAtCommandId = this.lastCommandId;
      this.session.db.resources.updateSeenAtCommandId(
        resourceMeta.id,
        resourceMeta.seenAtCommandId,
      );
    } else if (sinceCommandId && resourceMeta.seenAtCommandId <= sinceCommandId) {
      return false;
    }
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

  private onResourceWillBeRequested(
    event: BrowserContext['resources']['EventTypes']['browser-will-request'],
  ): void {
    if (!this.mirrorNetwork) return;

    const { resource, mitmMatch } = event;

    this.mirrorNetwork.addRequestedResource({
      id: mitmMatch.mitmResourceId,
      frameId: mitmMatch.frameId,
      tabId: mitmMatch.tabId,
      url: mitmMatch.url,
      method: mitmMatch.method,
      type: mitmMatch.resourceType,
      statusCode: resource.status,
      redirectedToUrl: resource.redirectedToUrl,
      timestamp: mitmMatch.requestTime,
      hasResponse: false,
      contentType: '',
    });
  }

  private onScreenshot(event: IPageEvents['screenshot']): void {
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

  private onStorageUpdated(event: Page['EventTypes']['dom-storage-updated']): void {
    this.session.db.storageChanges.insert(this.id, null, event);
  }

  private onFrameCreated(event: IPageEvents['frame-created']): void {
    if (this.frameEnvironmentsByDevtoolsId.has(event.frame.id)) return;
    const pageFrame = this.page.framesManager.framesById.get(event.frame.id);
    const frame = new FrameEnvironment(this, pageFrame);
    this.frameEnvironmentsByDevtoolsId.set(frame.devtoolsFrameId, frame);
    this.frameEnvironmentsById.set(frame.id, frame);
  }

  /////// LOGGING EVENTS ///////////////////////////////////////////////////////////////////////////

  private onPageError(event: IPageEvents['page-error']): void {
    const { error, frameId } = event;
    this.logger.info('Window.pageError', { error, frameId });
    this.session.db.pageLogs.insert(
      this.id,
      frameId,
      `events.page-error`,
      error.stack || String(error),
      new Date(),
    );
  }

  private onConsole(event: IPageEvents['console']): void {
    const { frameId, type, message, location } = event;

    let level = 'info';
    if (message.startsWith('ERROR:') && message.includes(injectedSourceUrl)) {
      level = 'error';
    }
    this.logger[level]('Window.console', { message });
    this.session.db.pageLogs.insert(this.id, frameId, type, message, new Date(), location);
  }

  private onTargetCrashed(event: IPageEvents['crashed']): void {
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

  private translateDevtoolsFrameId(devtoolsFrameId: string): number {
    return this.frameEnvironmentsByDevtoolsId.get(devtoolsFrameId)?.id ?? this.mainFrameId;
  }

  /////// DIALOGS //////////////////////////////////////////////////////////////////////////////////

  private onDialogOpening(event: IPageEvents['dialog-opening']): void {
    this.emit('dialog', event.dialog);
  }

  private onFileChooser(event: IPageEvents['filechooser']): void {
    this.lastFileChooserEvent = { event, atCommandId: this.lastCommandId };
  }

  // CREATE

  public static create(
    session: Session,
    page: Page,
    parentTabId?: number,
    openParams?: { url: string; windowName: string },
  ): Tab {
    const tab = new Tab(session, page, parentTabId);
    tab.logger.info('Tab.created', {
      parentTabId,
      openParams,
    });
    return tab;
  }
}

export interface ITabEventParams {
  'child-tab-created': Tab;
  close: null;
  dialog: IDialog;
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
  'websocket-message': IWebsocketMessage;
}

export function stringToRegex(str: string): RegExp {
  if (str.startsWith('*')) str = `.*${str.slice(1)}`;
  const escaped = str.replace(/\/\*/g, '/.*').replace(/[-[/\]{}()+?.,\\^$|#\s]/g, '\\$&');
  return new RegExp(escaped);
}
