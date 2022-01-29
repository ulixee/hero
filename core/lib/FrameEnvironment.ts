import Log from '@ulixee/commons/lib/Logger';
import { ILoadStatus, ILocationTrigger, LoadStatus } from '@ulixee/hero-interfaces/Location';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { ICookie } from '@ulixee/hero-interfaces/ICookie';
import { IInteractionGroups } from '@ulixee/hero-interfaces/IInteractions';
import { URL } from 'url';
import * as Fs from 'fs';
import Timer from '@ulixee/commons/lib/Timer';
import { createPromise } from '@ulixee/commons/lib/utils';
import IWaitForElementOptions from '@ulixee/hero-interfaces/IWaitForElementOptions';
import IExecJsPathResult from '@ulixee/hero-interfaces/IExecJsPathResult';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import { IPuppetFrame, IPuppetFrameEvents } from '@ulixee/hero-interfaces/IPuppetFrame';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import ISetCookieOptions from '@ulixee/hero-interfaces/ISetCookieOptions';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import TimeoutError from '@ulixee/commons/interfaces/TimeoutError';
import INodePointer from 'awaited-dom/base/INodePointer';
import IWaitForOptions from '@ulixee/hero-interfaces/IWaitForOptions';
import IFrameMeta from '@ulixee/hero-interfaces/IFrameMeta';
import { getNodeIdFnName } from '@ulixee/hero-interfaces/jsPathFnNames';
import IJsPathResult from '@ulixee/hero-interfaces/IJsPathResult';
import * as Os from 'os';
import IPoint from '@ulixee/hero-interfaces/IPoint';
import INavigation, { ContentPaint } from '@ulixee/hero-interfaces/INavigation';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { DomActionType } from '@ulixee/hero-interfaces/IDomChangeEvent';
import IDomStateAssertionBatch from '@ulixee/hero-interfaces/IDomStateAssertionBatch';
import ICollectedFragment from '@ulixee/hero-interfaces/ICollectedFragment';
import TabNavigationObserver from './FrameNavigationsObserver';
import Session from './Session';
import Tab, { ITabEventParams } from './Tab';
import Interactor from './Interactor';
import CommandRecorder from './CommandRecorder';
import FrameNavigations from './FrameNavigations';
import { Serializable } from '../interfaces/ISerializable';
import InjectedScriptError from './InjectedScriptError';
import { IJsPathHistory, JsPath } from './JsPath';
import InjectedScripts from './InjectedScripts';
import { PageRecorderResultSet } from '../injected-scripts/pageEventsRecorder';
import { ICommandableTarget } from './CommandRunner';
import { IRemoteEmitFn, IRemoteEventListener } from '../interfaces/IRemoteEventListener';
import IResourceMeta from '@ulixee/hero-interfaces/IResourceMeta';

const { log } = Log(module);

export default class FrameEnvironment
  extends TypedEventEmitter<{ paint: void }>
  implements ICommandableTarget, IRemoteEventListener
{
  public get session(): Session {
    return this.tab.session;
  }

  public get devtoolsFrameId(): string {
    return this.puppetFrame.id;
  }

  public get parentId(): number {
    return this.parentFrame?.id;
  }

  public get parentFrame(): FrameEnvironment | null {
    if (this.puppetFrame.parentId) {
      return this.tab.frameEnvironmentsByPuppetId.get(this.puppetFrame.parentId);
    }
    return null;
  }

  public get isAttached(): boolean {
    return this.puppetFrame.isAttached;
  }

  public get securityOrigin(): string {
    return this.puppetFrame.securityOrigin;
  }

  public get childFrameEnvironments(): FrameEnvironment[] {
    return [...this.tab.frameEnvironmentsById.values()].filter(
      x => x.puppetFrame.parentId === this.devtoolsFrameId && this.isAttached,
    );
  }

  public get isMainFrame(): boolean {
    return !this.puppetFrame.parentId;
  }

  public readonly navigationsObserver: TabNavigationObserver;
  public readonly navigations: FrameNavigations;

  public readonly id: number;
  public readonly tab: Tab;
  public readonly jsPath: JsPath;
  public readonly createdTime: Date;
  public readonly createdAtCommandId: number;
  public puppetFrame: IPuppetFrame;
  public isReady: Promise<Error | void>;
  public domNodeId: number;
  public readonly interactor: Interactor;

  protected readonly logger: IBoundLog;

  private puppetNodeIdsByHeroNodeId: Record<number, string> = {};
  private prefetchedJsPaths: IJsPathResult[];
  private readonly isDetached: boolean;
  private isClosing = false;
  private waitTimeouts: { timeout: NodeJS.Timeout; reject: (reason?: any) => void }[] = [];
  private readonly commandRecorder: CommandRecorder;
  private readonly cleanPaths: string[] = [];
  private lastDomChangeDocumentNavigationId: number;
  private lastDomChangeTimestamp = 0;
  private isTrackingMouse = false;

  private readonly installedDomAssertions = new Set<string>();

  public get url(): string {
    return this.navigations.currentUrl;
  }

  constructor(tab: Tab, frame: IPuppetFrame) {
    super();
    this.puppetFrame = frame;
    this.tab = tab;
    this.createdTime = new Date();
    this.id = this.session.db.frames.nextId;
    this.logger = log.createChild(module, {
      tabId: tab.id,
      sessionId: tab.session.id,
      frameId: this.id,
    });
    this.jsPath = new JsPath(this);
    this.isDetached = tab.isDetached;
    this.createdAtCommandId = this.session.commands.lastId;
    this.navigations = new FrameNavigations(
      this.tab.id,
      this.id,
      this.tab.sessionId,
      tab.session.db.frameNavigations,
    );
    this.navigationsObserver = new TabNavigationObserver(this.navigations);
    this.interactor = new Interactor(this);

    // give tab time to setup
    process.nextTick(() => this.listen());
    this.commandRecorder = new CommandRecorder(this, tab.session, tab.id, this.id, [
      this.createRequest,
      this.collectFragment,
      this.execJsPath,
      this.fetch,
      this.getChildFrameEnvironment,
      this.getCookies,
      this.getJsValue,
      this.getUrl,
      this.isAllContentLoaded,
      this.isDomContentLoaded,
      this.isPaintingStable,
      this.interact,
      this.removeCookie,
      this.setCookie,
      this.setFileInputFiles,
      this.runPluginCommand,
      this.waitForElement,
      this.waitForLoad,
      this.waitForLocation,
      this.addRemoteEventListener,
      this.removeRemoteEventListener,
      // DO NOT ADD waitForReady
    ]);
    // don't let this explode
    this.isReady = this.install().catch(err => err);
  }

  public isAllowedCommand(method: string): boolean {
    return (
      this.commandRecorder.fnNames.has(method) ||
      method === 'close' ||
      method === 'recordDetachedJsPath'
    );
  }

  public close(): void {
    if (this.isClosing) return;
    this.isClosing = true;
    const parentLogId = this.logger.stats('FrameEnvironment.Closing');

    try {
      const cancelMessage = 'Terminated command because session closing';
      Timer.expireAll(this.waitTimeouts, new CanceledPromiseError(cancelMessage));
      this.navigationsObserver.cancelWaiting(cancelMessage);
      this.logger.stats('FrameEnvironment.Closed', { parentLogId });
      for (const path of this.cleanPaths) {
        Fs.promises.unlink(path).catch(() => null);
      }
    } catch (error) {
      if (!error.message.includes('Target closed') && !(error instanceof CanceledPromiseError)) {
        this.logger.error('FrameEnvironment.ClosingError', { error, parentLogId });
      }
    }
  }

  public setInteractionDisplay(
    followMouseMoves: boolean,
    hideMouse = false,
    hideHighlightedNodes = false,
  ): void {
    if (!this.session.options.showBrowserInteractions) return;
    if (this.isTrackingMouse === followMouseMoves) return;
    this.isTrackingMouse = followMouseMoves;
    this.puppetFrame
      .evaluate(
        `window.setInteractionDisplay(${followMouseMoves}, ${hideMouse}, ${hideHighlightedNodes})`,
      )
      .catch(() => null);
  }

  /////// COMMANDS /////////////////////////////////////////////////////////////////////////////////////////////////////

  public async interact(...interactionGroups: IInteractionGroups): Promise<void> {
    if (this.isDetached) {
      throw new Error("Sorry, you can't interact with a detached frame");
    }

    // only install interactor on the main frame
    await this.interactor.initialize(this.isMainFrame);
    const timeoutMs = 120e3;
    const interactionResolvable = createPromise<void>(timeoutMs);
    await this.waitForNavigationLoader(timeoutMs);
    this.waitTimeouts.push({
      timeout: interactionResolvable.timeout,
      reject: interactionResolvable.reject,
    });

    const cancelForNavigation = new CanceledPromiseError('Frame navigated');
    const cancelOnNavigate = (): void => {
      interactionResolvable.reject(cancelForNavigation);
    };
    try {
      this.interactor.play(interactionGroups, interactionResolvable);
      this.puppetFrame.once('frame-navigated', cancelOnNavigate);
      await interactionResolvable.promise;
    } catch (error) {
      if (error === cancelForNavigation) return;
      if (error instanceof CanceledPromiseError && this.isClosing) return;
      throw error;
    } finally {
      this.puppetFrame.off('frame-navigated', cancelOnNavigate);
    }
  }

  public async getJsValue<T>(expression: string): Promise<T> {
    return await this.puppetFrame.evaluate<T>(expression, false);
  }

  public meta(): IFrameMeta {
    return this.toJSON();
  }

  public async collectFragment(
    name: string,
    jsPath: IJsPath,
    waitForFragment = false,
  ): Promise<ICollectedFragment[]> {
    const { nodePointer } = await this.jsPath.getNodePointer(jsPath);
    await this.flushPageEventsRecorder();
    const navigation = this.navigations.lastHttpNavigationRequest;
    const commandId = this.session.commands.lastId;
    const domChangesTimestamp = this.lastDomChangeTimestamp;

    const fragments: ICollectedFragment[] = [];

    if (nodePointer.iterableItems && nodePointer.iterableIsState) {
      for (const item of nodePointer.iterableItems as INodePointer[]) {
        fragments.push({
          name,
          nodePointerId: item.id,
          frameId: this.id,
          tabId: this.tab.id,
          nodeType: item.type,
          nodePreview: item.preview,
          frameNavigationId: navigation.id,
          commandId,
          domChangesTimestamp,
        });
      }
    } else {
      fragments.push({
        name,
        nodePointerId: nodePointer.id,
        frameId: this.id,
        tabId: this.tab.id,
        nodeType: nodePointer.type,
        nodePreview: nodePointer.preview,
        frameNavigationId: navigation.id,
        commandId,
        domChangesTimestamp,
      });
    }

    const promises: Promise<any>[] = [];
    for (const fragment of fragments) {
      const fragmentHtmlPromise = this.tab.onFragmentRequested(fragment);
      if (waitForFragment) {
        promises.push(fragmentHtmlPromise);
      }
    }
    await Promise.all(promises);
    return fragments;
  }

  public async execJsPath<T>(jsPath: IJsPath): Promise<IExecJsPathResult<T>> {
    // if nothing loaded yet, return immediately
    if (!this.navigations.top) return null;
    await this.waitForNavigationLoader();
    const containerOffset = await this.getContainerOffset();
    return await this.jsPath.exec(jsPath, containerOffset);
  }

  public async prefetchExecJsPaths(jsPaths: IJsPathHistory[]): Promise<IJsPathResult[]> {
    const containerOffset = await this.getContainerOffset();
    this.prefetchedJsPaths = await this.jsPath.runJsPaths(jsPaths, containerOffset, false);
    return this.prefetchedJsPaths;
  }

  public recordDetachedJsPath(index: number, runStartDate: number, endDate: number): void {
    const entry = this.prefetchedJsPaths[index];

    const commands = this.session.commands;
    const command = commands.create(this.tab.id, this.id, undefined, 'execJsPath', [entry.jsPath]);
    command.wasPrefetched = true;
    command.endDate = endDate;
    command.result = entry.result;
    commands.onStart(command, runStartDate);
  }

  public async createRequest(input: string | number, init?: IRequestInit): Promise<INodePointer> {
    if (!this.navigations.top && !this.url) {
      throw new Error(
        'You need to use a "goto" before attempting to fetch. The in-browser fetch needs an origin to function properly.',
      );
    }
    await this.waitForNavigationLoader();
    return this.runIsolatedFn(
      `${InjectedScripts.Fetcher}.createRequest`,
      input,
      // @ts-ignore
      init,
    );
  }

  public async fetch(input: string | number, init?: IRequestInit): Promise<INodePointer> {
    if (!this.navigations.top && !this.url) {
      throw new Error(
        'You need to use a "goto" before attempting to fetch. The in-browser fetch needs an origin to function properly.',
      );
    }
    await this.waitForNavigationLoader();
    return this.runIsolatedFn(
      `${InjectedScripts.Fetcher}.fetch`,
      input,
      // @ts-ignore
      init,
    );
  }

  public getViewportSize(): Promise<{ innerWidth: number; innerHeight: number }> {
    return this.jsPath.getWindowOffset();
  }

  public getUrl(): Promise<string> {
    return Promise.resolve(this.navigations.currentUrl || this.puppetFrame.url);
  }

  public isPaintingStable(): Promise<boolean> {
    return Promise.resolve(this.navigations.hasLoadStatus(LoadStatus.PaintingStable));
  }

  public isDomContentLoaded(): Promise<boolean> {
    return Promise.resolve(this.navigations.hasLoadStatus(LoadStatus.DomContentLoaded));
  }

  public isAllContentLoaded(): Promise<boolean> {
    return Promise.resolve(this.navigations.hasLoadStatus(LoadStatus.AllContentLoaded));
  }

  public async getCookies(): Promise<ICookie[]> {
    await this.waitForNavigationLoader();
    return await this.session.browserContext.getCookies(
      new URL(this.puppetFrame.securityOrigin ?? this.puppetFrame.url),
    );
  }

  public async setCookie(
    name: string,
    value: string,
    options?: ISetCookieOptions,
  ): Promise<boolean> {
    if (!this.navigations.top && this.puppetFrame.url === 'about:blank') {
      throw new Error(`Chrome won't allow you to set cookies on a blank tab.

Hero supports two options to set cookies:
a) Goto a url first and then set cookies on the activeTab
b) Use the UserProfile feature to set cookies for 1 or more domains before they're loaded (https://ulixee.org/docs/advanced/user-profile)
      `);
    }

    await this.waitForNavigationLoader();
    const url = this.navigations.currentUrl;
    await this.session.browserContext.addCookies([
      {
        name,
        value,
        url,
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
        url: this.puppetFrame.url,
      },
    ]);
    return true;
  }

  public async getChildFrameEnvironment(jsPath: IJsPath): Promise<IFrameMeta> {
    await this.waitForNavigationLoader();
    const nodeIdResult = await this.jsPath.exec<number>([...jsPath, [getNodeIdFnName]], null);
    if (!nodeIdResult.value) return null;

    const domId = nodeIdResult.value;

    for (const frame of this.childFrameEnvironments) {
      if (!frame.isAttached) continue;

      await frame.isReady;
      if (frame.domNodeId === domId) {
        return frame.toJSON();
      }
    }
  }

  public async runDomAssertions(
    id: string,
    assertions: IDomStateAssertionBatch['assertions'],
  ): Promise<number> {
    if (!this.installedDomAssertions.has(id)) {
      await this.runIsolatedFn('HERO.DomAssertions.install', id, assertions);
      this.installedDomAssertions.add(id);
    }
    try {
      const { failedIndices } = await this.runIsolatedFn<{ failedIndices: Record<number, any> }>(
        'HERO.DomAssertions.run',
        id,
      );
      return Object.keys(failedIndices).length;
    } catch (error) {
      if (error instanceof CanceledPromiseError) return 0;
      if (String(error).includes('This assertion batch has not been installed')) {
        this.installedDomAssertions.delete(id);
        return this.runDomAssertions(id, assertions);
      }
      return 1;
    }
  }

  public async clearDomAssertions(id: string): Promise<void> {
    if (this.installedDomAssertions.has(id)) {
      this.installedDomAssertions.delete(id);
      await this.runIsolatedFn('HERO.DomAssertions.clear', id);
    }
  }

  public async runPluginCommand(toPluginId: string, args: any[]): Promise<any> {
    const commandMeta = {
      puppetPage: this.tab.puppetPage,
      puppetFrame: this.puppetFrame,
    };
    return await this.session.plugins.onPluginCommand(toPluginId, commandMeta, args);
  }

  public waitForElement(jsPath: IJsPath, options?: IWaitForElementOptions): Promise<INodePointer> {
    return this.waitForDom(jsPath, options);
  }

  public async waitForLoad(status: ILoadStatus, options?: IWaitForOptions): Promise<INavigation> {
    await this.isReady;
    return this.navigationsObserver.waitForLoad(status, options);
  }

  public async waitForLocation(
    trigger: ILocationTrigger,
    options?: IWaitForOptions,
  ): Promise<IResourceMeta> {
    const timer = new Timer(options?.timeoutMs ?? 60e3, this.waitTimeouts);
    await timer.waitForPromise(
      this.navigationsObserver.waitForLocation(trigger, options),
      `Timeout waiting for location ${trigger}`,
    );

    const resourceId = await timer.waitForPromise(
      this.navigationsObserver.waitForNavigationResourceId(),
      `Timeout waiting for location ${trigger}`,
    );
    return this.session.resources.get(resourceId);
  }

  public async waitForNavigationLoader(timeoutMs?: number): Promise<void> {
    await this.puppetFrame.waitForLoader(undefined, timeoutMs);
  }

  // NOTE: don't add this function to commands. It will record extra commands when called from interactor, which
  // can break waitForLocation
  public async waitForDom(
    jsPath: IJsPath,
    options?: IWaitForElementOptions,
  ): Promise<INodePointer> {
    const timeoutMs = options?.timeoutMs ?? 30e3;
    const timeoutPerTry = timeoutMs < 1e3 ? timeoutMs : 1e3;
    const timeoutMessage = `Timeout waiting for element to be visible`;

    const timer = new Timer(timeoutMs, this.waitTimeouts);
    await timer.waitForPromise(
      this.waitForNavigationLoader(),
      'Timeout waiting for page to be ready',
    );
    options ??= {};

    try {
      while (!timer.isResolved()) {
        try {
          const containerOffset = await this.getContainerOffset();
          const promise = this.jsPath.waitForElement(
            jsPath,
            containerOffset,
            options,
            timeoutPerTry,
          );

          const result = await timer.waitForPromise(promise, timeoutMessage);
          const isNodeVisible = result.value;
          if (!isNodeVisible) continue;

          let isValid = isNodeVisible.nodeExists;

          if (options.waitForVisible) isValid = isNodeVisible.isVisible === true;
          else if (options.waitForHidden) isValid = isNodeVisible.isVisible === false;

          if (isValid) return result.nodePointer;
        } catch (err) {
          if (String(err).includes('not a valid selector')) throw err;
          // don't log during loop
        }

        timer.throwIfExpired(timeoutMessage);
      }
    } finally {
      timer.clear();
    }

    throw new TimeoutError(timeoutMessage);
  }

  public async flushPageEventsRecorder(): Promise<boolean> {
    try {
      // don't wait for env to be available
      if (!this.puppetFrame.canEvaluate(true)) return false;

      const results = await this.puppetFrame.evaluate<PageRecorderResultSet>(
        `window.flushPageRecorder()`,
        true,
      );
      return this.onPageRecorderEvents(results);
    } catch (error) {
      // no op if it fails
    }
    return false;
  }

  public onPageRecorderEvents(results: PageRecorderResultSet): boolean {
    const [domChanges, mouseEvents, focusEvents, scrollEvents, loadEvents] = results;
    const hasRecords = results.some(x => x.length > 0);
    if (!hasRecords) return false;

    const commands = this.session.commands;
    const tabId = this.tab.id;
    const frameId = this.id;

    this.logger.stats('FrameEnvironment.onPageEvents', {
      tabId,
      frameId,
      dom: domChanges.length,
      mouse: mouseEvents.length,
      focusEvents: focusEvents.length,
      scrollEvents: scrollEvents.length,
      loadEvents,
    });

    for (const [event, url, timestamp] of loadEvents) {
      const incomingStatus = domStateToLoadStatus[event];
      // only record the content paint
      if (incomingStatus === ContentPaint) {
        this.navigations.onLoadStatusChanged(incomingStatus, url, null, timestamp);
      }
    }

    if (domChanges.length) {
      this.emit('paint');
    }

    let lastCommand = commands.last;
    if (!lastCommand) return; // nothing to store yet

    let documentNavigation = this.navigations.get(this.lastDomChangeDocumentNavigationId);
    const db = this.session.db;

    const records: ITabEventParams['page-events']['records'] = {
      mouseEvents: [],
      focusEvents: [],
      scrollEvents: [],
      domChanges: [],
    };
    for (const domChange of domChanges) {
      const [action, nodeData, timestamp] = domChange;
      lastCommand = commands.getCommandForTimestamp(lastCommand, timestamp);
      if (timestamp > this.lastDomChangeTimestamp) this.lastDomChangeTimestamp = timestamp;

      if (action === DomActionType.newDocument || action === DomActionType.location) {
        const url = domChange[1].textContent;
        documentNavigation = this.navigations.findHistory(x => x.finalUrl === url);

        if (documentNavigation) {
          if (action === DomActionType.location && documentNavigation.initiatedTime < timestamp) {
            documentNavigation.initiatedTime = timestamp;
            // if we already have dom content loaded, update to the new timestamp
            if (documentNavigation.statusChanges.has('DomContentLoaded')) {
              documentNavigation.statusChanges.set('DomContentLoaded', timestamp);
              documentNavigation.statusChanges.set('AllContentLoaded', timestamp);
            }
          }
          if (
            action === DomActionType.newDocument &&
            documentNavigation.id > (this.lastDomChangeDocumentNavigationId ?? 0)
          ) {
            this.lastDomChangeDocumentNavigationId = documentNavigation.id;
          }
        }
      }

      // if this is a doctype, set into the navigation
      if (documentNavigation && action === DomActionType.added && nodeData.nodeType === 10) {
        documentNavigation.doctype = nodeData.textContent;
        db.frameNavigations.insert(documentNavigation);
      }

      const record = db.domChanges.insert(
        tabId,
        frameId,
        documentNavigation?.id,
        lastCommand.id,
        domChange,
      );
      records.domChanges.push(record);
    }

    for (const mouseEvent of mouseEvents) {
      lastCommand = commands.getCommandForTimestamp(lastCommand, mouseEvent[8]);
      const record = db.mouseEvents.insert(tabId, frameId, lastCommand.id, mouseEvent);
      records.mouseEvents.push(record);
    }

    for (const focusEvent of focusEvents) {
      lastCommand = commands.getCommandForTimestamp(lastCommand, focusEvent[3]);
      const record = db.focusEvents.insert(tabId, frameId, lastCommand.id, focusEvent);
      records.focusEvents.push(record);
    }

    for (const scrollEvent of scrollEvents) {
      lastCommand = commands.getCommandForTimestamp(lastCommand, scrollEvent[2]);
      const record = db.scrollEvents.insert(tabId, frameId, lastCommand.id, scrollEvent);
      records.scrollEvents.push(record);
    }
    this.tab.emit('page-events', { records, frame: this });
    return true;
  }

  /////// UTILITIES ////////////////////////////////////////////////////////////////////////////////////////////////////

  public toJSON(): IFrameMeta {
    return {
      id: this.id,
      parentFrameId: this.parentId,
      name: this.puppetFrame.name,
      tabId: this.tab.id,
      puppetId: this.devtoolsFrameId,
      url: this.navigations.currentUrl,
      securityOrigin: this.securityOrigin,
      sessionId: this.session.id,
      createdAtCommandId: this.createdAtCommandId,
    } as IFrameMeta;
  }

  public runIsolatedFn<T>(fnName: string, ...args: Serializable[]): Promise<T> {
    const callFn = `${fnName}(${args
      .map(x => {
        if (!x) return 'undefined';
        return JSON.stringify(x);
      })
      .join(', ')})`;
    return this.runFn<T>(fnName, callFn);
  }

  public async getDomNodeId(puppetNodeId: string): Promise<number> {
    const nodeId = await this.puppetFrame.evaluateOnNode<number>(
      puppetNodeId,
      'NodeTracker.watchNode(this)',
    );
    this.puppetNodeIdsByHeroNodeId[nodeId] = puppetNodeId;
    return nodeId;
  }

  public async getContainerOffset(): Promise<IPoint> {
    if (!this.parentId) return { x: 0, y: 0 };
    const parentOffset = await this.parentFrame.getContainerOffset();
    const frameElementNodeId = await this.puppetFrame.getFrameElementNodeId();
    const thisOffset = await this.puppetFrame.evaluateOnNode<IPoint>(
      frameElementNodeId,
      `(() => {
      const rect = this.getBoundingClientRect();
      return { x:rect.x, y:rect.y };
 })()`,
    );
    return {
      x: thisOffset.x + parentOffset.x,
      y: thisOffset.y + parentOffset.y,
    };
  }

  public async setFileInputFiles(
    jsPath: IJsPath,
    files: { name: string; data: Buffer }[],
  ): Promise<void> {
    const puppetNodeId = this.puppetNodeIdsByHeroNodeId[jsPath[0] as number];
    const tmpDir = await Fs.promises.mkdtemp(`${Os.tmpdir()}/sa-upload`);
    const filepaths: string[] = [];
    for (const file of files) {
      const fileName = `${tmpDir}/${file.name}`;
      filepaths.push(fileName);
      await Fs.promises.writeFile(fileName, file.data);
    }
    await this.puppetFrame.setFileInputFiles(puppetNodeId, filepaths);
    this.cleanPaths.push(tmpDir);
  }

  public addRemoteEventListener(
    type: string,
    emitFn: IRemoteEmitFn,
    jsPath?: IJsPath,
  ): Promise<{ listenerId: string }> {
    const details = this.session.commands.observeRemoteEvents(
      type,
      emitFn,
      jsPath,
      this.tab.id,
      this.id,
    );
    this.on(details.type as any, details.listenFn);
    return Promise.resolve({ listenerId: details.id });
  }

  public removeRemoteEventListener(listenerId: string): Promise<any> {
    const details = this.session.commands.getRemoteEventListener(listenerId);
    this.off(details.type as any, details.listenFn);
    return Promise.resolve();
  }

  protected async runFn<T>(fnName: string, serializedFn: string): Promise<T> {
    const result = await this.puppetFrame.evaluate<T>(serializedFn, true);

    if ((result as any)?.error) {
      this.logger.error(fnName, { result });
      throw new InjectedScriptError((result as any).error as string);
    } else {
      return result as T;
    }
  }

  protected async install(): Promise<void> {
    try {
      if (!this.isMainFrame) {
        const frameElementNodeId = await this.puppetFrame.getFrameElementNodeId();
        // retrieve the domNode containing this frame (note: valid id only in the containing frame)
        this.domNodeId = await this.getDomNodeId(frameElementNodeId);
      }
    } catch (error) {
      // This can happen if the node goes away. Still want to record frame
      this.logger.warn('FrameCreated.getDomNodeIdError', {
        error,
        frameId: this.id,
      });
    }
    this.record();
  }

  private listen(): void {
    const frame = this.puppetFrame;
    frame.on('frame-navigated', this.onFrameNavigated.bind(this), true);
    frame.on('frame-requested-navigation', this.onFrameRequestedNavigation.bind(this), true);
    frame.on('frame-lifecycle', this.onFrameLifecycle.bind(this), true);
  }

  private onFrameLifecycle(event: IPuppetFrameEvents['frame-lifecycle']): void {
    const lowerEventName = event.name.toLowerCase();
    let status: LoadStatus.AllContentLoaded | LoadStatus.DomContentLoaded;

    if (lowerEventName === 'load') status = LoadStatus.AllContentLoaded;
    else if (lowerEventName === 'domcontentloaded') status = LoadStatus.DomContentLoaded;

    if (status) {
      this.navigations.onLoadStatusChanged(
        status,
        event.loader.url ?? event.frame.url,
        event.loader.id,
        event.timestamp,
      );
    }
  }

  private onFrameNavigated(event: IPuppetFrameEvents['frame-navigated']): void {
    const { navigatedInDocument, frame } = event;
    if (navigatedInDocument) {
      this.logger.info('Page.navigatedWithinDocument', event);
      // set load state back to all loaded
      this.navigations.onNavigationRequested(
        'inPage',
        frame.url,
        this.tab.lastCommandId,
        event.loaderId,
      );
    } else {
      this.installedDomAssertions.clear();
    }
    this.puppetFrame = frame;
    this.record();
  }

  // client-side frame navigations (form posts/gets, redirects/ page reloads)
  private onFrameRequestedNavigation(
    event: IPuppetFrameEvents['frame-requested-navigation'],
  ): void {
    this.logger.info('Page.frameRequestedNavigation', event);
    // disposition options: currentTab, newTab, newWindow, download
    const { url, reason } = event;
    this.navigations.updateNavigationReason(url, reason);
  }

  private record(): void {
    this.session.db.frames.insert({
      ...this.toJSON(),
      domNodeId: this.domNodeId,
      parentId: this.parentId,
      devtoolsFrameId: this.devtoolsFrameId,
      startCommandId: this.createdAtCommandId,
      createdTimestamp: this.createdTime.getTime(),
    });
  }
}

const domStateToLoadStatus = {
  LargestContentfulPaint: ContentPaint,
  DOMContentLoaded: LoadStatus.DomContentLoaded,
  load: LoadStatus.AllContentLoaded,
};
