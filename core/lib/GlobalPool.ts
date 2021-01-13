import * as Fs from 'fs';
import * as Path from 'path';
import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';
import { createPromise } from '@secret-agent/commons/utils';
import Log from '@secret-agent/commons/Logger';
import { MitmProxy as MitmServer } from '@secret-agent/mitm';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import SessionsDb from '@secret-agent/session-state/lib/SessionsDb';
import Puppet from '@secret-agent/puppet';
import Os from 'os';
import IBrowserEngine from '@secret-agent/core-interfaces/IBrowserEngine';
import DefaultBrowser from '@secret-agent/emulate-chrome-83';
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

  private static _activeSessionCount = 0;
  private static puppets: Puppet[] = [];
  private static mitmServer: MitmServer;
  private static waitingForAvailability: {
    options: ICreateSessionOptions;
    promise: IResolvablePromise<Session>;
  }[] = [];

  public static async start(browserEmulatorIds?: string[]) {
    browserEmulatorIds = browserEmulatorIds ?? [GlobalPool.defaultBrowserEmulatorId];
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

  public static async close() {
    const logId = log.info('InitiatingGlobalPoolShutdown');

    for (const { promise } of this.waitingForAvailability) {
      promise.reject(new Error('Shutting down'));
    }
    this.waitingForAvailability.length = 0;
    const closePromises: Promise<any>[] = [];
    while (this.puppets.length) {
      const puppetBrowser = this.puppets.shift();
      closePromises.push(puppetBrowser.close());
    }
    if (this.mitmServer) {
      closePromises.push(this.mitmServer.close());
      this.mitmServer = null;
    }
    SessionsDb.shutdown();
    await Promise.all(closePromises);
    log.stats('CompletedGlobalPoolShutdown', { parentLogId: logId, sessionId: null });
  }

  private static async addPuppet(engine: IBrowserEngine): Promise<Puppet> {
    const existing = this.getPuppet(engine);
    if (existing) return Promise.resolve(existing);

    const puppet = new Puppet(engine);
    this.puppets.push(puppet);

    const showBrowser = Boolean(JSON.parse(process.env.SHOW_BROWSER ?? 'false'));
    const showBrowserLogs = Boolean(JSON.parse(process.env.DEBUG ?? 'false'));
    const browserOrError = await puppet.start({
      proxyPort: this.mitmServer.port,
      showBrowser,
      pipeBrowserIo: showBrowserLogs,
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
