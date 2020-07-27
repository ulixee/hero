import * as Fs from 'fs';
import * as Path from 'path';
import { createPromise, IResolvablePromise } from '@secret-agent/commons/utils';
import Log from '@secret-agent/commons/Logger';
import ChromeCore from './ChromeCore';
import Session from './Session';
import { MitmProxy as MitmServer } from '@secret-agent/mitm';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import SessionsDb from '@secret-agent/session-state/lib/SessionsDb';

const { log } = Log(module);
let sessionsDir = process.env.CACHE_DIR || '.sessions'; // transferred to GlobalPool below class definition

export default class GlobalPool {
  public static maxActiveSessionCount: number = 10;
  public static localProxyPortStart: number = 10e3;

  public static get activeSessionCount() {
    return this._activeSessionCount;
  }

  public static get isStarted() {
    return this._isStarted;
  }

  public static get hasAvailability() {
    return this.activeSessionCount < GlobalPool.maxActiveSessionCount;
  }

  private static _isStarted = false;
  private static _activeSessionCount = 0;
  private static chromeCore: ChromeCore;
  private static mitmServer: MitmServer;
  private static waitingForAvailability: {
    options: ICreateSessionOptions;
    promise: IResolvablePromise<Session>;
  }[] = [];

  public static async start() {
    if (this.isStarted) {
      throw new Error('GlobalPool is already started');
    }
    if (!this.chromeCore) {
      log.info('StartingGlobalPool');
      this.mitmServer = await MitmServer.start(this.localProxyPortStart);
      this.chromeCore = new ChromeCore();
      await this.chromeCore.start(this.mitmServer.port);
    }
    await this.chromeCore.isReady();
    this.resolveWaitingConnection();
  }

  public static async createSession(options: ICreateSessionOptions) {
    await this.start();
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

  public static getSession(sessionId: string): Session {
    return this.chromeCore.getSession(sessionId);
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
    if (this.chromeCore) {
      await this.chromeCore.close();
    }
    if (this.mitmServer) {
      await this.mitmServer.close();
    }
    SessionsDb.shutdown();
    this.waitingForAvailability = [];
    this.chromeCore = null;
    this.mitmServer = null;
    this._isStarted = false;

    log.stats('CompletedGlobalPoolShutdown', { parentLogId: logId, sessionId: null });
  }

  private static async createSessionNow(
    options: ICreateSessionOptions,
    isRetry = false,
  ): Promise<Session> {
    this._activeSessionCount += 1;
    try {
      return await this.chromeCore.createSession(options);
    } catch (err) {
      this._activeSessionCount -= 1;

      if (!isRetry && String(err).includes('WebSocket is not open: readyState 3 (CLOSED)')) {
        await this.chromeCore.close();
        await this.chromeCore.start(this.mitmServer.port);
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
