/**
 * Copyright 2018 Google Inc. All rights reserved.
 * Modifications copyright (c) Data Liberation Foundation Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import IRegisteredEventListener from '@ulixee/commons/interfaces/IRegisteredEventListener';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Timer from '@ulixee/commons/lib/Timer';
import { assert, createPromise } from '@ulixee/commons/lib/utils';
import { IJsPath } from '@ulixee/js-path';
import IDialog from '@ulixee/unblocked-specification/agent/browser/IDialog';
import IExecJsPathResult from '@ulixee/unblocked-specification/agent/browser/IExecJsPathResult';
import { IFrame } from '@ulixee/unblocked-specification/agent/browser/IFrame';
import INavigation from '@ulixee/unblocked-specification/agent/browser/INavigation';
import { IPage, IPageEvents } from '@ulixee/unblocked-specification/agent/browser/IPage';
import IScreenshotOptions from '@ulixee/unblocked-specification/agent/browser/IScreenshotOptions';
import { ILoadStatus, LoadStatus } from '@ulixee/unblocked-specification/agent/browser/Location';
import {
  IElementInteractVerification,
  IInteractionGroup,
  InteractionCommand,
} from '@ulixee/unblocked-specification/agent/interact/IInteractions';
import IResourceMeta from '@ulixee/unblocked-specification/agent/net/IResourceMeta';
import Protocol from 'devtools-protocol';
import * as Url from 'url';
import IWaitForOptions from '../interfaces/IWaitForOptions';
import BrowserContext from './BrowserContext';
import ConsoleMessage from './ConsoleMessage';
import DevtoolsSession from './DevtoolsSession';
import DomStorageTracker, { IDomStorageEvents } from './DomStorageTracker';
import Frame from './Frame';
import FramesManager from './FramesManager';
import { Keyboard } from './Keyboard';
import Mouse from './Mouse';
import NetworkManager from './NetworkManager';
import { Worker } from './Worker';
import FileChooserOpenedEvent = Protocol.Page.FileChooserOpenedEvent;
import JavascriptDialogClosedEvent = Protocol.Page.JavascriptDialogClosedEvent;
import JavascriptDialogOpeningEvent = Protocol.Page.JavascriptDialogOpeningEvent;
import Viewport = Protocol.Page.Viewport;
import WindowOpenEvent = Protocol.Page.WindowOpenEvent;
import ConsoleAPICalledEvent = Protocol.Runtime.ConsoleAPICalledEvent;
import ExceptionThrownEvent = Protocol.Runtime.ExceptionThrownEvent;
import TargetInfo = Protocol.Target.TargetInfo;

export interface IPageCreateOptions {
  groupName?: string;
  runPageScripts?: boolean;
  enableDomStorageTracker?: boolean;
  triggerPopupOnPageId?: string;
  installJsPathIntoDefaultContext?: boolean;
}

interface IPageLevelEvents extends IPageEvents, IDomStorageEvents {
  'dialog-closed': {
    wasConfirmed: boolean;
    userInput: string;
  };
}

export default class Page extends TypedEventEmitter<IPageLevelEvents> implements IPage {
  public keyboard: Keyboard;
  public mouse: Mouse;
  public workersById = new Map<string, Worker>();
  public browserContext: BrowserContext;
  public readonly opener: Page | null;
  public networkManager: NetworkManager;
  public framesManager: FramesManager;
  public domStorageTracker: DomStorageTracker;
  public groupName: string;
  public runPageScripts = true;

  public popupInitializeFn?: (
    page: Page,
    openParams: { url: string; windowName: string },
  ) => Promise<any>;

  public devtoolsSession: DevtoolsSession;
  public targetId: string;
  public isClosed = false;
  public readonly isReady: Promise<void>;
  public windowOpenParams: Protocol.Page.WindowOpenEvent;
  public installJsPathIntoIsolatedContext = true;

  // tabId is an assigned incremental id
  public readonly tabId: number;
  public activeDialog: IDialog;

  public get id(): string {
    return this.targetId;
  }

  public get mainFrame(): Frame {
    return this.framesManager.main;
  }

  public get frames(): Frame[] {
    return this.framesManager.activeFrames;
  }

  public get workers(): Worker[] {
    return [...this.workersById.values()];
  }

  public get lastActivityId(): number {
    return this.browserContext.commandMarker.lastId;
  }

  public readonly logger: IBoundLog;
  private isClosing = false;
  private closePromise = createPromise();
  private readonly events = new EventSubscriber();

  private waitTimeouts: { timeout: NodeJS.Timeout; reject: (reason?: any) => void }[] = [];

  constructor(
    devtoolsSession: DevtoolsSession,
    targetId: string,
    browserContext: BrowserContext,
    logger: IBoundLog,
    opener: Page | null,
    pageOptions?: IPageCreateOptions,
  ) {
    super();
    browserContext.idTracker.tabId += 1;
    this.tabId = browserContext.idTracker.tabId;
    this.opener = opener;
    this.targetId = targetId;
    this.browserContext = browserContext;
    this.devtoolsSession = devtoolsSession;
    this.installJsPathIntoIsolatedContext = pageOptions?.installJsPathIntoDefaultContext !== true;
    this.runPageScripts = pageOptions?.runPageScripts !== false;

    this.groupName = pageOptions?.groupName;
    this.logger = logger.createChild(module, {
      targetId,
    });
    this.logger.info('Page.created');
    this.keyboard = new Keyboard(devtoolsSession);
    this.mouse = new Mouse(devtoolsSession, this.keyboard);
    this.networkManager = new NetworkManager(
      devtoolsSession,
      this.logger,
      this.browserContext.proxy,
    );
    this.domStorageTracker = new DomStorageTracker(
      this,
      browserContext.domStorage,
      this.networkManager,
      this.logger,
      pageOptions?.enableDomStorageTracker ?? true,
    );
    this.framesManager = new FramesManager(this, devtoolsSession);

    this.storeEventsWithoutListeners = true;
    this.setEventsToLog(this.logger, [
      'frame-created',
      'websocket-frame',
      'websocket-handshake',
      'navigation-response',
      'worker',
    ]);

    this.framesManager.addEventEmitter(this, ['frame-created', 'frame-navigated']);
    this.domStorageTracker.addEventEmitter(this, ['dom-storage-updated']);
    this.networkManager.addEventEmitter(this, [
      'navigation-response',
      'websocket-frame',
      'websocket-handshake',
      'resource-will-be-requested',
      'resource-was-requested',
      'resource-loaded',
      'resource-failed',
    ]);

    const session = this.devtoolsSession;
    this.events.once(session, 'disconnected', this.emit.bind(this, 'close'));
    this.bindSessionEvents(session);

    const resources = this.browserContext.resources;
    // websocket events
    this.events.on(
      this.networkManager,
      'websocket-handshake',
      resources.onWebsocketHandshake.bind(resources, this.tabId),
    );
    this.events.on(this.networkManager, 'websocket-frame', this.onWebsocketFrame.bind(this));

    browserContext.trackPage(this);

    this.isReady = this.initialize().catch(error => {
      if (error instanceof CanceledPromiseError && this.isClosing) return;
      this.logger.error('Page.initializationError', {
        error,
      });
      throw error;
    });
  }

  async setNetworkRequestInterceptor(
    networkRequestsFn: (
      request: Protocol.Fetch.RequestPausedEvent,
    ) => Promise<Protocol.Fetch.FulfillRequestRequest>,
  ): Promise<void> {
    return await this.networkManager.setNetworkInterceptor(networkRequestsFn, true);
  }

  interact(...interactionGroups: IInteractionGroup[]): Promise<void> {
    return this.mainFrame.interact(...interactionGroups);
  }

  click(
    jsPathOrSelector: IJsPath | string,
    verification?: IElementInteractVerification,
  ): Promise<void> {
    return this.mainFrame.click(jsPathOrSelector, verification);
  }

  type(text: string): Promise<void> {
    return this.mainFrame.interact([{ command: 'type', keyboardCommands: [{ string: text }] }]);
  }

  addNewDocumentScript(
    script: string,
    isolatedEnvironment: boolean,
    devtoolsSession?: DevtoolsSession,
  ): Promise<{ identifier: string }> {
    return this.framesManager.addNewDocumentScript(script, isolatedEnvironment, devtoolsSession);
  }

  removeDocumentScript(identifier: string, devtoolsSession?: DevtoolsSession): Promise<void> {
    return (devtoolsSession ?? this.devtoolsSession).send(
      'Page.removeScriptToEvaluateOnNewDocument',
      { identifier },
    );
  }

  addPageCallback(
    name: string,
    onCallback?: (payload: string, frame: IFrame) => any,
    isolateFromWebPageEnvironment?: boolean,
    devtoolsSession?: DevtoolsSession,
  ): Promise<IRegisteredEventListener> {
    return this.framesManager.addPageCallback(
      name,
      (payload, frame) => {
        if (onCallback) onCallback(payload, frame);

        this.emit('page-callback-triggered', {
          name,
          payload,
          frameId: frame.frameId,
        });
      },
      isolateFromWebPageEnvironment,
      devtoolsSession,
    );
  }

  async setJavaScriptEnabled(enabled: boolean): Promise<void> {
    await this.devtoolsSession.send('Emulation.setScriptExecutionDisabled', {
      value: !enabled,
    });
  }

  evaluate<T>(expression: string, isolatedFromWebPageEnvironment = false): Promise<T> {
    return this.mainFrame.evaluate<T>(expression, isolatedFromWebPageEnvironment);
  }

  async navigate(url: string, options: { referrer?: string } = {}): Promise<{ loaderId: string }> {
    const navigationResponse = await this.devtoolsSession.send('Page.navigate', {
      url,
      referrer: options.referrer,
      frameId: this.mainFrame.id,
    });
    if (navigationResponse.errorText) throw new Error(navigationResponse.errorText);
    await this.framesManager.waitForFrame(navigationResponse, url, true);
    return { loaderId: navigationResponse.loaderId };
  }

  async goto(
    url: string,
    options?: { timeoutMs?: number; referrer?: string },
  ): Promise<IResourceMeta> {
    let formattedUrl: string;
    let navigateOptions = {};

    try {
      formattedUrl = Url.format(new Url.URL(url), { unicode: true });
    } catch (error) {
      throw new Error('Cannot navigate to an invalid URL');
    }
    this.browserContext.commandMarker.incrementMark?.('goto');

    const navigation = this.mainFrame.navigations.onNavigationRequested(
      'goto',
      formattedUrl,
      this.lastActivityId,
      null,
    );

    if (options?.timeoutMs) {
      this.browserContext.resources.setNavigationConnectTimeoutMs(formattedUrl, options.timeoutMs);
    }
    if (options?.referrer) {
      navigateOptions = {
        referrer: options?.referrer
      };
    }

    const timeoutMessage = `Timeout waiting for "tab.goto(${url})"`;

    const timer = new Timer(options?.timeoutMs ?? 30e3, this.waitTimeouts);
    const loader = await timer.waitForPromise(this.navigate(formattedUrl, navigateOptions), timeoutMessage);
    this.mainFrame.navigations.assignLoaderId(navigation, loader.loaderId);

    const resourceId = await timer.waitForPromise(
      this.mainFrame.navigationsObserver.waitForNavigationResourceId(),
      timeoutMessage,
    );
    return this.browserContext.resources.get(resourceId);
  }

  waitForLoad(status: ILoadStatus, options?: IWaitForOptions): Promise<INavigation> {
    return this.mainFrame.waitForLoad({ ...(options ?? {}), loadStatus: status });
  }

  execJsPath<T>(jsPath: IJsPath): Promise<IExecJsPathResult<T>> {
    return this.mainFrame.jsPath.exec(jsPath);
  }

  async goBack(options?: { timeoutMs?: number; waitForLoadStatus?: LoadStatus }): Promise<string> {
    this.mainFrame.navigations.initiatedUserAction = {
      reason: 'goBack',
      startCommandId: this.lastActivityId,
    };
    this.browserContext.commandMarker.incrementMark?.('goBack');
    await this.navigateToHistory(-1);
    if (this.mainFrame.isDefaultUrl) return this.mainFrame.url;

    await this.mainFrame.waitForLoad({
      loadStatus: options?.waitForLoadStatus ?? LoadStatus.PaintingStable,
      timeoutMs: options?.timeoutMs,
    });
    return this.mainFrame.url;
  }

  async goForward(options?: {
    timeoutMs?: number;
    waitForLoadStatus?: LoadStatus;
  }): Promise<string> {
    this.mainFrame.navigations.initiatedUserAction = {
      reason: 'goForward',
      startCommandId: this.lastActivityId,
    };
    this.browserContext.commandMarker.incrementMark?.('goForward');
    await this.navigateToHistory(1);
    if (this.mainFrame.isDefaultUrl) return this.mainFrame.url;

    await this.mainFrame.waitForLoad({
      loadStatus: options?.waitForLoadStatus ?? LoadStatus.PaintingStable,
      timeoutMs: options?.timeoutMs,
    });
    return this.mainFrame.url;
  }

  async reload(options?: { timeoutMs?: number }): Promise<IResourceMeta> {
    this.mainFrame.navigations.initiatedUserAction = {
      reason: 'reload',
      startCommandId: this.lastActivityId,
    };
    this.browserContext.commandMarker.incrementMark?.('reload');

    const timer = new Timer(options?.timeoutMs ?? 30e3, this.waitTimeouts);
    const timeoutMessage = `Timeout waiting for "tab.reload()"`;

    const loaderId = this.mainFrame.activeLoader.id;
    await timer.waitForPromise(this.devtoolsSession.send('Page.reload'), timeoutMessage);
    if (this.mainFrame.activeLoader.id === loaderId) {
      await timer.waitForPromise(
        this.mainFrame.waitOn('frame-navigated', null, options?.timeoutMs),
        timeoutMessage,
      );
    }
    const resource = await timer.waitForPromise(
      this.mainFrame.navigationsObserver.waitForNavigationResourceId(),
      timeoutMessage,
    );
    return this.browserContext.resources.get(resource);
  }

  async bringToFront(): Promise<void> {
    await this.devtoolsSession.send('Page.bringToFront');
  }

  async dismissDialog(accept: boolean, promptText?: string): Promise<void> {
    const resolvable = createPromise();
    this.mainFrame.interactor.play(
      [[{ command: InteractionCommand.willDismissDialog }]],
      resolvable,
    );
    await resolvable.promise;
    await this.devtoolsSession.send('Page.handleJavaScriptDialog', {
      accept,
      promptText,
    });
  }

  async screenshot(options: IScreenshotOptions): Promise<Buffer> {
    options ??= {};
    const quality = options.jpegQuality ?? 100;
    const clipRect = options.rectangle;
    const format = options.format ?? 'jpeg';
    assert(
      quality >= 0 && quality <= 100,
      `Expected options.quality to be between 0 and 100 (inclusive), got ${quality}`,
    );

    let clip: Viewport = clipRect;
    if (clip) {
      clip.x = Math.round(clip.x);
      clip.y = Math.round(clip.y);
      clip.height = Math.round(clip.height);
      clip.width = Math.round(clip.width);
    }

    const captureBeyondViewport = !!(clip || options.fullPage);

    if (options.fullPage) {
      const layoutMetrics = await this.devtoolsSession.send('Page.getLayoutMetrics');

      const { scale } = layoutMetrics.visualViewport;
      const contentSize = layoutMetrics.cssContentSize ?? layoutMetrics.contentSize;
      clip = { x: 0, y: 0, ...contentSize, scale };
    }

    const result = await this.devtoolsSession.send('Page.captureScreenshot', {
      format,
      quality,
      clip,
      captureBeyondViewport, // added in chrome 87 works since 89
    } as Protocol.Page.CaptureScreenshotRequest);

    const timestamp = Date.now();
    this.emit('screenshot', {
      imageBase64: result.data,
      timestamp,
    });

    return Buffer.from(result.data, 'base64');
  }

  onWorkerAttached(
    devtoolsSession: DevtoolsSession,
    targetInfo: TargetInfo,
  ): Promise<Error | void> {
    const targetId = targetInfo.targetId;

    this.browserContext.beforeWorkerAttached(devtoolsSession, targetId, this.targetId);

    const worker = new Worker(
      this.browserContext,
      this.networkManager,
      devtoolsSession,
      this.logger,
      targetInfo,
    );

    if (worker.type !== 'shared_worker') this.workersById.set(targetId, worker);
    this.browserContext.onWorkerAttached(worker);

    this.events.on(worker, 'console', this.emit.bind(this, 'console'));
    this.events.on(worker, 'page-error', this.emit.bind(this, 'page-error'));
    this.events.on(worker, 'close', () => this.workersById.delete(targetId));

    this.emit('worker', { worker });
    return worker.isReady;
  }

  async reset(): Promise<void> {
    if (this.isClosing || this.closePromise.isResolved) return this.closePromise.promise;
    if (this.devtoolsSession.isConnected()) return;
    this.mainFrame.navigations.reset();
    this.networkManager.reset();
    this.framesManager.reset();
    this.workersById.clear();
    this.domStorageTracker.reset();
    try {
      await this.navigate('about:blank');
      await this.mainFrame.waitForLifecycleEvent('load');
    } catch (error) {
      if (error instanceof CanceledPromiseError) return;
      throw error;
    }
  }

  async close(options?: { timeoutMs?: number }): Promise<void> {
    if (this.isClosing || this.closePromise.isResolved) return this.closePromise.promise;
    this.isClosing = true;
    const parentLogId = this.logger.stats('Page.Closing');
    options ??= {};
    const timeoutMs = options.timeoutMs ?? 30e3;
    try {
      const cancelMessage = 'Terminated command because Page closing';
      Timer.expireAll(this.waitTimeouts, new CanceledPromiseError(cancelMessage));

      if (this.devtoolsSession.isConnected() && !this.isClosed) {
        const timeout = setTimeout(() => this.didClose(), timeoutMs);
        // trigger beforeUnload
        try {
          await this.devtoolsSession.send('Page.close');
        } catch (err) {
          if (
            !err.message.includes('Not attached to an active page') &&
            !err.message.includes('Target closed') &&
            !(err instanceof CanceledPromiseError)
          ) {
            throw err;
          }
          this.didClose();
        }
        clearTimeout(timeout);
      } else {
        this.didClose();
      }
      await this.closePromise.promise;
    } finally {
      this.logger.stats('Page.Closed', { parentLogId });
    }
  }

  onTargetKilled(errorCode: number): void {
    this.emit('crashed', {
      error: new Error(`Page crashed - killed by Chrome with code ${errorCode}`),
      fatal: true,
    });
    this.didClose();
  }

  didClose(closeError?: Error): void {
    if (this.closePromise.isResolved) return;
    this.isClosing = true;
    this.isClosed = true;
    try {
      this.framesManager.close(closeError);
      this.networkManager.close();
      this.domStorageTracker.close();
      this.events.close();
      const cancelMessage = 'Terminated command because Page closing';
      Timer.expireAll(this.waitTimeouts, closeError ?? new CanceledPromiseError(cancelMessage));
      this.cancelPendingEvents(cancelMessage, ['close']);
      for (const worker of this.workersById.values()) {
        worker.close();
      }
      // clear memory
      this.cleanup();
    } catch (error) {
      this.logger.error('Page.didClose().error', {
        error,
      });
    } finally {
      this.closePromise.resolve();
      this.emit('close');
      this.removeAllListeners();
    }
  }

  bindSessionEvents(session: DevtoolsSession): void {
    const id = session.id;
    this.events.once(session, 'disconnected', () => this.events.endGroup(id));

    this.events.group(
      id,
      this.events.on(session, 'Inspector.targetCrashed', this.onTargetCrashed.bind(this)),
      this.events.on(session, 'Runtime.exceptionThrown', this.onRuntimeException.bind(this)),
      this.events.on(session, 'Runtime.consoleAPICalled', this.onRuntimeConsole.bind(this)),
      this.events.on(session, 'Target.attachedToTarget', this.onAttachedToTarget.bind(this)),
      this.events.on(
        session,
        'Page.javascriptDialogOpening',
        this.onJavascriptDialogOpening.bind(this),
      ),
      this.events.on(
        session,
        'Page.javascriptDialogClosed',
        this.onJavascriptDialogClosed.bind(this),
      ),

      this.events.on(session, 'Page.fileChooserOpened', this.onFileChooserOpened.bind(this)),
      this.events.on(session, 'Page.windowOpen', this.onWindowOpen.bind(this)),
      this.events.on(session, 'Page.screencastFrame', this.onScreencastFrame.bind(this)),
    );
  }

  private cleanup(): void {
    this.waitTimeouts.length = 0;
    this.workersById.clear();
    this.framesManager = null;
    this.networkManager = null;
    this.domStorageTracker = null;
    this.popupInitializeFn = null;
    this.browserContext = null;
  }

  private async navigateToHistory(delta: number): Promise<string> {
    const history = await this.devtoolsSession.send('Page.getNavigationHistory');
    const entry = history.entries[history.currentIndex + delta];
    if (!entry) return null;
    await Promise.all([
      this.devtoolsSession.send('Page.navigateToHistoryEntry', { entryId: entry.id }),
      this.mainFrame.waitOn('frame-navigated'),
    ]);
    return entry.url;
  }

  private async initialize(): Promise<void> {
    const promises = [
      this.networkManager.initialize().catch(err => err),
      this.framesManager.initialize(this.devtoolsSession).catch(err => err),
      this.domStorageTracker.initialize().catch(err => err),
      this.devtoolsSession
        .send('Target.setAutoAttach', {
          autoAttach: true,
          waitForDebuggerOnStart: true,
          flatten: true,
        })
        .catch(err => err),
      this.browserContext.initializePage(this).catch(err => err),
      this.devtoolsSession
        .send('Page.setInterceptFileChooserDialog', { enabled: true })
        .catch(err => err),
      this.devtoolsSession.send('Runtime.runIfWaitingForDebugger').catch(err => err),
    ];

    for (const error of await Promise.all(promises)) {
      if (error && error instanceof Error) throw error;
    }

    this.events.on(this.mainFrame, 'frame-navigated', this.onMainFrameNavigated.bind(this));

    if (this.opener && this.opener.popupInitializeFn) {
      this.logger.stats('Popup triggered', {
        targetId: this.targetId,
        opener: this.opener.targetId,
      });
      await this.opener.isReady;
      if (this.opener.isClosed) {
        this.logger.stats('Popup canceled', {
          targetId: this.targetId,
        });
        return;
      }
      if (this.mainFrame.isDefaultUrl) {
        // if we're on the default page, wait for a loader to be created before telling the page it's ready
        await this.mainFrame.waitOn('frame-loader-created', null, 2e3).catch(() => null);
        if (this.isClosed) return;
      }
      await this.opener.popupInitializeFn(this, this.opener.windowOpenParams);
      this.logger.stats('Popup initialized', {
        targetId: this.targetId,
        windowOpenParams: this.opener.windowOpenParams,
      });
    }
  }

  private onAttachedToTarget(event: Protocol.Target.AttachedToTargetEvent): Promise<any> {
    const { sessionId, targetInfo, waitingForDebugger } = event;

    const devtoolsSession = this.devtoolsSession.connection.getSession(sessionId);
    if (targetInfo.type === 'iframe') {
      this.browserContext.onIframeAttached(devtoolsSession, targetInfo, this.targetId);
      return this.framesManager.onFrameTargetAttached(devtoolsSession, targetInfo);
    }
    if (
      targetInfo.type === 'service_worker' ||
      targetInfo.type === 'shared_worker' ||
      targetInfo.type === 'worker'
    ) {
      return this.onWorkerAttached(devtoolsSession, targetInfo);
    }

    if (waitingForDebugger) {
      return devtoolsSession
        .send('Runtime.runIfWaitingForDebugger')
        .catch(error => {
          this.logger.error('Runtime.runIfWaitingForDebugger.Error', {
            error,
            devtoolsSessionId: sessionId,
          });
        })
        .then(() =>
          // detach from page session
          this.devtoolsSession.send('Target.detachFromTarget', { sessionId }),
        )
        .catch(() => null);
    }
  }

  private onRuntimeException(msg: ExceptionThrownEvent): void {
    const error = ConsoleMessage.exceptionToError(msg.exceptionDetails);
    const frame = this.framesManager.getFrameForExecutionContext(
      msg.exceptionDetails.executionContextId,
    );
    this.emit('page-error', { frameId: frame?.frameId, error });
  }

  private onRuntimeConsole(event: ConsoleAPICalledEvent): void {
    const message = ConsoleMessage.create(this.devtoolsSession, event);
    const frame = this.framesManager.getFrameForExecutionContext(event.executionContextId);

    this.emit('console', {
      frameId: frame?.frameId,
      ...message,
    });
  }

  private onTargetCrashed(): void {
    this.emit('crashed', { error: new Error('Target Crashed') });
  }

  private onWindowOpen(event: WindowOpenEvent): void {
    this.windowOpenParams = event;
  }

  private onJavascriptDialogOpening(dialog: JavascriptDialogOpeningEvent): void {
    this.activeDialog = dialog;
    this.emit('dialog-opening', { dialog });
  }

  private onJavascriptDialogClosed(event: JavascriptDialogClosedEvent): void {
    this.activeDialog = null;
    this.emit('dialog-closed', { wasConfirmed: event.result, userInput: event.userInput });
  }

  private onMainFrameNavigated(event: Frame['EventTypes']['frame-navigated']): void {
    if (event.navigatedInDocument) return;

    void this.devtoolsSession
      .send('Page.setInterceptFileChooserDialog', { enabled: true })
      .catch(() => null);
  }

  private onFileChooserOpened(event: FileChooserOpenedEvent): void {
    const frame = this.framesManager.framesById.get(event.frameId);
    frame
      .trackBackendNodeAsNodePointer(event.backendNodeId)
      .then(nodePointerId =>
        this.emit('filechooser', {
          prompt: {
            jsPath: [nodePointerId],
            frameId: frame.frameId,
            selectMultiple: event.mode === 'selectMultiple',
          },
        }),
      )
      .catch(() => null);
  }

  private onScreencastFrame(event: Protocol.Page.ScreencastFrameEvent): void {
    this.devtoolsSession
      .send('Page.screencastFrameAck', { sessionId: event.sessionId })
      .catch(() => null);

    this.emit('screenshot', {
      imageBase64: event.data,
      timestamp: event.metadata.timestamp * 1000,
    });
  }

  private onWebsocketFrame(event: IPageEvents['websocket-frame']): void {
    const resourceId = this.browserContext.resources.getBrowserRequestLatestResource(
      event.browserRequestId,
    )?.id;
    const isMitmEnabled = this.browserContext.resources.hasRegisteredMitm;
    this.browserContext.websocketMessages.record(
      {
        resourceId,
        message: event.message,
        isFromServer: event.isFromServer,
        lastCommandId: this.lastActivityId,
        timestamp: event.timestamp,
      },
      isMitmEnabled,
    );
  }
}
