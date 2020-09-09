import * as Fs from 'fs';
import * as Path from 'path';
import { createPromise, IResolvablePromise } from '@secret-agent/commons/utils';
import Log from '@secret-agent/commons/Logger';
import { MitmProxy as MitmServer } from '@secret-agent/mitm';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import SessionsDb from '@secret-agent/session-state/lib/SessionsDb';
import Emulators, { EmulatorPlugin } from '@secret-agent/emulators';
import Puppet from '@secret-agent/puppet';
import Session from './Session';

const { log } = Log(module);
let sessionsDir = process.env.CACHE_DIR || '.sessions'; // transferred to GlobalPool below class definition

export default class GlobalPool {
  public static maxActiveSessionCount = 10;
  public static localProxyPortStart = 0;
  public static get activeSessionCount() {
    return this._activeSessionCount;
  }

  public static get hasAvailability() {
    return this.activeSessionCount < GlobalPool.maxActiveSessionCount;
  }

  private static _activeSessionCount = 0;
  private static puppets: Puppet[] = [];
  private static mitmServer: MitmServer;
  private static waitingForAvailability: {
    options: ICreateSessionOptions;
    promise: IResolvablePromise<Session>;
  }[] = [];

  public static async start(emulatorIds: string[]) {
    log.info('StartingGlobalPool', {
      sessionId: null,
      emulatorIds,
    });
    await this.startMitm();

    for (const emulatorId of emulatorIds) {
      const emulator = Emulators.create(emulatorId);
      this.addPuppet(emulator);
    }

    this.resolveWaitingConnection();
  }

  public static async createSession(options: ICreateSessionOptions) {
    log.info('AcquiringChrome', {
      sessionId: null,
      activeSessionCount: this.activeSessionCount,
      waitingForAvailability: this.waitingForAvailability.length,
      maxActiveSessionCount: this.maxActiveSessionCount,
    });

    if (!this.hasAvailability) {
      const resolvablePromise = createPromise<Session>();
      this.waitingForAvailability.push({ options, promise: resolvablePromise });
      return resolvablePromise.promise;
    }
    return this.createSessionNow(options);
  }

  public static async closeSession(session: Session) {
    this._activeSessionCount -= 1;

    const wasTransferred = this.resolveWaitingConnection();
    await session.close();
    if (wasTransferred) {
      log.info('ReleasingChrome', {
        sessionId: null,
        activeSessionCount: this.activeSessionCount,
        waitingForAvailability: this.waitingForAvailability.length,
      });
    }
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

  private static addPuppet(emulator: EmulatorPlugin) {
    const existing = this.getPuppet(emulator);
    if (existing) return existing;

    const puppet = new Puppet(emulator);
    this.puppets.push(puppet);

    const showBrowser = !!process.env.SHOW_BROWSER;
    const showBrowserLogs = !!process.env.DEBUG;
    puppet.start(this.mitmServer.port, showBrowser, showBrowserLogs);
    return puppet;
  }

  private static getPuppet(emulator?: EmulatorPlugin) {
    if (!emulator) return this.puppets[0];
    return this.puppets.find(x => x.executablePath === emulator.engineExecutablePath);
  }

  private static async startMitm() {
    if (this.mitmServer) return;
    this.mitmServer = await MitmServer.start(this.localProxyPortStart);
  }

  private static async createSessionNow(options: ICreateSessionOptions): Promise<Session> {
    await this.startMitm();

    this._activeSessionCount += 1;
    let puppet: Puppet;
    try {
      const session = new Session(options);

      puppet = this.getPuppet(session.emulator) ?? this.addPuppet(session.emulator);

      const browserContext = await puppet.newContext(session.getBrowserEmulation());
      await session.initialize(browserContext);

      return session;
    } catch (err) {
      this._activeSessionCount -= 1;

      throw err;
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
