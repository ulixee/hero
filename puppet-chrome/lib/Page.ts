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
import Protocol from 'devtools-protocol';
import { IPuppetPage, IPuppetPageEvents } from '@secret-agent/puppet-interfaces/IPuppetPage';
import * as eventUtils from '@secret-agent/commons/eventUtils';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import IRegisteredEventListener from '@secret-agent/core-interfaces/IRegisteredEventListener';
import { assert, createPromise } from '@secret-agent/commons/utils';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import IViewport from '@secret-agent/core-interfaces/IViewport';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import IRect from '@secret-agent/core-interfaces/IRect';
import { IPuppetWorker } from '@secret-agent/puppet-interfaces/IPuppetWorker';
import { CDPSession } from './CDPSession';
import { NetworkManager } from './NetworkManager';
import { Keyboard } from './Keyboard';
import Mouse from './Mouse';
import FramesManager from './FramesManager';
import { BrowserContext } from './BrowserContext';
import { Worker } from './Worker';
import ConsoleMessage from './ConsoleMessage';
import Frame from './Frame';
import ConsoleAPICalledEvent = Protocol.Runtime.ConsoleAPICalledEvent;
import ExceptionThrownEvent = Protocol.Runtime.ExceptionThrownEvent;
import WindowOpenEvent = Protocol.Page.WindowOpenEvent;
import TargetInfo = Protocol.Target.TargetInfo;

export class Page extends TypedEventEmitter<IPuppetPageEvents> implements IPuppetPage {
  public keyboard: Keyboard;
  public mouse: Mouse;
  public workersById = new Map<string, Worker>();
  public readonly browserContext: BrowserContext;
  public readonly opener: Page | null;
  public networkManager: NetworkManager;
  public framesManager: FramesManager;

  public popupInitializeFn?: (
    page: IPuppetPage,
    openParams: { url: string; windowName: string },
  ) => Promise<void>;

  public workerInitializeFn?: (worker: IPuppetWorker) => Promise<void>;

  public cdpSession: CDPSession;
  public targetId: string;
  public isClosed = false;
  public readonly isReady: Promise<void>;
  public windowOpenParams: Protocol.Page.WindowOpenEvent;

  public get id(): string {
    return this.targetId;
  }

  public get devtoolsSessionId(): string {
    return this.cdpSession.id;
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

  protected readonly logger: IBoundLog;
  private closePromise = createPromise();
  private readonly registeredEvents: IRegisteredEventListener[];

  constructor(
    cdpSession: CDPSession,
    targetId: string,
    browserContext: BrowserContext,
    logger: IBoundLog,
    opener: Page | null,
  ) {
    super();

    this.logger = logger.createChild(module, {
      targetId,
    });
    this.logger.info('Page.created');
    this.storeEventsWithoutListeners = true;
    this.cdpSession = cdpSession;
    this.targetId = targetId;
    this.browserContext = browserContext;
    this.keyboard = new Keyboard(cdpSession);
    this.mouse = new Mouse(cdpSession, this.keyboard);
    this.networkManager = new NetworkManager(cdpSession, this.logger);
    this.framesManager = new FramesManager(cdpSession, this.logger);
    this.opener = opener;

    this.setEventsToLog([
      'frame-created',
      'frame-navigated',
      'frame-lifecycle',
      'frame-requested-navigation',
      'websocket-frame',
      'websocket-handshake',
      'navigation-response',
      'worker',
    ]);

    for (const event of ['frame-created', 'frame-navigated', 'frame-lifecycle'] as const) {
      this.framesManager.on(event, this.emit.bind(this, event));
    }
    for (const event of [
      'navigation-response',
      'websocket-frame',
      'websocket-handshake',
      'resource-will-be-requested',
      'resource-was-requested',
      'resource-loaded',
      'resource-failed',
    ] as const) {
      this.networkManager.on(event, this.emit.bind(this, event));
    }

    this.cdpSession.once('disconnected', this.emit.bind(this, 'close'));

    this.registeredEvents = eventUtils.addEventListeners(this.cdpSession, [
      ['Inspector.targetCrashed', this.onTargetCrashed.bind(this)],
      ['Runtime.exceptionThrown', this.onRuntimeException.bind(this)],
      ['Runtime.consoleAPICalled', this.onRuntimeConsole.bind(this)],
      ['Target.attachedToTarget', this.onAttachedToTarget.bind(this)],
      ['Page.windowOpen', this.onWindowOpen.bind(this)],
    ]);

    this.isReady = this.initialize().catch(error => {
      this.logger.error('Page.initializationError', {
        error,
      });
      throw error;
    });
  }

  addNewDocumentScript(script: string, isolatedEnvironment: boolean): Promise<void> {
    return this.framesManager.addNewDocumentScript(script, isolatedEnvironment);
  }

  addPageCallback(
    name: string,
    onCallback: (payload: any, frameId: string) => any,
  ): Promise<IRegisteredEventListener> {
    return this.framesManager.addPageCallback(name, onCallback);
  }

  public async getIndexedDbDatabaseNames(): Promise<
    { frameId: string; origin: string; databases: string[] }[]
  > {
    const dbs: { frameId: string; origin: string; databases: string[] }[] = [];
    for (const { origin, frameId } of this.framesManager.getSecurityOrigins()) {
      const { databaseNames } = await this.cdpSession.send('IndexedDB.requestDatabaseNames', {
        securityOrigin: origin,
      });
      dbs.push({ origin, frameId, databases: databaseNames });
    }
    return dbs;
  }

  async setJavaScriptEnabled(enabled: boolean): Promise<void> {
    await this.cdpSession.send('Emulation.setScriptExecutionDisabled', {
      value: !enabled,
    });
  }

  evaluate<T>(expression: string): Promise<T> {
    return this.mainFrame.evaluate<T>(expression, false);
  }

  async navigate(url: string, options: { referrer?: string } = {}): Promise<void> {
    const navigationResponse = await this.cdpSession.send('Page.navigate', {
      url,
      referrer: options.referrer,
      frameId: this.mainFrame.id,
    });
    if (navigationResponse.errorText) throw new Error(navigationResponse.errorText);
    return this.framesManager.waitForFrame(navigationResponse, url, true);
  }

  goBack(): Promise<void> {
    return this.navigateToHistory(-1);
  }

  goForward(): Promise<void> {
    return this.navigateToHistory(+1);
  }

  reload(): Promise<void> {
    return this.cdpSession.send('Page.reload');
  }

  async bringToFront(): Promise<void> {
    await this.cdpSession.send('Page.bringToFront');
  }

  async screenshot(
    format: 'jpeg' | 'png' = 'jpeg',
    clipRect?: IRect & { scale: number },
    quality = 100,
  ): Promise<Buffer> {
    assert(
      quality >= 0 && quality <= 100,
      `Expected options.quality to be between 0 and 100 (inclusive), got ${quality}`,
    );
    await this.cdpSession.send('Target.activateTarget', {
      targetId: this.targetId,
    });

    const clip: Protocol.Page.Viewport = clipRect;

    if (clip) {
      clip.x = Math.round(clip.x);
      clip.y = Math.round(clip.y);
      clip.width = Math.round(clip.width);
      clip.height = Math.round(clip.height);
    }
    const result = await this.cdpSession.send('Page.captureScreenshot', {
      format,
      quality,
      clip,
      captureBeyondViewport: true, // added in chrome 87
    } as Protocol.Page.CaptureScreenshotRequest);

    return Buffer.from(result.data, 'base64');
  }

  onWorkerAttached(cdpSession: CDPSession, targetInfo: TargetInfo): Promise<Error | void> {
    const targetId = targetInfo.targetId;

    this.browserContext.beforeWorkerAttached(cdpSession, targetId, this.targetId);
    const worker = new Worker(
      this.browserContext,
      this.networkManager,
      cdpSession,
      this.workerInitializeFn,
      this.logger,
      targetInfo,
    );
    if (worker.type !== 'shared_worker') this.workersById.set(targetId, worker);
    this.browserContext.onWorkerAttached(worker);

    worker.on('console', this.emit.bind(this, 'console'));
    worker.on('page-error', this.emit.bind(this, 'page-error'));
    worker.on('close', () => this.workersById.delete(targetId));

    this.emit('worker', { worker });
    return worker.isReady;
  }

  async close(): Promise<void> {
    if (this.cdpSession.isConnected() && !this.isClosed) {
      // trigger beforeUnload
      try {
        await this.cdpSession.send('Page.close');
      } catch (err) {
        if (!err.message.includes('Target closed') && !(err instanceof CanceledPromiseError)) {
          throw err;
        }
      }
    }
    return this.closePromise.promise;
  }

  onTargetKilled(errorCode: number): void {
    this.emit('crashed', {
      error: new Error(`Page crashed - killed by Chrome with code ${errorCode}`),
      fatal: true,
    });
    this.didClose();
  }

  didClose(closeError?: Error): void {
    this.isClosed = true;
    this.framesManager.close(closeError);
    this.networkManager.close();
    eventUtils.removeEventListeners(this.registeredEvents);
    this.cancelPendingEvents('Page closed', ['close']);
    Promise.all([...this.workersById.values()].map(x => x.close()))
      .finally(() => this.closePromise.resolve())
      .catch(error => {
        this.logger.error('Page.closeWorkersError', {
          error,
        });
      });
  }

  async updateEmulationSettings(): Promise<void> {
    await Promise.all([
      this.networkManager.setUserAgentOverrides(this.browserContext.emulation),
      this.setTimezone(this.browserContext.emulation.timezoneId),
      this.setLocale(this.browserContext.emulation.locale),
      this.setScreensize(this.browserContext.emulation.viewport),
    ]);
  }

  private async navigateToHistory(delta: number): Promise<void> {
    const history = await this.cdpSession.send('Page.getNavigationHistory');
    const entry = history.entries[history.currentIndex + delta];
    if (!entry) return null;
    await Promise.all([
      this.cdpSession.send('Page.navigateToHistoryEntry', { entryId: entry.id }),
      this.mainFrame.waitOn('frame-navigated'),
    ]);
  }

  private async initialize(): Promise<void> {
    const errors = await Promise.all([
      this.updateEmulationSettings().catch(err => err),
      this.networkManager.initialize().catch(err => err),
      this.framesManager.initialize().catch(err => err),
      this.cdpSession
        .send('Target.setAutoAttach', {
          autoAttach: true,
          waitForDebuggerOnStart: true,
          flatten: true,
        })
        .catch(err => err),
      this.cdpSession
        .send('Emulation.setFocusEmulationEnabled', { enabled: true })
        .catch(err => err),
    ]);

    for (const error of errors) {
      if (error && error instanceof Error) throw error;
    }

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
      await this.opener.popupInitializeFn(this, this.opener.windowOpenParams);
      this.logger.stats('Popup initialized', {
        targetId: this.targetId,
        windowOpenParams: this.opener.windowOpenParams,
      });
    }

    await this.cdpSession.send('Runtime.runIfWaitingForDebugger');
  }

  private onAttachedToTarget(event: Protocol.Target.AttachedToTargetEvent): Promise<any> {
    const { sessionId, targetInfo, waitingForDebugger } = event;

    const cdpSession = this.cdpSession.connection.getSession(sessionId);
    if (
      targetInfo.type === 'service_worker' ||
      targetInfo.type === 'shared_worker' ||
      targetInfo.type === 'worker'
    ) {
      return this.onWorkerAttached(cdpSession, targetInfo);
    }

    if (waitingForDebugger) {
      return cdpSession
        .send('Runtime.runIfWaitingForDebugger')
        .catch(error => {
          this.logger.error('Runtime.runIfWaitingForDebugger.Error', {
            error,
            cdpSessionId: sessionId,
          });
        })
        .then(() =>
          // detach from page session
          this.cdpSession.send('Target.detachFromTarget', { sessionId }),
        )
        .catch(error => {
          this.logger.error('Target.detachFromTarget', {
            error,
            cdpSessionId: sessionId,
          });
        });
    }
  }

  private onRuntimeException(msg: ExceptionThrownEvent): void {
    const error = ConsoleMessage.exceptionToError(msg.exceptionDetails);
    const frameId = this.framesManager.getFrameIdForExecutionContext(
      msg.exceptionDetails.executionContextId,
    );
    this.emit('page-error', {
      frameId,
      error,
    });
  }

  private onRuntimeConsole(event: ConsoleAPICalledEvent): void {
    const message = ConsoleMessage.create(this.cdpSession, event);
    const frameId = this.framesManager.getFrameIdForExecutionContext(event.executionContextId);

    this.emit('console', {
      frameId,
      ...message,
    });
  }

  private onTargetCrashed(): void {
    this.emit('crashed', { error: new Error('Target Crashed') });
  }

  private onWindowOpen(event: WindowOpenEvent): void {
    this.windowOpenParams = event;
  }

  private async setScreensize(viewport: IViewport): Promise<void> {
    if (!viewport) return;
    await this.cdpSession.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.deviceScaleFactor ?? 1,
      positionX: viewport.positionX,
      positionY: viewport.positionY,
      screenWidth: viewport.screenWidth,
      screenHeight: viewport.screenHeight,
      mobile: false,
    });
  }

  private async setTimezone(timezoneId = ''): Promise<void> {
    try {
      await this.cdpSession.send('Emulation.setTimezoneOverride', { timezoneId });
    } catch (error) {
      if (error.message.includes('Timezone override is already in effect')) return;
      if (error.message.includes('Invalid timezone'))
        throw new Error(`Invalid timezone ID: ${timezoneId}`);
      throw error;
    }
  }

  private async setLocale(locale = 'en-US'): Promise<void> {
    try {
      await this.cdpSession.send('Emulation.setLocaleOverride', { locale });
    } catch (error) {
      // not installed in Chrome 80
      if (error.message.includes("'Emulation.setLocaleOverride' wasn't found")) return;
      // All pages in the same renderer share locale. All such pages belong to the same
      // context and if locale is overridden for one of them its value is the same as
      // we are trying to set so it's not a problem.
      if (error.message.includes('Another locale override is already in effect')) return;
      throw error;
    }
  }
}
