import * as Fs from 'fs';
import * as Path from 'path';
import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';
import { createPromise } from '@secret-agent/commons/utils';
import Log from '@secret-agent/commons/Logger';
import { MitmProxy as MitmServer } from '@secret-agent/mitm';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import Puppet, { ILaunchArgs } from '@secret-agent/puppet';
import * as Os from 'os';
import IBrowserEngine from '@secret-agent/core-interfaces/IBrowserEngine';
import DefaultBrowser from '@secret-agent/emulate-chrome-83';
import SessionsDb from '../dbs/SessionsDb';
import Session from './Session';
import BrowserEmulators from './BrowserEmulators';

const { log } = Log(module);
let sessionsDir = process.env.SA_SESSIONS_DIR || Path.join(Os.tmpdir(), '.secret-agent'); // transferred to GlobalPool below class definition

export default class GlobalPool {
  public static defaultBrowserEmulatorId = DefaultBrowser.id;
  public static maxConcurrentAgentsCount = 10;
  public static localProxyPortStart = 0;
  public static get activeSessionCount() {
    return this._activeSessionCount;
  }

  public static get hasAvailability() {
    return this.activeSessionCount < GlobalPool.maxConcurrentAgentsCount;
  }

  private static defaultLaunchArgs: ILaunchArgs;
  private static _activeSessionCount = 0;
  private static puppets: Puppet[] = [];
  private static mitmServer: MitmServer;
  private static waitingForAvailability: {
    options: ICreateSessionOptions;
    promise: IResolvablePromise<Session>;
  }[] = [];

  public static async start(browserEmulatorIds?: string[]) {
    browserEmulatorIds = browserEmulatorIds ?? [];
    log.info('StartingGlobalPool', {
      sessionId: null,
      browserEmulatorIds,
    });
    await this.startMitm();

    for (const emulatorId of browserEmulatorIds) {
      const browserEmulator = BrowserEmulators.getClass(emulatorId);
      const puppet = await this.addPuppet(browserEmulator.engine);
      await puppet.isReady;
    }

    this.resolveWaitingConnection();
  }

  public static createSession(options: ICreateSessionOptions) {
    log.info('AcquiringChrome', {
      sessionId: null,
      activeSessionCount: this.activeSessionCount,
      waitingForAvailability: this.waitingForAvailability.length,
      maxConcurrentAgentsCount: this.maxConcurrentAgentsCount,
    });

    if (!this.hasAvailability) {
      const resolvablePromise = createPromise<Session>();
      this.waitingForAvailability.push({ options, promise: resolvablePromise });
      return resolvablePromise.promise;
    }
    return this.createSessionNow(options);
  }

  public static close(): Promise<void> {
    const logId = log.stats('GlobalPool.Closing');

    for (const { promise } of this.waitingForAvailability) {
      promise.reject(new Error('Shutting down'));
    }
    this.waitingForAvailability.length = 0;
    const closePromises: Promise<any>[] = [];
    while (this.puppets.length) {
      const puppetBrowser = this.puppets.shift();
      closePromises.push(puppetBrowser.close().catch(err => err));
    }
    if (this.mitmServer) {
      closePromises.push(this.mitmServer.close());
      this.mitmServer = null;
    }
    SessionsDb.shutdown();
    return Promise.all(closePromises)
      .then(() => {
        log.stats('GlobalPool.Closed', { parentLogId: logId, sessionId: null });
        return null;
      })
      .catch(error => {
        log.error('Error in GlobalPoolShutdown', { parentLogId: logId, sessionId: null, error });
      });
  }

  private static async addPuppet(engine: IBrowserEngine): Promise<Puppet> {
    const existing = this.getPuppet(engine);
    if (existing) {
      if (existing instanceof Error) throw existing;
      return existing;
    }

    if (!this.defaultLaunchArgs) {
      this.defaultLaunchArgs = {
        showBrowser: Boolean(JSON.parse(process.env.SA_SHOW_BROWSER ?? 'false')),
        disableDevtools: Boolean(JSON.parse(process.env.SA_DISABLE_DEVTOOLS ?? 'false')),
        noChromeSandbox: Boolean(JSON.parse(process.env.SA_NO_CHROME_SANDBOX ?? 'false')),
        disableGpu: Boolean(JSON.parse(process.env.SA_DISABLE_GPU ?? 'false')),
      };
    }

    // if showing all browsers, make sure to set on the engine
    if (!engine.isHeaded && this.defaultLaunchArgs.showBrowser) {
      engine.isHeaded = true;
    }

    const puppet = new Puppet(engine);
    this.puppets.push(puppet);

    const browserOrError = await puppet.start({
      ...this.defaultLaunchArgs,
      proxyPort: this.mitmServer.port,
      showBrowser: engine.isHeaded,
    });
    if (browserOrError instanceof Error) throw browserOrError;
    return puppet;
  }

  private static getPuppet(engine?: IBrowserEngine) {
    if (!engine) return this.puppets[0];
    return this.puppets.find(x => x.engine === engine);
  }

  private static async startMitm() {
    if (this.mitmServer) return;
    this.mitmServer = await MitmServer.start(this.localProxyPortStart, this.sessionsDir);
  }

  private static async createSessionNow(options: ICreateSessionOptions): Promise<Session> {
    await this.startMitm();

    this._activeSessionCount += 1;
    let puppet: Puppet;
    try {
      const session = new Session(options);
      session.on('closing', this.releaseConnection.bind(this));

      puppet =
        this.getPuppet(session.browserEngine) ?? (await this.addPuppet(session.browserEngine));

      const browserContext = await puppet.newContext(
        session.getBrowserEmulation(),
        log.createChild(module, {
          sessionId: session.id,
        }),
      );
      await session.initialize(browserContext);

      return session;
    } catch (err) {
      this._activeSessionCount -= 1;

      throw err;
    }
  }

  private static releaseConnection() {
    this._activeSessionCount -= 1;

    const wasTransferred = this.resolveWaitingConnection();
    if (wasTransferred) {
      log.info('ReleasingChrome', {
        sessionId: null,
        activeSessionCount: this.activeSessionCount,
        waitingForAvailability: this.waitingForAvailability.length,
      });
    }
  }

  private static resolveWaitingConnection() {
    if (!this.waitingForAvailability.length) {
      return false;
    }
    const { options, promise } = this.waitingForAvailability.shift();

    // NOTE: we want this to blow up if an exception occurs inside the promise
    // eslint-disable-next-line promise/catch-or-return
    this.createSessionNow(options).then(session => promise.resolve(session));

    log.info('TransferredChromeToWaitingAcquirer');
    return true;
  }

  public static get sessionsDir(): string {
    return sessionsDir;
  }

  public static set sessionsDir(dir: string) {
    const absoluteDir = Path.isAbsolute(dir) ? dir : Path.join(process.cwd(), dir);
    if (!Fs.existsSync(`${absoluteDir}`)) {
      Fs.mkdirSync(`${absoluteDir}`, { recursive: true });
    }
    sessionsDir = absoluteDir;
  }
}

GlobalPool.sessionsDir = sessionsDir;
