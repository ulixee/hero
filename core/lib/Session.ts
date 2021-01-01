import { v1 as uuidv1 } from 'uuid';
import Log from '@secret-agent/commons/Logger';
import ICreateTabOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import RequestSession, {
  IRequestSessionHttpErrorEvent,
  IRequestSessionRequestEvent,
  IRequestSessionResponseEvent,
  IResourceStateChangeEvent,
  ISocketEvent,
} from '@secret-agent/mitm/handlers/RequestSession';
import * as Os from 'os';
import IPuppetContext, {
  IPuppetContextEvents,
} from '@secret-agent/puppet-interfaces/IPuppetContext';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import IBrowserEmulationSettings from '@secret-agent/puppet-interfaces/IBrowserEmulationSettings';
import { IPuppetPage } from '@secret-agent/puppet-interfaces/IPuppetPage';
import IViewport from '@secret-agent/core-interfaces/IViewport';
import IHumanEmulator from '@secret-agent/core-interfaces/IHumanEmulator';
import IBrowserEmulator from '@secret-agent/core-interfaces/IBrowserEmulator';
import IBrowserEngine from '@secret-agent/core-interfaces/IBrowserEngine';
import IConfigureSessionOptions from '@secret-agent/core-interfaces/IConfigureSessionOptions';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import ICoreEventPayload from '@secret-agent/core-interfaces/ICoreEventPayload';
import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';
import SessionState from './SessionState';
import Viewports from './Viewports';
import AwaitedEventListener from './AwaitedEventListener';
import GlobalPool from './GlobalPool';
import Tab from './Tab';
import UserProfile from './UserProfile';
import BrowserEmulators from './BrowserEmulators';
import HumanEmulators from './HumanEmulators';

const { log } = Log(module);

export default class Session extends TypedEventEmitter<{
  closing: void;
  closed: void;
  'awaited-event': ICoreEventPayload;
}> {
  private static readonly byId: { [id: string]: Session } = {};

  public awaitedEventListener: AwaitedEventListener;
  public readonly id: string;
  public readonly baseDir: string;
  public browserEngine: IBrowserEngine;
  public browserEmulator: IBrowserEmulator;
  public humanEmulator: IHumanEmulator;
  public upstreamProxyUrl: string | null;
  public readonly mitmRequestSession: RequestSession;
  public sessionState: SessionState;
  public browserContext?: IPuppetContext;
  public userProfile?: IUserProfile;

  public viewport: IViewport;
  public timezoneId?: string;

  public tabs: Tab[] = [];

  public readonly humanEmulatorId: string;
  public readonly browserEmulatorId: string;

  public get isClosing() {
    return this._isClosing;
  }

  private _isClosing = false;
  private pendingNavigationMitmResponses: IRequestSessionResponseEvent[] = [];

  constructor(readonly options: ICreateTabOptions) {
    super();
    this.id = uuidv1();
    Session.byId[this.id] = this;
    this.awaitedEventListener = new AwaitedEventListener(this);
    this.browserEmulatorId = BrowserEmulators.getId(options.browserEmulatorId);
    const BrowserEmulator = BrowserEmulators.getClass(this.browserEmulatorId);
    this.browserEngine = BrowserEmulator.engine;
    this.browserEmulator = new BrowserEmulator();
    if (options.userProfile) {
      this.userProfile = options.userProfile;
      this.browserEmulator.userProfile = options.userProfile;
      this.browserEmulator.sessionId = this.id;
    }
    this.upstreamProxyUrl = options.upstreamProxyUrl;

    if (options.locale) this.browserEmulator.locale = options.locale;

    if (!this.browserEmulator.canPolyfill) {
      log.info('BrowserEmulators.PolyfillNotSupported', {
        sessionId: this.id,
        browserEmulatorId: this.browserEmulatorId,
        userAgentString: this.browserEmulator.userAgentString,
        runtimeOs: Os.platform(),
      });
    }

    this.timezoneId = options.timezoneId ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.viewport = options.viewport;
    if (!this.viewport) {
      this.viewport = Viewports.getDefault(
        this.browserEmulator.windowFraming,
        this.browserEmulator.windowFramingBase,
      );
    }

    this.humanEmulatorId = options.humanEmulatorId || HumanEmulators.getRandomId();
    this.humanEmulator = HumanEmulators.create(this.humanEmulatorId);

    this.baseDir = GlobalPool.sessionsDir;
    this.sessionState = new SessionState(
      this.baseDir,
      this.id,
      options.sessionName,
      options.scriptInstanceMeta,
      this.browserEmulatorId,
      this.humanEmulatorId,
      this.browserEmulator.canPolyfill,
      this.viewport,
      this.timezoneId,
    );
    this.mitmRequestSession = new RequestSession(
      this.id,
      this.browserEmulator.userAgentString,
      this.upstreamProxyUrl,
      this.browserEmulator.networkInterceptorDelegate,
    );
  }

  public getTab(id: string): Tab {
    return this.tabs.find(x => x.id === id);
  }

  public async configure(options: IConfigureSessionOptions) {
    if (options.upstreamProxyUrl !== undefined) {
      this.upstreamProxyUrl = options.upstreamProxyUrl;
      this.mitmRequestSession.upstreamProxyUrl = options.upstreamProxyUrl;
    }
    if (options.blockedResourceTypes !== undefined) {
      for (const tab of this.tabs) await tab.setBlockedResourceTypes(options.blockedResourceTypes);
    }
    if (options.viewport !== undefined) this.viewport = options.viewport;
    if (options.userProfile !== undefined) {
      this.userProfile = options.userProfile;
      this.browserEmulator.userProfile = this.userProfile;
    }
    if (options.locale) this.browserEmulator.locale = options.locale;
    if (options.timezoneId) this.timezoneId = options.timezoneId;
    if (this.browserContext) {
      this.browserContext.emulation = this.getBrowserEmulation();
    }
  }

  public getBrowserEmulation() {
    const browserEmulator = this.browserEmulator;
    return {
      locale: browserEmulator.locale,
      userAgent: browserEmulator.userAgentString,
      platform: browserEmulator.osPlatform,
      proxyPassword: this.id,
      viewport: this.viewport,
      timezoneId: this.timezoneId,
    } as IBrowserEmulationSettings;
  }

  public async initialize(context: IPuppetContext) {
    this.browserContext = context;
    context.on('devtools-message', this.onDevtoolsMessage.bind(this));
    if (this.userProfile) {
      await UserProfile.install(this);
    }

    const requestSession = this.mitmRequestSession;
    requestSession.on('request', this.onMitmRequest.bind(this));
    requestSession.on('response', this.onMitmResponse.bind(this));
    requestSession.on('http-error', this.onMitmError.bind(this));
    requestSession.on('resource-state', this.onResourceStates.bind(this));
    requestSession.on('socket-close', this.onSocketClose.bind(this));
    requestSession.on('socket-connect', this.onSocketConnect.bind(this));
  }

  public async createTab() {
    const page = await this.newPage();

    // if first tab, install session storage
    if (!this.tabs.length && this.userProfile?.storage) {
      await UserProfile.installSessionStorage(this, page);
    }

    const tab = Tab.create(this, page);
    this.sessionState.captureTab(tab.id, page.id, page.devtoolsSessionId);
    this.registerTab(tab, page);
    await tab.isReady;
    return tab;
  }

  public async close() {
    delete Session.byId[this.id];
    if (this._isClosing) return;
    this.emit('closing');
    this._isClosing = true;
    const start = log.info('Session.Closing', {
      sessionId: this.id,
    });

    this.pendingNavigationMitmResponses.forEach(x => this.onMitmResponse(x));

    await this.mitmRequestSession.close();
    await Promise.all(Object.values(this.tabs).map(x => x.close()));
    try {
      await this.browserContext?.close();
    } catch (error) {
      log.error('ErrorClosingSession', { error, sessionId: this.id });
    }
    log.stats('Session.Closed', {
      sessionId: this.id,
      parentLogId: start,
    });
    this.emit('closed');
    // should go last so we can capture logs
    this.sessionState.close();
  }

  public onAwaitedEvent(payload: ICoreEventPayload) {
    this.emit('awaited-event', payload);
  }

  private onDevtoolsMessage(event: IPuppetContextEvents['devtools-message']) {
    this.sessionState.captureDevtoolsMessage(event);
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
      if (!tab) {
        return this.pendingNavigationMitmResponses.push(event);
      }
    }

    const resource = this.sessionState.captureResource(tab?.id ?? tabId, event, true);
    tab?.emit('resource', resource);
  }

  private onMitmError(event: IRequestSessionHttpErrorEvent) {
    const tabId = this.mitmRequestSession.browserRequestIdToTabId.get(
      event.request.browserRequestId,
    );

    this.sessionState.captureResourceError(tabId, event.request, event.error);
  }

  private onResourceStates(event: IResourceStateChangeEvent) {
    this.sessionState.captureResourceState(event.context.id, event.context.stateChanges);
  }

  private onSocketClose(event: ISocketEvent) {
    this.sessionState.captureSocketEvent(event);
  }

  private onSocketConnect(event: ISocketEvent) {
    this.sessionState.captureSocketEvent(event);
  }

  private async onNewTab(
    parentTab: Tab,
    page: IPuppetPage,
    openParams: { url: string; windowName: string } | null,
  ) {
    const startUrl = page.mainFrame.url;
    const tab = Tab.create(this, page, parentTab, openParams);
    this.sessionState.captureTab(tab.id, page.id, page.devtoolsSessionId, parentTab.id);
    this.registerTab(tab, page);
    await tab.isReady;
    parentTab.emit('child-tab-created', tab);
    // make sure we match browser requests that weren't associated with a tab to the new tab
    if (this.pendingNavigationMitmResponses.length) {
      const replayPending = [...this.pendingNavigationMitmResponses];
      this.pendingNavigationMitmResponses.length = 0;
      while (replayPending.length) {
        const next = replayPending.pop();
        if (next.redirectedToUrl === startUrl || next.request.url === startUrl) {
          const resource = this.sessionState.captureResource(tab.id, next, true);
          tab.emit('resource', resource);
        }
      }
    }
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
    if (this.tabs.length === 0) {
      return this.close();
    }
  }

  private async newPage() {
    if (this._isClosing) throw new Error('Cannot create tab, shutting down');
    return await this.browserContext.newPage();
  }

  public static get(sessionId: string): Session {
    return this.byId[sessionId];
  }

  public static getTab(meta: ISessionMeta): Tab | undefined {
    if (!meta) return undefined;
    return this.get(meta.sessionId)?.getTab(meta.tabId);
  }
}
