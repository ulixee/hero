import { v1 as uuidv1 } from 'uuid';
import Log from '@secret-agent/commons/Logger';
import ICreateTabOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import { UpstreamProxy as MitmUpstreamProxy } from '@secret-agent/mitm';
import SessionState from '@secret-agent/session-state';
import Emulators, { EmulatorPlugin } from '@secret-agent/emulators';
import Humanoids, { HumanoidPlugin } from '@secret-agent/humanoids';
import RequestSession, {
  IRequestSessionRequestEvent,
  IRequestSessionResponseEvent,
} from '@secret-agent/mitm/handlers/RequestSession';
import * as Os from 'os';
import IPuppetContext from '@secret-agent/puppet/interfaces/IPuppetContext';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import IBrowserEmulation from '@secret-agent/puppet/interfaces/IBrowserEmulation';
import { IPuppetPage } from '@secret-agent/puppet/interfaces/IPuppetPage';
import GlobalPool from './GlobalPool';
import Tab from './Tab';
import UserProfile from './UserProfile';

const { log } = Log(module);

export default class Session {
  private static readonly byId: { [id: string]: Session } = {};

  public readonly id: string;
  public readonly baseDir: string;
  public emulator: EmulatorPlugin;
  public humanoid: HumanoidPlugin;
  public proxy: MitmUpstreamProxy;
  public readonly mitmRequestSession: RequestSession;
  public sessionState: SessionState;
  public browserContext?: IPuppetContext;
  public userProfile?: IUserProfile;

  public tabs: Tab[] = [];

  public get isClosing() {
    return this._isClosing;
  }

  private _isClosing = false;

  constructor(readonly options: ICreateTabOptions) {
    this.id = uuidv1();
    Session.byId[this.id] = this;
    const emulatorId = Emulators.getId(options.emulatorId);
    this.emulator = Emulators.create(emulatorId);
    if (options.userProfile) {
      this.userProfile = options.userProfile;
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

    const humanoidId = options.humanoidId || Humanoids.getRandomId();
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
    this.mitmRequestSession = new RequestSession(
      this.id,
      this.emulator.userAgent.raw,
      this.proxy.isReady(),
    );

    this.mitmRequestSession.delegate = this.emulator.delegate;
  }

  public getBrowserEmulation() {
    const emulator = this.emulator;
    return {
      acceptLanguage: 'en-US,en',
      userAgent: emulator.userAgent.raw,
      platform: emulator.userAgent.platform,
      proxyPassword: this.id,
    } as IBrowserEmulation;
  }

  public async initialize(context: IPuppetContext) {
    this.browserContext = context;
    if (this.userProfile) {
      await UserProfile.install(this);
    }

    const requestSession = this.mitmRequestSession;
    requestSession.on('request', this.onMitmRequest.bind(this));
    requestSession.on('response', this.onMitmResponse.bind(this));
  }

  public async createTab() {
    const page = await this.newPage();

    // if first tab, install session storage
    if (!this.tabs.length && this.userProfile?.storage) {
      await UserProfile.installSessionStorage(this, page);
    }

    const tab = Tab.create(this, page);
    this.registerTab(tab, page);
    await tab.isReady;
    return tab;
  }

  public async close() {
    delete Session.byId[this.id];
    if (this._isClosing) return;
    this._isClosing = true;

    for (const tab of Object.values(this.tabs)) {
      await tab.close();
    }
    await this.mitmRequestSession.close();
    await this.proxy.close();
    await this.sessionState.close();
    try {
      await this.browserContext?.close();
    } catch (error) {
      log.error('ErrorClosingSession', { error, sessionId: this.id });
    }
  }

  private onMitmRequest(event: IRequestSessionRequestEvent) {
    // don't know the tab id at this point
    this.sessionState.captureResource(null, event, false);
  }

  private onMitmResponse(event: IRequestSessionResponseEvent) {
    const tabId = this.mitmRequestSession.browserRequestIdToTabId.get(event.browserRequestId);
    let tab = this.tabs.find(x => x.id === tabId);
    if (!tab && event.browserRequestId === 'fallback-navigation') {
      tab = this.tabs.find(x => x.url === event.request.url || x.url === event.redirectedToUrl);
    }

    const resource = this.sessionState.captureResource(tab?.id ?? tabId, event, true);
    tab?.emit('resource', resource);
  }

  private async onNewTab(
    parentTab: Tab,
    page: IPuppetPage,
    openParams: { url: string; windowName: string } | null,
  ) {
    const tab = Tab.create(this, page, parentTab, openParams);
    this.registerTab(tab, page);
    await tab.isReady;
    parentTab.emit('child-tab-created', tab);
    return tab;
  }

  private registerTab(tab: Tab, page: IPuppetPage) {
    this.tabs.push(tab);
    tab.on('close', this.removeTab.bind(this, tab));
    page.popupInitializeFn = this.onNewTab.bind(this, tab);
    return tab;
  }

  private removeTab(tab: Tab) {
    const tabIdx = this.tabs.indexOf(tab);
    if (tabIdx >= 0) this.tabs.splice(tabIdx, 1);
  }

  private async newPage() {
    if (this._isClosing) throw new Error('Cannot create tab, shutting down');
    return await this.browserContext.newPage();
  }

  public static get(sessionId: string): Session {
    return this.byId[sessionId];
  }
}
