import { v1 as uuidv1 } from 'uuid';
import puppeteer from 'puppeteer';
import Log from '@secret-agent/commons/Logger';
import Window from './Window';
import ChromeCore from './ChromeCore';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import { UpstreamProxy as MitmUpstreamProxy } from '@secret-agent/mitm';
import SessionState from '@secret-agent/session-state';
import Emulators, { EmulatorPlugin } from '@secret-agent/emulators';
import Humanoids, { HumanoidPlugin } from '@secret-agent/humanoids';
import RequestSession from '@secret-agent/mitm/handlers/RequestSession';
import GlobalPool from './GlobalPool';
import UserProfile from './UserProfile';

const { log } = Log(module);

export default class Session {
  public readonly id: string = uuidv1();
  public readonly baseDir: string;
  public window: Window;
  public emulator: EmulatorPlugin;
  public humanoid: HumanoidPlugin;
  public proxy: MitmUpstreamProxy;
  public readonly requestMitmProxySession: RequestSession;
  public sessionState: SessionState;
  private isShuttingDown: boolean = false;
  private readonly initializePromise;

  constructor(
    public puppContext: puppeteer.BrowserContext,
    public chromeCore: ChromeCore,
    readonly options: ICreateSessionOptions,
  ) {
    this.emulator = Emulators.get(options.emulatorId);
    if (options.userProfile) {
      this.emulator.setUserProfile(options.userProfile);
    }
    this.humanoid = options.humanoidId ? Humanoids.get(options.humanoidId) : Humanoids.getRandom();
    this.baseDir = GlobalPool.sessionsDir;
    this.sessionState = new SessionState(
      this.baseDir,
      this.id,
      options.sessionName,
      options.scriptInstanceMeta,
    );
    this.initializePromise = this.initialize();
    this.initializePromise.catch(error => log.error('Session.InitializeError', error));
    this.proxy = new MitmUpstreamProxy(this.id);
    this.requestMitmProxySession = new RequestSession(
      this.id,
      this.emulator.userAgent.raw,
      this.proxy.isReady(),
    );

    this.requestMitmProxySession.delegate = this.emulator.delegate;
  }

  public isInitialized() {
    return this.initializePromise;
  }

  public async close() {
    if (this.isShuttingDown) {
      return;
    }
    this.isShuttingDown = true;
    // so named so you don't move this after window.close!
    await this.sessionState.saveBeforeWindowClose();
    await this.requestMitmProxySession.close();
    await this.proxy.close();
    await this.window.close();
    this.chromeCore.cleanupSession(this.id);

    if (!this.chromeCore.isShuttingDown) {
      try {
        await this.puppContext.close();
      } catch (error) {
        log.error('ErrorClosingWindow', error);
      }
    }
  }

  private async initialize() {
    if (this.initializePromise) {
      throw new Error('Session instance has already been initialized');
    }

    this.window = await Window.create(this.sessionState, this);

    // install user profile before page boots up
    await UserProfile.install(this.options.userProfile, this.window);

    await this.window.start();
  }

  public static async create(
    puppBrowser: puppeteer.Browser,
    chromeCore: ChromeCore,
    options: ICreateSessionOptions,
  ) {
    const puppContext = await puppBrowser.createIncognitoBrowserContext();
    const session = new Session(puppContext, chromeCore, options);
    await session.isInitialized();
    return session;
  }
}
