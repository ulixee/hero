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
import { IPuppetPage, IPuppetPageEvents } from '@secret-agent/puppet/interfaces/IPuppetPage';
import * as eventUtils from '@secret-agent/commons/eventUtils';
import { IRegisteredEventListener, TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { createPromise } from '@secret-agent/commons/utils';
import { IBoundLog } from '@secret-agent/commons/Logger';
import { CDPSession } from './CDPSession';
import { NetworkManager } from './NetworkManager';
import { Keyboard } from './Keyboard';
import Mouse from './Mouse';
import FramesManager from './FramesManager';
import { BrowserContext } from './BrowserContext';
import { Worker } from './Worker';
import ConsoleMessage from './ConsoleMessage';
import ConsoleAPICalledEvent = Protocol.Runtime.ConsoleAPICalledEvent;
import ExceptionThrownEvent = Protocol.Runtime.ExceptionThrownEvent;
import WindowOpenEvent = Protocol.Page.WindowOpenEvent;

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

  public cdpSession: CDPSession;
  public targetId: string;
  public isClosed = false;
  public readonly isReady: Promise<void>;
  public windowOpenParams: Protocol.Page.WindowOpenEvent;

  public get id() {
    return this.targetId;
  }

  public get devtoolsSessionId() {
    return this.cdpSession.id;
  }

  public get mainFrame() {
    return this.framesManager.main;
  }

  public get frames() {
    return this.framesManager.activeFrames;
  }

  public get workers() {
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

    this.framesManager.on('frame-lifecycle', ({ frame, name }) => {
      if (name === 'load' && frame.id === this.mainFrame?.id) {
        this.emit('load');
      }
    });

    for (const event of ['frame-created', 'frame-navigated', 'frame-lifecycle'] as const) {
      this.framesManager.on(event, this.emit.bind(this, event));
    }
    for (const event of [
      'navigation-response',
      'websocket-frame',
      'websocket-handshake',
      'resource-will-be-requested',
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

  addNewDocumentScript(script: string, isolatedEnvironment: boolean) {
    return this.framesManager.addNewDocumentScript(script, isolatedEnvironment);
  }

  async addPageCallback(name: string, onCallback: (payload: any, frameId: string) => any) {
    return this.framesManager.addPageCallback(name, onCallback);
  }

  public async getIndexedDbDatabaseNames() {
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

  async evaluate<T>(expression: string): Promise<T> {
    return this.mainFrame.evaluate<T>(expression, false);
  }

  async navigate(url: string, options: { referrer?: string } = {}) {
    const navigationResponse = await this.cdpSession.send('Page.navigate', {
      url,
      referrer: options.referrer,
      frameId: this.mainFrame.id,
    });
    if (navigationResponse.errorText) throw new Error(navigationResponse.errorText);
    return this.framesManager.waitForFrame(navigationResponse, url, true);
  }

  async goBack(): Promise<void> {
    return this.navigateToHistory(-1);
  }

  async goForward(): Promise<void> {
    return this.navigateToHistory(+1);
  }

  async bringToFront(): Promise<void> {
    await this.cdpSession.send('Page.bringToFront');
  }

  async close(): Promise<void> {
    if (this.cdpSession.isConnected()) {
      // trigger beforeUnload
      await this.cdpSession.send('Page.close');
    }
    return this.closePromise.promise;
  }

  didClose() {
    this.isClosed = true;
    this.framesManager.close();
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

  private async navigateToHistory(delta: number): Promise<void> {
    const history = await this.cdpSession.send('Page.getNavigationHistory');
    const entry = history.entries[history.currentIndex + delta];
    if (!entry) return null;
    await Promise.all([
      this.cdpSession.send('Page.navigateToHistoryEntry', { entryId: entry.id }),
      this.framesManager.waitOn('frame-navigated'),
    ]);
  }

  private async initialize(): Promise<void> {
    await Promise.all([
      this.networkManager.initialize(this.browserContext.emulation),
      this.framesManager.initialize(),
      this.cdpSession.send('Target.setAutoAttach', {
        autoAttach: true,
        waitForDebuggerOnStart: true,
        flatten: true,
      }),
      this.cdpSession.send('Emulation.setFocusEmulationEnabled', { enabled: true }),
    ]);

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

  private onAttachedToTarget(event: Protocol.Target.AttachedToTargetEvent) {
    const { sessionId, targetInfo, waitingForDebugger } = event;

    const cdpSession = this.cdpSession.connection.getSession(sessionId);

    if (targetInfo.type === 'service_worker' || targetInfo.type === 'worker') {
      const worker = new Worker(
        this.browserContext,
        this.networkManager,
        cdpSession,
        this.logger,
        targetInfo,
      );
      this.browserContext.onWorkerAttached(cdpSession, worker, this.targetId);
      const targetId = targetInfo.targetId;
      this.workersById.set(targetId, worker);

      worker.on('console', this.emit.bind(this, 'console'));
      worker.on('page-error', this.emit.bind(this, 'page-error'));
      worker.on('close', () => this.workersById.delete(targetId));

      // TODO: pause for initialization by core/Tab?
      this.emit('worker', { worker });
      return;
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

  private onRuntimeException(msg: ExceptionThrownEvent) {
    const error = ConsoleMessage.exceptionToError(msg.exceptionDetails);
    const frameId = this.framesManager.getFrameIdForExecutionContext(
      msg.exceptionDetails.executionContextId,
    );
    this.emit('page-error', {
      frameId,
      error,
    });
  }

  private onRuntimeConsole(event: ConsoleAPICalledEvent) {
    const message = ConsoleMessage.create(this.cdpSession, event);
    const frameId = this.framesManager.getFrameIdForExecutionContext(event.executionContextId);

    this.emit('console', {
      frameId,
      ...message,
    });
  }

  private onTargetCrashed() {
    this.emit('crashed', { error: new Error('Target Crashed') });
  }

  private onWindowOpen(event: WindowOpenEvent) {
    this.windowOpenParams = event;
  }
}
