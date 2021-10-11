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
import MitmRequestContext from '@ulixee/hero-mitm/lib/MitmRequestContext';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { IInteractionGroups } from '@ulixee/hero-interfaces/IInteractions';
import IExecJsPathResult from '@ulixee/hero-interfaces/IExecJsPathResult';
import IWaitForElementOptions from '@ulixee/hero-interfaces/IWaitForElementOptions';
import { ILoadStatus, ILocationTrigger, LoadStatus } from '@ulixee/hero-interfaces/Location';
import IFrameMeta from '@ulixee/hero-interfaces/IFrameMeta';
import IPuppetDialog from '@ulixee/hero-interfaces/IPuppetDialog';
import IFileChooserPrompt from '@ulixee/hero-interfaces/IFileChooserPrompt';
import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import IPageStateResult from '@ulixee/hero-interfaces/IPageStateResult';
import FrameNavigations from './FrameNavigations';
import CommandRecorder from './CommandRecorder';
import FrameEnvironment from './FrameEnvironment';
import IResourceFilterProperties from '../interfaces/IResourceFilterProperties';
import InjectedScripts from './InjectedScripts';
import Session from './Session';
import SessionState from './SessionState';
import FrameNavigationsObserver from './FrameNavigationsObserver';
import { IDomChangeRecord } from '../models/DomChangesTable';
import DetachedTabState from './DetachedTabState';
import CommandFormatter from './CommandFormatter';
import CommandRunner, { ICommandableTarget } from './CommandRunner';

const { log } = Log(module);

export default class Tab
  extends TypedEventEmitter<ITabEventParams>
  implements ISessionMeta, ICommandableTarget
{
  public readonly id: number;
  public readonly parentTabId?: number;
  public readonly session: Session;
  public readonly frameEnvironmentsById = new Map<number, FrameEnvironment>();
  public readonly frameEnvironmentsByPuppetId = new Map<string, FrameEnvironment>();
  public puppetPage: IPuppetPage;
  public isClosing = false;
  public isReady: Promise<void>;
  public isDetached = false;

  protected readonly logger: IBoundLog;

  private readonly commandRecorder: CommandRecorder;
  private readonly createdAtCommandId: number;
  private waitTimeouts: { timeout: NodeJS.Timeout; reject: (reason?: any) => void }[] = [];
  private lastFileChooserEvent: {
    event: IPuppetPageEvents['filechooser'];
    atCommandId: number;
  };

  private pageStateListeners: { [pageStateId: string]: (() => any)[] } = {};

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

  public get sessionState(): SessionState {
    return this.session.sessionState;
  }

  public get lastCommandId(): number | undefined {
    return this.sessionState.lastCommand?.id;
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

  // eslint-disable-next-line @typescript-eslint/member-ordering
  private constructor(
    session: Session,
    puppetPage: IPuppetPage,
    isDetached: boolean,
    parentTabId?: number,
    windowOpenParams?: { url: string; windowName: string; loaderId: string },
  ) {
    super();
    this.setEventsToLog(['child-tab-created', 'close', 'dialog', 'websocket-message']);
    this.id = session.nextTabId();
    this.logger = log.createChild(module, {
      tabId: this.id,
      sessionId: session.id,
    });
    this.session = session;
    this.parentTabId = parentTabId;
    this.createdAtCommandId = session.sessionState.lastCommand?.id;
    this.puppetPage = puppetPage;
    this.isDetached = isDetached;

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
    this.listen();
    this.isReady = this.waitForReady();
    this.commandRecorder = new CommandRecorder(this, this.session, this.id, this.mainFrameId, [
      this.focus,
      this.dismissDialog,
      this.getFrameEnvironments,
      this.goto,
      this.goBack,
      this.goForward,
      this.reload,
      this.takeScreenshot,
      this.waitForFileChooser,
      this.waitForMillis,
      this.waitForNewTab,
      this.waitForResource,
      this.runPluginCommand,
      // DO NOT ADD waitForReady
    ]);
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
    const frame = this.findFrameWithUnresolvedNavigation(
      browserRequestId,
      resource.request?.method,
      resource.request?.url,
      resource.response?.url,
    );
    if (frame) {
      frame.navigations.onResourceLoaded(resource.id, resource.response?.statusCode, error);
      return true;
    }
    return false;
  }

  public findFrameWithUnresolvedNavigation(
    browserRequestId: string,
    method: string,
    requestedUrl: string,
    finalUrl: string,
  ): FrameEnvironment {
    if (method !== 'GET') return null;

    for (const frame of this.frameEnvironmentsById.values()) {
      const top = frame.navigations.top;
      if (!top || top.resourceIdResolvable.isResolved) continue;

      if (
        (top.finalUrl && finalUrl === top.finalUrl) ||
        requestedUrl === top.requestedUrl ||
        browserRequestId === top.browserRequestId
      ) {
        return frame;
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
      return (await this.sessionState.getResourceData(finalResourceId, true)) as any;
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

  public isPaintingStable(): boolean {
    return this.mainFrameEnvironment.isPaintingStable();
  }

  public isDomContentLoaded(): boolean {
    return this.mainFrameEnvironment.isDomContentLoaded();
  }

  public isAllContentLoaded(): boolean {
    return this.mainFrameEnvironment.isAllContentLoaded();
  }

  public getJsValue<T>(path: string): Promise<{ value: T; type: string }> {
    return this.mainFrameEnvironment.getJsValue(path);
  }

  public execJsPath<T>(jsPath: IJsPath): Promise<IExecJsPathResult<T>> {
    return this.mainFrameEnvironment.execJsPath<T>(jsPath);
  }

  public getUrl(): string {
    return this.mainFrameEnvironment.getUrl();
  }

  public waitForElement(jsPath: IJsPath, options?: IWaitForElementOptions): Promise<boolean> {
    return this.mainFrameEnvironment.waitForElement(jsPath, options);
  }

  public waitForLoad(status: ILoadStatus, options?: IWaitForOptions): Promise<void> {
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
    const navigation = this.navigations.onNavigationRequested(
      'goBack',
      null,
      this.lastCommandId,
      null,
    );
    const backUrl = await this.puppetPage.goBack();
    this.navigations.assignLoaderId(navigation, this.puppetPage.mainFrame.activeLoaderId, backUrl);

    await this.navigationsObserver.waitForLoad(LoadStatus.PaintingStable, { timeoutMs });
    return this.url;
  }

  public async goForward(timeoutMs?: number): Promise<string> {
    const navigation = this.navigations.onNavigationRequested(
      'goForward',
      null,
      this.lastCommandId,
      null,
    );
    const url = await this.puppetPage.goForward();
    this.navigations.assignLoaderId(navigation, this.puppetPage.mainFrame.activeLoaderId, url);
    await this.navigationsObserver.waitForLoad(LoadStatus.PaintingStable, { timeoutMs });
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
    if (options.rectangle) options.rectangle.scale ??= 1;
    return this.puppetPage.screenshot(options.format, options.rectangle, options.jpegQuality);
  }

  public dismissDialog(accept: boolean, promptText?: string): Promise<void> {
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

    await newTab.mainFrameEnvironment.navigationsObserver.waitForNavigationResourceId();
    return newTab;
  }

  public async waitForResource(
    filter: IResourceFilterProperties,
    options?: IWaitForResourceOptions,
  ): Promise<IResourceMeta[]> {
    const timer = new Timer(options?.timeoutMs ?? 60e3, this.waitTimeouts);
    const resourceMetas: IResourceMeta[] = [];
    const promise = createPromise();
    const sinceCommandId =
      options?.sinceCommandId && Number.isInteger(options.sinceCommandId)
        ? options.sinceCommandId
        : -1;

    const onResource = (resourceMeta: IResourceMeta): void => {
      if (resourceMeta.tabId !== this.id) return;
      if (resourceMeta.seenAtCommandId === undefined) {
        resourceMeta.seenAtCommandId = this.lastCommandId;
        // need to set directly since passed in object is a copy
        this.sessionState.getResourceMeta(resourceMeta.id).seenAtCommandId = this.lastCommandId;
      }
      if (resourceMeta.seenAtCommandId <= sinceCommandId) return;
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
      if (isTimeout && options?.throwIfTimeout === false) {
        return resourceMetas;
      }
      throw err;
    } finally {
      this.off('resource', onResource);
      timer.clear();
    }

    return resourceMetas;
  }

  public async waitForFileChooser(options?: IWaitForOptions): Promise<IFileChooserPrompt> {
    let startCommandId =
      options?.sinceCommandId && Number.isInteger(options.sinceCommandId)
        ? options.sinceCommandId
        : null;

    if (!startCommandId && this.sessionState.commands.length >= 2) {
      startCommandId = this.sessionState.commands[this.sessionState.commands.length - 2]?.id;
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
    if (this.session.options.showBrowserInteractions) {
      const fadeGrowlAfterMs: number = undefined;
      const commandName = CommandFormatter.toString(command);
      this.puppetPage.mainFrame
        .evaluate(
          `window.showCommandGrowl(${command.id}, ${JSON.stringify(
            commandName,
          )}, ${fadeGrowlAfterMs})`,
        )
        .catch(() => null);

      const frameId = command.frameId ?? this.mainFrameId;
      const frame = this.frameEnvironmentsById.get(frameId);
      const trackMouse = true;
      const hideMouse = false;
      const hideOverlays = false;

      const lastCommand = this.sessionState.lastCommand;
      const prevFrameId = lastCommand?.frameId ?? this.mainFrameId;
      if (lastCommand && prevFrameId !== frame.id) {
        const prevPuppetFrame = this.frameEnvironmentsById.get(prevFrameId)?.puppetFrame;
        if (prevPuppetFrame) {
          prevPuppetFrame
            .evaluate(`window.toggleCommandActive(false, true, true);`)
            .catch(() => null);
        }
      }

      frame.puppetFrame
        .evaluate(`window.toggleCommandActive(${trackMouse}, ${hideMouse}, ${hideOverlays});`)
        .catch(() => null);
    }
  }

  public didRunCommand(command: ICommandMeta): void {
    if (this.session.options.showBrowserInteractions) {
      const frame = this.frameEnvironmentsById.get(command.frameId) ?? this.mainFrameEnvironment;
      frame?.puppetFrame.evaluate(`window.toggleCommandActive(false)`).catch(() => null);
    }
  }

  public async flushDomChanges(): Promise<void> {
    for (const frame of this.frameEnvironmentsById.values()) {
      await frame.flushPageEventsRecorder();
    }
    this.sessionState.db.flush();
  }

  public async getDomChanges(
    frameId?: number,
    sinceCommandId?: number,
  ): Promise<IDomChangeRecord[]> {
    await this.mainFrameEnvironment.flushPageEventsRecorder();
    this.sessionState.db.flush();

    return this.sessionState.db.domChanges.getFrameChanges(
      frameId ?? this.mainFrameId,
      sinceCommandId,
    );
  }

  public async createDetachedState(): Promise<DetachedTabState> {
    // need the dom to be loaded on the page
    await this.navigationsObserver.waitForLoad(LoadStatus.DomContentLoaded);
    // find last page load
    const lastLoadedNavigation = this.navigations.getLastLoadedNavigation();
    const domChanges = await this.getDomChanges(
      this.mainFrameId,
      lastLoadedNavigation.startCommandId - 1,
    );
    this.logger.info('DetachingTab', {
      url: lastLoadedNavigation.finalUrl,
      domChangeIndices:
        domChanges.length > 0
          ? [domChanges[0].eventIndex, domChanges[domChanges.length - 1].eventIndex]
          : [],
      domChanges: domChanges.length,
    });
    return new DetachedTabState(this, lastLoadedNavigation, domChanges);
  }

  /////// CLIENT EVENTS ////////////////////////////////////////////////////////////////////////////////////////////////

  public addPageStateListener(
    pageStateId: string,
    commands: { [id: string]: () => Promise<any> },
    frames: FrameEnvironment[],
    listenFn: (results: IPageStateResult) => void,
  ): { stop: () => void } {
    let lastResults: string = null;
    let isRunning = false;
    let runAgain = false;
    const shouldStop = (): boolean => {
      return this.isClosing || !this.pageStateListeners[pageStateId];
    };

    const sessionState = this.sessionState;

    async function checkState(): Promise<void> {
      if (shouldStop()) return;
      if (isRunning) {
        runAgain = true;
        return;
      }

      try {
        isRunning = true;
        runAgain = false;

        const results: IPageStateResult = {};

        // make sure to clear out any meta
        sessionState.nextCommandMeta = null;
        await Promise.all(
          Object.entries(commands).map(async ([id, runFn]) => {
            results[id] = await runFn().catch(err => err);
          }),
        );

        if (shouldStop()) return;

        const stringifiedResults = JSON.stringify(results);
        if (lastResults !== stringifiedResults) {
          listenFn(results);
        }
        lastResults = stringifiedResults;
      } finally {
        isRunning = false;
        if (runAgain) process.nextTick(checkState);
      }
    }

    this.pageStateListeners[pageStateId] = [];

    for (const frame of frames) {
      frame.on('paint', checkState);
      frame.navigations.on('status-change', checkState);
      const interval = setInterval(checkState, 2e3).unref();
      setImmediate(checkState);

      this.pageStateListeners[pageStateId].push(() => {
        clearInterval(interval);
        frame.off('paint', checkState);
        frame.navigations.off('status-change', checkState);
      });
    }

    const stop = this.clearPageStateListener.bind(this, pageStateId);
    this.on('close', stop);

    return { stop };
  }

  public clearPageStateListener(id: string): void {
    const unsubscribes = this.pageStateListeners[id];
    delete this.pageStateListeners[id];
    if (unsubscribes) {
      for (const fn of unsubscribes) fn();
    }
  }

  public addJsPathEventListener(
    type: 'message' | 'page-state',
    jsPath: IJsPath,
    options: any,
    listenFn: (...args) => void,
  ): void {
    if (type === 'message') {
      const [domain, resourceId] = jsPath;
      if (domain !== 'resources') {
        throw new Error(`Unknown "message" type requested in JsPath - ${domain}`);
      }
      // need to give client time to register function sending events
      process.nextTick(() => this.sessionState.onWebsocketMessages(Number(resourceId), listenFn));
    }

    if (type === 'page-state') {
      const commandFunctions: { [id: string]: () => Promise<any> } = {};
      const frames: FrameEnvironment[] = [];
      for (const [id, rawCommand] of Object.entries(options.commands)) {
        const [frameId, command, args] = rawCommand as any[];
        const frame = this.getFrameEnvironment(frameId);
        if (!frames.includes(frame)) frames.push(frame);

        const commandRunner = new CommandRunner(command, args, {
          FrameEnvironment: frame,
          Tab: this,
          Session: this.session,
        });
        commandFunctions[id] = commandRunner.runFn;
      }
      this.addPageStateListener(JSON.stringify(jsPath), commandFunctions, frames, listenFn);
    }
  }

  public removeJsPathEventListener(
    type: 'message' | 'page-state',
    jsPath: IJsPath,
    listenFn: (...args) => void,
  ): void {
    if (type === 'message') {
      const [domain, resourceId] = jsPath;
      if (domain !== 'resources') {
        throw new Error(`Unknown "message" type requested in JsPath - ${domain}`);
      }
      this.sessionState.stopWebsocketMessages(Number(resourceId), listenFn);
    }

    if (type === 'page-state') {
      this.clearPageStateListener(JSON.stringify(jsPath));
    }
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
      isDetached: this.isDetached,
    } as ISessionMeta; // must adhere to session meta spec
  }

  private async waitForReady(): Promise<void> {
    await this.mainFrameEnvironment.isReady;
    if (!this.isDetached && this.session.options?.blockedResourceTypes) {
      await this.setBlockedResourceTypes(this.session.options.blockedResourceTypes);
    }
  }

  private listen(): void {
    const page = this.puppetPage;

    this.close = this.close.bind(this);
    page.on('close', this.close);
    page.on('page-error', this.onPageError.bind(this), true);
    page.on('crashed', this.onTargetCrashed.bind(this));
    page.on('console', this.onConsole.bind(this), true);
    page.on('frame-created', this.onFrameCreated.bind(this), true);
    page.on('page-callback-triggered', this.onPageCallback.bind(this));
    page.on('dialog-opening', this.onDialogOpening.bind(this));
    page.on('filechooser', this.onFileChooser.bind(this));

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

  private onResourceWillBeRequested(event: IPuppetPageEvents['resource-will-be-requested']): void {
    const { session, lastCommandId } = this;
    const { resource, isDocumentNavigation, frameId, redirectedFromUrl } = event;
    const { browserRequestId } = resource;
    const url = resource.url.href;

    let navigations = this.frameEnvironmentsByPuppetId.get(frameId)?.navigations;
    // if no frame id provided, use default
    if (!frameId && !navigations) {
      navigations = this.navigations;
    }

    if (!navigations && frameId) {
      this.onFrameCreatedResourceEventsByFrameId[frameId] ??= [];
      const events = this.onFrameCreatedResourceEventsByFrameId[frameId];
      if (!events.some(x => x.event === event)) {
        events.push({ event, type: 'resource-will-be-requested' });
      }
      return;
    }

    if (isDocumentNavigation && !navigations.top) {
      navigations.onNavigationRequested(
        'newFrame',
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

    let frame = this.frameEnvironmentsByPuppetId.get(event.frameId);
    // if no frame id provided, use default
    if (!frame && !event.frameId) frame = this.mainFrameEnvironment;

    if (!frame && event.frameId) {
      this.onFrameCreatedResourceEventsByFrameId[event.frameId] ??= [];
      const events = this.onFrameCreatedResourceEventsByFrameId[event.frameId];
      if (!events.some(x => x.event === event)) {
        events.push({ event, type: 'resource-loaded' });
      }
      return;
    }

    if (
      !!event.resource.browserServedFromCache &&
      event.resource.url?.href === frame.navigations?.top?.requestedUrl &&
      frame.navigations?.top?.resourceIdResolvable?.isResolved === false
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

    if (!resourcesWithBrowserRequestId?.length) {
      // first check if this is a mitm error
      const errorsMatchingUrl = this.session.mitmErrorsByUrl.get(event.resource.url.href);

      // if this resource error-ed out,
      for (let i = 0; i < errorsMatchingUrl?.length ?? 0; i += 1) {
        const error = errorsMatchingUrl[i];
        const request = error.event?.request?.request;
        if (!request) continue;
        if (
          request.method === event.resource.method &&
          Math.abs(request.timestamp - event.resource.requestTime.getTime()) < 500
        ) {
          errorsMatchingUrl.splice(i, 1);
          this.sessionState.captureResourceRequestId(
            error.resourceId,
            event.resource.browserRequestId,
            this.id,
          );
          return;
        }
      }

      setImmediate(r => this.checkForResourceCapture(r), event);
    }
  }

  private async checkForResourceCapture(
    event: IPuppetPageEvents['resource-loaded'],
  ): Promise<void> {
    const resourcesWithBrowserRequestId = this.sessionState.getBrowserRequestResources(
      event.resource.browserRequestId,
    );

    if (resourcesWithBrowserRequestId?.length) return;

    const ctx = MitmRequestContext.createFromPuppetResourceRequest(event.resource);
    const resourceDetails = MitmRequestContext.toEmittedResource(ctx);
    if (!event.resource.browserServedFromCache) {
      resourceDetails.body = await event.body();
      if (resourceDetails.body) {
        delete resourceDetails.response.headers['content-encoding'];
        delete resourceDetails.response.headers['Content-Encoding'];
      }
    }
    const resource = this.sessionState.captureResource(this.id, resourceDetails, true);
    this.checkForResolvedNavigation(event.resource.browserRequestId, resource);
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
    if (resourceMeta) this.checkForResolvedNavigation(browserRequestId, resourceMeta, loadError);
  }

  private onNavigationResourceResponse(event: IPuppetPageEvents['navigation-response']): void {
    let frame = this.frameEnvironmentsByPuppetId.get(event.frameId);

    // if no frame id provided, use default
    if (!frame && !event.frameId) {
      frame = this.mainFrameEnvironment;
    }

    if (event.frameId && !frame) {
      this.onFrameCreatedResourceEventsByFrameId[event.frameId] ??= [];
      const events = this.onFrameCreatedResourceEventsByFrameId[event.frameId];
      if (!events.some(x => x.event === event)) {
        events.push({ event, type: 'navigation-response' });
      }
      return;
    }

    frame.navigations.onHttpResponded(event.browserRequestId, event.url, event.loaderId);
    this.session.mitmRequestSession.recordDocumentUserActivity(event.url);
  }

  private onWebsocketFrame(event: IPuppetPageEvents['websocket-frame']): void {
    const wsResource = this.sessionState.captureWebsocketMessage(event);
    this.emit('websocket-message', wsResource);
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

  /////// LOGGING EVENTS ///////////////////////////////////////////////////////////////////////////

  private onPageError(event: IPuppetPageEvents['page-error']): void {
    const { error, frameId } = event;
    this.logger.info('Window.pageError', { error, frameId });
    const translatedFrameId = this.frameEnvironmentsByPuppetId.get(frameId)?.id;
    this.sessionState.captureError(this.id, translatedFrameId, `events.page-error`, error);
  }

  private onConsole(event: IPuppetPageEvents['console']): void {
    const { frameId, type, message, location } = event;
    const translatedFrameId = this.frameEnvironmentsByPuppetId.get(frameId)?.id;
    this.sessionState.captureLog(this.id, translatedFrameId, type, message, location);
  }

  private onTargetCrashed(event: IPuppetPageEvents['crashed']): void {
    const error = event.error;

    const errorLevel = event.fatal ? 'error' : 'info';
    this.logger[errorLevel]('BrowserEngine.Tab.crashed', { error });

    this.sessionState.captureError(this.id, this.mainFrameId, `events.error`, error);
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
    isDetached?: boolean,
    parentTab?: Tab,
    openParams?: { url: string; windowName: string; loaderId: string },
  ): Tab {
    const tab = new Tab(session, puppetPage, isDetached, parentTab?.id, openParams);
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
  dialog: IPuppetDialog;
  'websocket-message': IWebsocketResourceMessage;
  'child-tab-created': Tab;
}
