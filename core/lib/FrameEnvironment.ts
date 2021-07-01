import Log from '@secret-agent/commons/Logger';
import { ILocationTrigger, IPipelineStatus } from '@secret-agent/interfaces/Location';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { ICookie } from '@secret-agent/interfaces/ICookie';
import { IInteractionGroups } from '@secret-agent/interfaces/IInteractions';
import { URL } from 'url';
import * as Fs from 'fs';
import Timer from '@secret-agent/commons/Timer';
import { createPromise } from '@secret-agent/commons/utils';
import IWaitForElementOptions from '@secret-agent/interfaces/IWaitForElementOptions';
import IExecJsPathResult from '@secret-agent/interfaces/IExecJsPathResult';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import { IPuppetFrame, IPuppetFrameEvents } from '@secret-agent/interfaces/IPuppetFrame';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import ISetCookieOptions from '@secret-agent/interfaces/ISetCookieOptions';
import { IBoundLog } from '@secret-agent/interfaces/ILog';
import INodePointer from 'awaited-dom/base/INodePointer';
import IWaitForOptions from '@secret-agent/interfaces/IWaitForOptions';
import IFrameMeta from '@secret-agent/interfaces/IFrameMeta';
import { LoadStatus } from '@secret-agent/interfaces/INavigation';
import { getNodeIdFnName } from '@secret-agent/interfaces/jsPathFnNames';
import IJsPathResult from '@secret-agent/interfaces/IJsPathResult';
import TypeSerializer from '@secret-agent/commons/TypeSerializer';
import * as Os from 'os';
import ICommandMeta from '@secret-agent/interfaces/ICommandMeta';
import IPoint from '@secret-agent/interfaces/IPoint';
import SessionState from './SessionState';
import TabNavigationObserver from './FrameNavigationsObserver';
import Session from './Session';
import Tab from './Tab';
import Interactor from './Interactor';
import CommandRecorder from './CommandRecorder';
import FrameNavigations from './FrameNavigations';
import { Serializable } from '../interfaces/ISerializable';
import InjectedScriptError from './InjectedScriptError';
import { IJsPathHistory, JsPath } from './JsPath';
import InjectedScripts from './InjectedScripts';
import { PageRecorderResultSet } from '../injected-scripts/pageEventsRecorder';

const { log } = Log(module);

export default class FrameEnvironment {
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
    return this.puppetFrame.isAttached();
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
  protected readonly logger: IBoundLog;

  private puppetNodeIdsBySaNodeId: Record<number, string> = {};
  private prefetchedJsPaths: IJsPathResult[];
  private readonly isDetached: boolean;
  private readonly interactor: Interactor;
  private isClosing = false;
  private waitTimeouts: { timeout: NodeJS.Timeout; reject: (reason?: any) => void }[] = [];
  private readonly commandRecorder: CommandRecorder;
  private readonly cleanPaths: string[] = [];

  public get url(): string {
    return this.navigations.currentUrl;
  }

  private get sessionState(): SessionState {
    return this.session.sessionState;
  }

  constructor(tab: Tab, frame: IPuppetFrame) {
    this.puppetFrame = frame;
    this.tab = tab;
    this.createdTime = new Date();
    this.id = tab.session.nextFrameId();
    this.logger = log.createChild(module, {
      tabId: tab.id,
      sessionId: tab.session.id,
      frameId: this.id,
    });
    this.jsPath = new JsPath(this, tab.isDetached);
    this.isDetached = tab.isDetached;
    this.createdAtCommandId = this.sessionState.lastCommand?.id;
    this.navigations = new FrameNavigations(this.id, tab.sessionState);
    this.navigationsObserver = new TabNavigationObserver(this.navigations);
    this.interactor = new Interactor(this);

    // give tab time to setup
    process.nextTick(() => this.listen());
    this.commandRecorder = new CommandRecorder(this, tab.session, tab.id, this.id, [
      this.createRequest,
      this.execJsPath,
      this.fetch,
      this.getChildFrameEnvironment,
      this.getCookies,
      this.getJsValue,
      this.getLocationHref,
      this.interact,
      this.removeCookie,
      this.setCookie,
      this.setFileInputFiles,
      this.waitForElement,
      this.waitForLoad,
      this.waitForLocation,
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

  /////// COMMANDS /////////////////////////////////////////////////////////////////////////////////////////////////////

  public async interact(...interactionGroups: IInteractionGroups): Promise<void> {
    if (this.isDetached) {
      throw new Error("Sorry, you can't interact with a detached frame");
    }
    await this.navigationsObserver.waitForReady();
    const interactionResolvable = createPromise<void>(120e3);
    this.waitTimeouts.push({
      timeout: interactionResolvable.timeout,
      reject: interactionResolvable.reject,
    });

    const cancelForNavigation = new CanceledPromiseError('Frame navigated');
    const cancelOnNavigate = () => {
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

  public async execJsPath<T>(jsPath: IJsPath): Promise<IExecJsPathResult<T>> {
    // if nothing loaded yet, return immediately
    if (!this.navigations.top) return null;
    await this.navigationsObserver.waitForReady();
    const containerOffset = await this.getContainerOffset();
    return await this.jsPath.exec(jsPath, containerOffset);
  }

  public async prefetchExecJsPaths(jsPaths: IJsPathHistory[]): Promise<IJsPathResult[]> {
    const containerOffset = await this.getContainerOffset();
    this.prefetchedJsPaths = await this.jsPath.runJsPaths(jsPaths, containerOffset);
    return this.prefetchedJsPaths;
  }

  public recordDetachedJsPath(index: number, runStartDate: number, endDate: number): void {
    const entry = this.prefetchedJsPaths[index];

    const commandMeta = <ICommandMeta>{
      name: 'execJsPath',
      args: TypeSerializer.stringify([entry.jsPath]),
      id: this.sessionState.commands.length + 1,
      wasPrefetched: true,
      tabId: this.tab.id,
      frameId: this.id,
      result: entry.result,
      runStartDate,
      endDate,
    };
    if (this.sessionState.nextCommandMeta) {
      const { commandId, sendDate, startDate: clientStartDate } = this.sessionState.nextCommandMeta;
      this.sessionState.nextCommandMeta = null;
      commandMeta.id = commandId;
      commandMeta.clientSendDate = sendDate?.getTime();
      commandMeta.clientStartDate = clientStartDate?.getTime();
    }

    // only need to record start
    this.sessionState.recordCommandStart(commandMeta);
  }

  public async createRequest(input: string | number, init?: IRequestInit): Promise<INodePointer> {
    if (!this.navigations.top && !this.url) {
      throw new Error(
        'You need to use a "goto" before attempting to fetch. The in-browser fetch needs an origin to function properly.',
      );
    }
    await this.navigationsObserver.waitForReady();
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
    await this.navigationsObserver.waitForReady();
    return this.runIsolatedFn(
      `${InjectedScripts.Fetcher}.fetch`,
      input,
      // @ts-ignore
      init,
    );
  }

  public getLocationHref(): Promise<string> {
    return Promise.resolve(this.navigations.currentUrl || this.puppetFrame.url);
  }

  public async getCookies(): Promise<ICookie[]> {
    await this.navigationsObserver.waitForReady();
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

SecretAgent supports two options to set cookies:
a) Goto a url first and then set cookies on the activeTab
b) Use the UserProfile feature to set cookies for 1 or more domains before they're loaded (https://secretagent.dev/docs/advanced/user-profile)
      `);
    }

    await this.navigationsObserver.waitForReady();
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
    await this.navigationsObserver.waitForReady();
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

  public waitForElement(jsPath: IJsPath, options?: IWaitForElementOptions): Promise<boolean> {
    return this.waitForDom(jsPath, options);
  }

  public waitForLoad(status: IPipelineStatus, options?: IWaitForOptions): Promise<void> {
    return this.navigationsObserver.waitForLoad(status, options);
  }

  public waitForLocation(trigger: ILocationTrigger, options?: IWaitForOptions): Promise<void> {
    return this.navigationsObserver.waitForLocation(trigger, options);
  }

  // NOTE: don't add this function to commands. It will record extra commands when called from interactor, which
  // can break waitForLocation
  public async waitForDom(jsPath: IJsPath, options?: IWaitForElementOptions): Promise<boolean> {
    const waitForVisible = options?.waitForVisible ?? false;
    const timeoutMs = options?.timeoutMs ?? 30e3;
    const timeoutPerTry = timeoutMs < 1e3 ? timeoutMs : 1e3;
    const timeoutMessage = `Timeout waiting for element to be visible`;

    const timer = new Timer(timeoutMs, this.waitTimeouts);
    await timer.waitForPromise(
      this.navigationsObserver.waitForReady(),
      'Timeout waiting for DomContentLoaded',
    );

    try {
      while (!timer.isResolved()) {
        try {
          const containerOffset = await this.getContainerOffset();
          const promise = this.jsPath.waitForElement(
            jsPath,
            containerOffset,
            waitForVisible,
            timeoutPerTry,
          );

          const isNodeVisible = await timer.waitForPromise(promise, timeoutMessage);
          let isValid = isNodeVisible.value?.isVisible;
          if (!waitForVisible) isValid = isNodeVisible.value?.nodeExists;
          if (isValid) return true;
        } catch (err) {
          // don't log during loop
        }

        timer.throwIfExpired(timeoutMessage);
      }
    } finally {
      timer.clear();
    }
    return false;
  }

  public moveMouseToStartLocation(): Promise<void> {
    if (this.isDetached) return;
    return this.interactor.initialize();
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
    this.logger.stats('FrameEnvironment.onPageEvents', {
      tabId: this.id,
      dom: domChanges.length,
      mouse: mouseEvents.length,
      focusEvents: focusEvents.length,
      scrollEvents: scrollEvents.length,
      loadEvents,
    });

    for (const [event, url, timestamp] of loadEvents) {
      const incomingStatus = pageStateToLoadStatus[event];

      this.navigations.onLoadStateChanged(incomingStatus, url, null, new Date(timestamp));
    }

    this.sessionState.captureDomEvents(
      this.tab.id,
      this.id,
      domChanges,
      mouseEvents,
      focusEvents,
      scrollEvents,
    );
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
    this.puppetNodeIdsBySaNodeId[nodeId] = puppetNodeId;
    return nodeId;
  }

  public async getContainerOffset(): Promise<IPoint> {
    if (!this.parentId) return { x: 0, y: 0 };
    const parentOffset = await this.parentFrame.getContainerOffset();
    const frameElementNodeId = await this.puppetFrame.getFrameElementNodeId();
    const thisOffset = await this.puppetFrame.evaluateOnNode<IPoint>(
      frameElementNodeId,
      `(() => {
      const rect = this.getBoundingClientRect().toJSON();
      return { x:rect.x, y:rect.y};
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
    const puppetNodeId = this.puppetNodeIdsBySaNodeId[jsPath[0] as number];
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
      if (this.isMainFrame) {
        // only install interactor on the main frame
        await this.interactor?.initialize();
      } else {
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
    this.sessionState.captureFrameDetails(this);
  }

  private listen(): void {
    const frame = this.puppetFrame;
    frame.on('frame-navigated', this.onFrameNavigated.bind(this), true);
    frame.on('frame-requested-navigation', this.onFrameRequestedNavigation.bind(this), true);
    frame.on('frame-lifecycle', this.onFrameLifecycle.bind(this), true);
  }

  private onFrameLifecycle(event: IPuppetFrameEvents['frame-lifecycle']): void {
    const lowerEventName = event.name.toLowerCase();
    let status: LoadStatus.Load | LoadStatus.DomContentLoaded;

    if (lowerEventName === 'load') status = LoadStatus.Load;
    else if (lowerEventName === 'domcontentloaded') status = LoadStatus.DomContentLoaded;

    if (status) {
      this.navigations.onLoadStateChanged(status, event.frame.url, event.loaderId);
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
    }
    this.sessionState.captureFrameDetails(this);
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
}

const pageStateToLoadStatus = {
  LargestContentfulPaint: LoadStatus.ContentPaint,
  DOMContentLoaded: LoadStatus.DomContentLoaded,
  load: LoadStatus.Load,
};
