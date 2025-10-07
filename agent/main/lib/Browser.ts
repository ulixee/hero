import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Log from '@ulixee/commons/lib/Logger';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import IBrowser, { IBrowserEvents } from '@ulixee/unblocked-specification/agent/browser/IBrowser';
import IBrowserEngine from '@ulixee/unblocked-specification/agent/browser/IBrowserEngine';
import IBrowserUserConfig from '@ulixee/unblocked-specification/agent/browser/IBrowserUserConfig';
import { IBrowserContextHooks } from '@ulixee/unblocked-specification/agent/hooks/IBrowserHooks';
import { IBrowserHooks, IHooksProvider } from '@ulixee/unblocked-specification/agent/hooks/IHooks';
import Protocol from 'devtools-protocol';
import { nanoid } from 'nanoid';
import * as os from 'os';
import * as Path from 'path';
import env from '../env';
import BrowserLaunchError from '../errors/BrowserLaunchError';
import IConnectionTransport from '../interfaces/IConnectionTransport';
import BrowserContext, { IBrowserContextCreateOptions } from './BrowserContext';
import BrowserProcess from './BrowserProcess';
import ChromeEngine from './ChromeEngine';
import { Connection } from './Connection';
import DevtoolsPreferences from './DevtoolsPreferences';
import DevtoolsSession from './DevtoolsSession';
import Page, { IPageCreateOptions } from './Page';
import GetVersionResponse = Protocol.Browser.GetVersionResponse;
import TargetInfo = Protocol.Target.TargetInfo;

const { log } = Log(module);

const instanceId = nanoid(5);

let browserIdCounter = 0;

export default class Browser extends TypedEventEmitter<IBrowserEvents> implements IBrowser {
  public devtoolsSession: DevtoolsSession;
  public readonly id: string;
  public readonly engine: IBrowserEngine;
  public readonly browserContextsById = new Map<string, BrowserContext>();
  public hooks: IBrowserHooks = {};
  public get name(): string {
    if (!this.version) return 'Unlaunched';
    return this.version.product.split('/').shift();
  }

  public get fullVersion(): string {
    if (!this.version) return 'Unlaunched';
    return this.version.product.split('/').pop();
  }

  public get majorVersion(): number {
    if (!this.version) return -1;
    return this.fullVersion?.split('.').map(Number).shift();
  }

  public get supportsBrowserContextProxy(): boolean {
    return this.majorVersion >= 85;
  }

  public launchPromise = new Resolvable<void | Error>();
  public isLaunchStarted = false;
  private isShuttingDown: Promise<Error | void>;

  private connection: Connection;
  private process: BrowserProcess;

  private version: GetVersionResponse;
  private preferencesInterceptor?: DevtoolsPreferences;

  private browserContextCreationHooks: IBrowserContextHooks;
  private connectOnlyToPageTargets?: { [targetId: string]: IPageCreateOptions };

  private get defaultBrowserContext(): BrowserContext {
    return this.browserContextsById.get(undefined);
  }

  constructor(
    engine: IBrowserEngine,
    hooks?: IHooksProvider,
    browserUserConfig?: IBrowserUserConfig,
    private debugLog = false,
  ) {
    super();
    this.engine = engine;
    // if chrome engine, make a copy
    if (engine instanceof ChromeEngine) {
      this.engine = new ChromeEngine(engine.source);
    }
    this.id = String((browserIdCounter += 1));
    browserUserConfig ??= {};
    browserUserConfig.disableGpu ??= env.disableGpu;
    browserUserConfig.noChromeSandbox ??= env.noChromeSandbox;
    browserUserConfig.useRemoteDebuggingPort ??= env.useRemoteDebuggingPort;
    browserUserConfig.showChrome ??= env.showChrome;

    this.applyDefaultLaunchArgs(browserUserConfig);
    this.setUserDataDir();

    if (hooks) {
      this.hooks = hooks;
      hooks.onNewBrowser?.(this, browserUserConfig);
    }
  }

  public async connect(transport: IConnectionTransport): Promise<Browser> {
    if (this.isLaunchStarted) {
      await this.launchPromise.promise;
      return this;
    }
    this.isLaunchStarted = true;
    this.connection = new Connection(transport);
    this.devtoolsSession = this.connection.rootSession;
    this.bindDevtoolsEvents();
    this.connection.on('on-attach', this.emit.bind(this, 'new-session'));

    this.version = await this.devtoolsSession.send('Browser.getVersion');

    this.connection.once('disconnected', this.emit.bind(this, 'close'));

    this.launchPromise.resolve();

    return this;
  }

  public async launch(): Promise<Browser> {
    if (this.isLaunchStarted) {
      await this.launchPromise.promise;
      return this;
    }

    const parentLogId = log.info('Browser.Launching', {
      sessionId: null,
      name: this.engine.name,
      fullVersion: this.engine.fullVersion,
    });

    try {
      this.isLaunchStarted = true;
      await this.engine.verifyLaunchable?.();
    } catch (launchError) {
      this.launchPromise.reject(launchError);
      setImmediate(() => this.emit('close'));
      // will bomb here
      await this.launchPromise.promise;
    }

    try {
      this.process = new BrowserProcess(this.engine);

      this.connection = new Connection(this.process.transport);
      this.devtoolsSession = this.connection.rootSession;

      this.bindDevtoolsEvents();

      // Pipe transport needs data send to detect if it is connected/functional
      this.process.transport.send('');
      await this.process.isProcessFunctionalPromise;
      // Needs to be after isProcessFunctionalPromise to make sure our transport is ready
      await this.testConnection();

      this.process.once('close', () => this.emit('close'));

      this.launchPromise.resolve();
      log.stats('Browser.Launched', {
        ...this.version,
        executablePath: this.engine.executablePath,
        desiredFullVersion: this.engine.fullVersion,
        sessionId: null,
        parentLogId,
      });

      if (this.engine.isHeaded) this.preferencesInterceptor = new DevtoolsPreferences(this.engine);

      return this;
    } catch (err) {
      await this.process.close();

      // give it a second to read errors
      const processError = await this.process.isProcessFunctionalPromise.catch(error => error);

      let message = 'Failed to launch Chrome!';
      // eslint-disable-next-line no-ex-assign
      if (err.code === 'EPIPE' && processError) err = processError;
      if (err.code !== 'EPIPE') {
        message += ` ${err.message}`;
      }

      if (this.process.launchStderr.length) {
        message += `\n\n\nSometimes a reason can be found in the Chrome Stderr logs:\n\t${this.process.launchStderr.join(
          '\n\t',
        )}`;
      }
      const launchError = new BrowserLaunchError(
        message,
        err.stack.split(/\r?\n/).slice(1).join('\n'),
      );

      this.launchPromise.reject(launchError);
      log.stats('Browser.LaunchError', {
        launchError,
        parentLogId,
        chromeStderr: this.process.launchStderr.join('\n'),
        sessionId: null,
      });
      setImmediate(() => this.emit('close'));
    } finally {
      await this.launchPromise.promise;
    }
  }

  public async newContext(options: IBrowserContextCreateOptions = {}): Promise<BrowserContext> {
    if (!this.launchPromise) throw new CanceledPromiseError('This Browser has been shut down');
    if (!this.isLaunchStarted) throw new Error('This Browser has not had launch() called on it');

    const error = await this.launchPromise.promise;
    if (error) throw error;

    if (this.isShuttingDown) throw new Error('Shutting down');

    options.isIncognito ??= true;

    if (!options.isIncognito) {
      let defaultContext = this.defaultBrowserContext;
      if (!defaultContext) {
        defaultContext = new BrowserContext(this, false, options);
        await this.onNewContext(defaultContext);
      }
      defaultContext.proxy = options.proxy;
      return defaultContext;
    }

    const isolatedContext = new BrowserContext(this, true, options);
    await isolatedContext.open();
    await this.onNewContext(isolatedContext);
    return isolatedContext;
  }

  public async connectToPage(
    targetId: string,
    options: IPageCreateOptions,
    hooks?: IBrowserContextHooks,
  ): Promise<Page> {
    this.connectOnlyToPageTargets ??= {};
    this.connectOnlyToPageTargets[targetId] = options;
    this.browserContextCreationHooks = hooks;
    await this.devtoolsSession.send('Target.attachToTarget', { targetId, flatten: true });
    await new Promise(setImmediate);
    for (const context of this.browserContextsById.values()) {
      const page = context.pagesById.get(targetId);
      if (page) {
        await page.isReady;
        return page;
      }
    }
  }

  public async getAllPageTargets(): Promise<TargetInfo[]> {
    const targets = await this.devtoolsSession.send('Target.getTargets');
    return targets.targetInfos.filter(x => x.type === 'page');
  }

  public getBrowserContext(id: string): BrowserContext {
    return this.browserContextsById.get(id) ?? this.defaultBrowserContext;
  }

  public isEqualEngine(engine: IBrowserEngine): boolean {
    if (this.engine.executablePath !== engine.executablePath) return false;
    // TODO order can mess this up, but sorting this can also alter it?
    for (let i = 0; i < engine.launchArguments.length; i += 1) {
      const launchArg = engine.launchArguments[i];
      if (launchArg.startsWith('--user-data-dir=')) continue;
      if (this.engine.launchArguments[i] !== launchArg) return false;
    }
    return true;
  }

  public async close(): Promise<void | Error> {
    const closePromises: Promise<any>[] = [];
    if (!this.isLaunchStarted) return;
    if (this.isShuttingDown) return this.isShuttingDown;

    const parentLogId = log.stats('Browser.Closing');

    try {
      // if we started to get ready, clear out now
      this.isLaunchStarted = false;
      this.isShuttingDown = new Promise<Error | void>(async resolve => {
        try {
          if (this.launchPromise) {
            const err = await this.launchPromise.catch(startError => startError);
            this.launchPromise = null;
            if (err) return resolve(err);
          }

          for (const [, context] of this.browserContextsById) closePromises.push(context.close());
          await Promise.all(closePromises);
          await this.process?.close();
          this.connection.dispose();
        } finally {
          resolve();
        }
      });

      return await this.isShuttingDown;
    } catch (error) {
      log.error('Browser.Closing:Error', { parentLogId, sessionId: null, error });
    } finally {
      this.emit('close');
      this.removeAllListeners();
      log.stats('Browser.Closed', { parentLogId, sessionId: null });
    }
  }

  public isConnected(): boolean {
    return !this.connection.isClosed;
  }

  public setUserDataDir(): void {
    // TODO weird behaviour if userDataDir is not set but --user-data-dir is passed
    // we need to decide what a user should configure.
    if (this.engine.userDataDir) return;
    const launchArgs = this.engine.launchArguments;

    if (!launchArgs.some(x => x.startsWith('--user-data-dir'))) {
      const dataDir = Path.join(
        os.tmpdir(),
        `${instanceId}-${browserIdCounter}-${this.engine.fullVersion.replace(/\./g, '-')}`,
      );
      this.engine.launchArguments.push(`--user-data-dir=${dataDir}`); // required to allow multiple browsers to be headed
      this.engine.userDataDir = dataDir;
    }
  }

  protected bindDevtoolsEvents(): void {
    this.devtoolsSession.on('Target.attachedToTarget', this.onAttachedToTarget.bind(this));
    this.devtoolsSession.on('Target.detachedFromTarget', this.onDetachedFromTarget.bind(this));
    this.devtoolsSession.on('Target.targetCreated', this.onTargetCreated.bind(this));
    this.devtoolsSession.on('Target.targetInfoChanged', this.onTargetInfoChanged.bind(this));
    this.devtoolsSession.on('Target.targetDestroyed', this.onTargetDestroyed.bind(this));
    this.devtoolsSession.on('Target.targetCrashed', this.onTargetCrashed.bind(this));
  }

  protected async testConnection(): Promise<void> {
    await this.devtoolsSession.send('Target.setAutoAttach', {
      autoAttach: true,
      waitForDebuggerOnStart: true,
      flatten: true,
    });

    await this.devtoolsSession.send('Target.setDiscoverTargets', {
      discover: true,
    });
    this.version = await this.devtoolsSession.send('Browser.getVersion');

    this.connection.once('disconnected', this.emit.bind(this, 'close'));
  }

  private applyDefaultLaunchArgs(options: IBrowserUserConfig): void {
    const launchArgs = [
      ...this.engine.launchArguments,
      '--no-startup-window',
      '--use-mock-keychain', // Use mock keychain on Mac to prevent blocking permissions dialogs
      '--disable-features=MediaRouter', // no prompt for network connections
      '--disable-features=AimEnabled', // disable AIM Server Eligibility (this does extra network requests)
    ];

    if (!options.disableMitm) {
      launchArgs.push('--ignore-certificate-errors');
    }

    if (options.proxyPort !== undefined && !launchArgs.some(x => x.startsWith('--proxy-server'))) {
      launchArgs.push(
        // Use proxy for localhost URLs
        '--proxy-bypass-list=<-loopback>',
        `--proxy-server=localhost:${options.proxyPort}`,
      );
    }

    if (options.noChromeSandbox === true) {
      launchArgs.push('--no-sandbox');
    } else if (os.platform() === 'linux') {
      const runningAsRoot = process.geteuid && process.geteuid() === 0;
      if (runningAsRoot) {
        // eslint-disable-next-line no-console
        console.warn(
          'WARNING: Agent is being run under "root" user - disabling Chrome sandbox! ' +
            'Run under regular user to get rid of this warning, or pass in `noChromeSandbox: true` to the constructor arguments.',
        );
        launchArgs.push('--no-sandbox');
      }
    }
    if (options.useRemoteDebuggingPort) {
      this.engine.useRemoteDebuggingPort = true;
      launchArgs.push('--remote-debugging-port=0');
    } else {
      launchArgs.push('--remote-debugging-pipe');
    }

    this.engine.isHeaded ||= options.showChrome === true;
    // If we're headed, we can support new headless mode
    if (!this.engine.isHeaded) {
      const majorVersion = this.engine.fullVersion.split('.').map(Number)[0];
      if (majorVersion < 115) {
        throw new Error(
          `ERROR: Running unblocked headless with chrome < 115 (${majorVersion}) is not supported anymore.
            This is because we rely on the new headless mode of recent chrome versions.
            To fix this problem either use a newer chrome version or run unblocked in headed (showChrome) mode.`,
        );
      }

      this.engine.isHeadlessNew = true;
      launchArgs.push('--headless=new');
    }
    // Make sure we don't pass duplicates so we can reuse browsers
    this.engine.launchArguments = [...new Set(launchArgs)];
  }

  private onAttachedToTarget(event: Protocol.Target.AttachedToTargetEvent): void {
    const { targetInfo, sessionId } = event;

    this.browserContextsById
      .get(targetInfo.browserContextId)
      ?.targetsById.set(targetInfo.targetId, targetInfo);

    const isDevtoolsPanel = targetInfo.url.startsWith('devtools://devtools');
    const isContextLess = !targetInfo.browserContextId;
    if (
      isContextLess ||
      (event.targetInfo.type === 'page' &&
        !isDevtoolsPanel &&
        this.connectOnlyToPageTargets &&
        !this.connectOnlyToPageTargets[targetInfo.targetId])
    ) {
      if (this.debugLog) {
        log.stats('Not connecting to target', { event, sessionId: null });
      }

      if (event.waitingForDebugger) {
        this.connection
          .getSession(sessionId)
          .send('Runtime.runIfWaitingForDebugger')
          .catch(() => null)
          .then(() => this.devtoolsSession.send('Target.detachFromTarget', { sessionId }))
          .catch(() => null);
        return;
      }
      if (targetInfo.attached) {
        this.devtoolsSession.send('Target.detachFromTarget', { sessionId }).catch(() => null);
      }
      return;
    }
    if (this.debugLog) {
      log.stats('onAttachedToTarget', { event, sessionId: null });
    }
    if (
      this.connectOnlyToPageTargets &&
      this.connectOnlyToPageTargets[targetInfo.targetId] &&
      !this.browserContextsById.has(targetInfo.browserContextId)
    ) {
      if (this.debugLog) {
        log.stats('Creating BrowserContext for connectOnlyToPageTargets.', {
          browserContextId: targetInfo.browserContextId,
          sessionId: null,
        });
      }
      const context = new BrowserContext(this, false);
      context.hooks = this.browserContextCreationHooks ?? {};
      context.id = targetInfo.browserContextId;
      context.targetsById.set(targetInfo.targetId, targetInfo);

      if (this.connectOnlyToPageTargets) {
        context.addPageInitializationOptions(this.connectOnlyToPageTargets);
      }
      void this.onNewContext(context);
    }

    if (targetInfo.type === 'page' && !isDevtoolsPanel) {
      const devtoolsSession = this.connection.getSession(sessionId);
      const context = this.getBrowserContext(targetInfo.browserContextId);
      context?.onPageAttached(devtoolsSession, targetInfo).catch(console.error);
      return;
    }

    if (targetInfo.type === 'shared_worker') {
      const devtoolsSession = this.connection.getSession(sessionId);
      const context = this.getBrowserContext(targetInfo.browserContextId);
      context?.onSharedWorkerAttached(devtoolsSession, targetInfo).catch(() => null);
    }

    if (targetInfo.type === 'service_worker') {
      const devtoolsSession = this.connection.getSession(sessionId);
      if (!devtoolsSession) return;

      const context = this.getBrowserContext(targetInfo.browserContextId);
      context?.onSharedWorkerAttached(devtoolsSession, targetInfo).catch(() => null);
      if (event.waitingForDebugger) {
        devtoolsSession
          .send('Runtime.runIfWaitingForDebugger')
          .catch(() => null)
          .then(() => this.devtoolsSession.send('Target.detachFromTarget', { sessionId }))
          .catch(() => null);
      }
    }

    if (isDevtoolsPanel) {
      const devtoolsSession = this.connection.getSession(sessionId);
      const context = this.getBrowserContext(targetInfo.browserContextId);

      this.preferencesInterceptor?.installOnConnect(devtoolsSession).catch(() => null);
      void this.hooks?.onDevtoolsPanelAttached?.(devtoolsSession).catch(() => null);
      context?.onDevtoolsPanelAttached(devtoolsSession, targetInfo);
      return;
    }

    if (event.waitingForDebugger && targetInfo.type === 'other') {
      const devtoolsSession = this.connection.getSession(sessionId);
      if (!devtoolsSession) return;
      // Ideally, detaching should resume any target, but there is a bug in the backend.
      devtoolsSession
        .send('Runtime.runIfWaitingForDebugger')
        .catch(() => null)
        .then(() => this.devtoolsSession.send('Target.detachFromTarget', { sessionId }))
        .catch(() => null);
    }
  }

  private onTargetInfoChanged(event: Protocol.Target.TargetInfoChangedEvent): void {
    const { targetInfo } = event;
    this.browserContextsById
      .get(targetInfo.browserContextId)
      ?.targetsById.set(targetInfo.targetId, targetInfo);
  }

  private async onTargetCreated(event: Protocol.Target.TargetCreatedEvent): Promise<void> {
    const { targetInfo } = event;
    if (this.debugLog) {
      log.stats('onTargetCreated', { targetInfo, sessionId: null });
    }
    this.browserContextsById
      .get(targetInfo.browserContextId)
      ?.targetsById.set(targetInfo.targetId, targetInfo);

    if (targetInfo.type === 'page' && !targetInfo.attached) {
      const context = this.getBrowserContext(targetInfo.browserContextId);
      await context?.attachToTarget(targetInfo.targetId);
    }
  }

  private onTargetDestroyed(event: Protocol.Target.TargetDestroyedEvent): void {
    const { targetId } = event;
    if (this.debugLog) {
      log.stats('onTargetDestroyed', { targetId, sessionId: null });
    }
    for (const context of this.browserContextsById.values()) {
      context.targetDestroyed(targetId);
    }
  }

  private onTargetCrashed(event: Protocol.Target.TargetCrashedEvent): void {
    const { targetId, errorCode, status } = event;
    if (status === 'killed') {
      for (const context of this.browserContextsById.values()) {
        context.targetKilled(targetId, errorCode);
      }
    }
  }

  private onDetachedFromTarget(event: Protocol.Target.DetachedFromTargetEvent): void {
    const targetId = event.targetId;
    for (const [, context] of this.browserContextsById) {
      context.onTargetDetached(targetId);
    }
  }

  private async onNewContext(context: BrowserContext): Promise<void> {
    const id = context.id;
    this.browserContextsById.set(id, context);
    context.once('close', () => this.browserContextsById.delete(id));
    this.emit('new-context', { context });
    await this.hooks?.onNewBrowserContext?.(context);
  }
}
