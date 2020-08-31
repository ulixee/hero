import { v1 as uuidv1 } from 'uuid';
import puppeteer from 'puppeteer-core';
import Log from '@secret-agent/commons/Logger';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import { UpstreamProxy as MitmUpstreamProxy } from '@secret-agent/mitm';
import SessionState from '@secret-agent/session-state';
import Emulators, { EmulatorPlugin } from '@secret-agent/emulators';
import Humanoids, { HumanoidPlugin } from '@secret-agent/humanoids';
import RequestSession from '@secret-agent/mitm/handlers/RequestSession';
import * as Os from 'os';
import GlobalPool from './GlobalPool';
import UserProfile from './UserProfile';
import Window from './Window';

const { log } = Log(module);

export default class Session {
  private static readonly byId: { [id: string]: Session } = {};

  public readonly id: string = uuidv1();
  public readonly baseDir: string;
  public window?: Window;
  public emulator: EmulatorPlugin;
  public humanoid: HumanoidPlugin;
  public proxy: MitmUpstreamProxy;
  public readonly requestMitmProxySession: RequestSession;
  public sessionState: SessionState;

  private isShuttingDown = false;
  private puppContext?: puppeteer.BrowserContext;

  constructor(readonly options: ICreateSessionOptions) {
    Session.byId[this.id] = this;
    const emulatorId = Emulators.getId(options.emulatorId);
    this.emulator = Emulators.create(emulatorId);
    if (options.userProfile) {
      this.emulator.setUserProfile(options.userProfile);
    }
    if (!this.emulator.canPolyfill) {
      log.warn('Emulator.PolyfillNotSupported', {
        sessionId: this.id,
        emulatorId,
        userAgent: this.emulator.userAgent,
        runtimeOs: Os.platform(),
      });
    }

    const humanoidId = options.humanoidId ?? Humanoids.getRandomId();
    this.humanoid = Humanoids.create(humanoidId);

    this.baseDir = GlobalPool.sessionsDir;
    this.sessionState = new SessionState(
      this.baseDir,
      this.id,
      options.sessionName,
      options.scriptInstanceMeta,
      emulatorId,
      humanoidId,
      this.emulator.canPolyfill,
    );
    this.proxy = new MitmUpstreamProxy(this.id);
    this.requestMitmProxySession = new RequestSession(
      this.id,
      this.emulator.userAgent.raw,
      this.proxy.isReady(),
    );

    this.requestMitmProxySession.delegate = this.emulator.delegate;
  }

  public async close() {
    delete Session.byId[this.id];
    if (this.isShuttingDown) {
      return;
    }
    this.isShuttingDown = true;
    // so named so you don't move this after window.close!
    await this.sessionState.saveBeforeWindowClose();
    await this.window?.close();
    await this.requestMitmProxySession.close();
    await this.proxy.close();
    try {
      await this.puppContext?.close();
    } catch (error) {
      log.error('ErrorClosingWindow', { error, sessionId: this.id });
    }
  }

  public async initialize(puppContext: puppeteer.BrowserContext) {
    this.puppContext = puppContext;
    const puppPage = await puppContext.newPage();
    this.window = await Window.create(this.sessionState, this, puppPage);

    // install user profile before page boots up
    await UserProfile.install(this.options.userProfile, this.window);

    await this.window.start();
    return this;
  }

  public static get(sessionId: string): Session {
    return this.byId[sessionId];
  }
}
