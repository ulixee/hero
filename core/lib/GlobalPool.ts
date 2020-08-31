import * as Fs from 'fs';
import * as Path from 'path';
import { createPromise, IResolvablePromise } from '@secret-agent/commons/utils';
import Log from '@secret-agent/commons/Logger';
import { MitmProxy as MitmServer } from '@secret-agent/mitm';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import SessionsDb from '@secret-agent/session-state/lib/SessionsDb';
import Emulators, { EmulatorPlugin } from '@secret-agent/emulators';
import Session from './Session';
import ChromeCore from './ChromeCore';

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
  private static chromeCores: ChromeCore[] = [];
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
      this.addChromeCore(emulator);
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
    while (this.chromeCores.length) {
      const core = this.chromeCores.shift();
      closePromises.push(core.close());
    }
    if (this.mitmServer) {
      closePromises.push(this.mitmServer.close());
      this.mitmServer = null;
    }
    SessionsDb.shutdown();
    await Promise.all(closePromises);
    log.stats('CompletedGlobalPoolShutdown', { parentLogId: logId, sessionId: null });
  }

  private static addChromeCore(emulator: EmulatorPlugin) {
    const existing = this.getChromeCore(emulator);
    if (existing) return existing;

    const core = new ChromeCore(emulator.engineExecutablePath);
    this.chromeCores.push(core);
    core.start(this.mitmServer.port);
    return core;
  }

  private static getChromeCore(emulator?: EmulatorPlugin) {
    if (!emulator) return this.chromeCores[0];
    return this.chromeCores.find(x => x.executablePath === emulator.engineExecutablePath);
  }

  private static async startMitm() {
    if (this.mitmServer) return;
    this.mitmServer = await MitmServer.start(this.localProxyPortStart);
  }

  private static async createSessionNow(
    options: ICreateSessionOptions,
    isRetry = false,
  ): Promise<Session> {
    await this.startMitm();

    this._activeSessionCount += 1;
    let chromeCore: ChromeCore;
    try {
      const session = new Session(options);

      chromeCore = this.getChromeCore(session.emulator);

      if (!chromeCore) {
        chromeCore = this.addChromeCore(session.emulator);
      }
      const context = await chromeCore.createContext();
      return session.initialize(context);
    } catch (err) {
      this._activeSessionCount -= 1;

      if (
        chromeCore &&
        !isRetry &&
        String(err).includes('WebSocket is not open: readyState 3 (CLOSED)')
      ) {
        await chromeCore.close();
        await chromeCore.start(this.mitmServer.port);
        return this.createSessionNow(options, true);
      }
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
