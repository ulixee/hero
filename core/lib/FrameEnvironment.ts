import Log from '@secret-agent/commons/Logger';
import { ILocationTrigger, IPipelineStatus } from '@secret-agent/interfaces/Location';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { ICookie } from '@secret-agent/interfaces/ICookie';
import { IInteractionGroups } from '@secret-agent/interfaces/IInteractions';
import { URL } from 'url';
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
import { ILoadEvent } from '@secret-agent/interfaces/ILoadEvent';
import { LoadStatus } from '@secret-agent/interfaces/INavigation';
import { INodeVisibility } from '@secret-agent/interfaces/INodeVisibility';
import SessionState from './SessionState';
import TabNavigationObserver from './FrameNavigationsObserver';
import Session from './Session';
import Tab from './Tab';
import Interactor from './Interactor';
import CommandRecorder from './CommandRecorder';
import FrameNavigations from './FrameNavigations';
import { Serializable } from '../interfaces/ISerializable';
import InjectedScriptError from './InjectedScriptError';
import { JsPath } from './JsPath';
import InjectedScripts from './InjectedScripts';

export const SA_NOT_INSTALLED = 'SA_SCRIPT_NOT_INSTALLED';

const { log } = Log(module);

export default class FrameEnvironment {
  public get id(): string {
    return this.puppetFrame.id;
  }

  public get session(): Session {
    return this.tab.session;
  }

  public get parentFrameId(): string {
    return this.puppetFrame.parentId;
  }

  public get isAttached(): boolean {
    return this.puppetFrame.isAttached();
  }

  public get securityOrigin(): string {
    return this.puppetFrame.securityOrigin;
  }

  public get childFrameEnvironments(): FrameEnvironment[] {
    return [...this.tab.frameEnvironmentsById.values()].filter(
      x => x.parentFrameId === this.id && this.isAttached,
    );
  }

  public get isMainFrame(): boolean {
    return !this.parentFrameId;
  }

  public readonly navigationsObserver: TabNavigationObserver;
  public readonly navigations: FrameNavigations;
  public readonly tab: Tab;
  public puppetFrame: IPuppetFrame;
  public isReady: Promise<Error | void>;

  public domNodeId: number;
  protected readonly logger: IBoundLog;
  private readonly interactor: Interactor;
  private isClosing = false;
  private readonly createdAtCommandId: number;
  private waitTimeouts: { timeout: NodeJS.Timeout; reject: (reason?: any) => void }[] = [];
  private readonly commandRecorder: CommandRecorder;

  public get url(): string {
    return this.navigations.currentUrl;
  }

  private get sessionState(): SessionState {
    return this.session.sessionState;
  }

  constructor(tab: Tab, frame: IPuppetFrame) {
    this.puppetFrame = frame;
    this.tab = tab;
    this.logger = log.createChild(module, {
      tabId: tab.id,
      sessionId: tab.session.id,
      frameId: this.id,
    });
    this.createdAtCommandId = this.sessionState.lastCommand?.id;
    this.navigations = new FrameNavigations(frame.id, tab.sessionState);
    this.navigationsObserver = new TabNavigationObserver(this.navigations);
    this.interactor = new Interactor(this);

    this.listen();
    this.commandRecorder = new CommandRecorder(this, this.tab, this.id, [
      this.createRequest,
      this.execJsPath,
      this.fetch,
      this.getChildFrameEnvironment,
      this.getCookies,
      this.getJsValue,
      this.getLocationHref,
      this.interact,
      this.getComputedVisibility,
      this.removeCookie,
      this.setCookie,
      this.waitForElement,
      this.waitForLoad,
      this.waitForLocation,
      // DO NOT ADD waitForReady
    ]);
    // don't let this explode
    this.isReady = this.install().catch(err => err);
  }

  public isAllowedCommand(method: string): boolean {
    return this.commandRecorder.fnNames.has(method) || method === 'close';
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
    } catch (error) {
      if (!error.message.includes('Target closed') && !(error instanceof CanceledPromiseError)) {
        this.logger.error('FrameEnvironment.ClosingError', { error, parentLogId });
      }
    }
  }

  /////// COMMANDS /////////////////////////////////////////////////////////////////////////////////////////////////////

  public async interact(...interactionGroups: IInteractionGroups): Promise<void> {
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
    return await new JsPath(this, jsPath).exec();
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

  public async getComputedVisibility(jsPath: IJsPath): Promise<INodeVisibility> {
    const isVisible = await new JsPath(this, jsPath).getComputedVisibility();
    return isVisible.value;
  }

  public async getChildFrameEnvironment(jsPath: IJsPath): Promise<IFrameMeta> {
    await this.navigationsObserver.waitForReady();
    const nodeIdResult = await new JsPath(this, jsPath).getNodeId();
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
          const promise = new JsPath(this, jsPath).waitForElement(waitForVisible, timeoutPerTry);

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
    return this.interactor.initialize();
  }

  public onDomRecorderLoadEvents(loadEvents: ILoadEvent[]): void {
    for (const loadEvent of loadEvents) {
      const [event, url, timestamp] = loadEvent;

      const incomingStatus = pageStateToLoadStatus[event];

      this.navigations.onLoadStateChanged(incomingStatus, url, null, new Date(timestamp));
    }
  }

  /////// UTILITIES ////////////////////////////////////////////////////////////////////////////////////////////////////

  public toJSON(): IFrameMeta {
    return {
      id: this.id,
      name: this.puppetFrame.name,
      tabId: this.tab.id,
      parentFrameId: this.parentFrameId,
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
        await this.interactor.initialize();
      } else {
        // retrieve the domNode containing this frame (note: valid id only in the containing frame)
        this.domNodeId = await this.puppetFrame.evaluateOnIsolatedFrameElement<number>(
          'NodeTracker.watchNode(this)',
        );
      }
    } catch (error) {
      // This can happen if the node goes away. Still want to record frame
      this.logger.warn('FrameCreated.getDomNodeIdError', {
        error,
        frameId: this.id,
      });
    }
    this.sessionState.captureFrameCreated(this.tab.id, this.puppetFrame, this.domNodeId);
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
    this.sessionState.updateFrameSecurityOrigin(this.tab.id, frame);
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
