import { nanoid } from 'nanoid';
import Log, { ILogEntry, LogEvents, loggerSessionIdNames } from '@ulixee/commons/lib/Logger';
import RequestSession, {
  IRequestSessionHttpErrorEvent,
  IRequestSessionRequestEvent,
  IRequestSessionResponseEvent,
  IResourceStateChangeEvent,
  ISocketEvent,
} from '@ulixee/hero-mitm/handlers/RequestSession';
import IPuppetContext, { IPuppetContextEvents } from '@ulixee/hero-interfaces/IPuppetContext';
import IUserProfile from '@ulixee/hero-interfaces/IUserProfile';
import { IPuppetPage } from '@ulixee/hero-interfaces/IPuppetPage';
import IBrowserEngine from '@ulixee/hero-interfaces/IBrowserEngine';
import IConfigureSessionOptions from '@ulixee/hero-interfaces/IConfigureSessionOptions';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { MitmProxy } from '@ulixee/hero-mitm/index';
import IViewport from '@ulixee/hero-interfaces/IViewport';
import IJsPathResult from '@ulixee/hero-interfaces/IJsPathResult';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import IGeolocation from '@ulixee/hero-interfaces/IGeolocation';
import { ISessionSummary } from '@ulixee/hero-interfaces/ICorePlugin';
import IHeroMeta from '@ulixee/hero-interfaces/IHeroMeta';
import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import GlobalPool from './GlobalPool';
import Tab from './Tab';
import UserProfile from './UserProfile';
import InjectedScripts from './InjectedScripts';
import CommandRecorder from './CommandRecorder';
import CorePlugins from './CorePlugins';
import Core from '../index';
import SessionDb from '../dbs/SessionDb';
import { ICommandableTarget } from './CommandRunner';
import Resources from './Resources';
import Commands from './Commands';
import WebsocketMessages from './WebsocketMessages';
import SessionsDb from '../dbs/SessionsDb';
import { IRemoteEmitFn, IRemoteEventListener } from '../interfaces/IRemoteEventListener';

const { log } = Log(module);

export default class Session
  extends TypedEventEmitter<{
    closing: void;
    closed: { waitForPromise?: Promise<any> };
    resumed: void;
    'will-close': { waitForPromise?: Promise<any> };
    'kept-alive': { message: string };
    'tab-created': { tab: Tab };
    'all-tabs-closed': void;
  }>
  implements ICommandableTarget, IRemoteEventListener
{
  private static readonly byId: { [id: string]: Session } = {};

  public readonly id: string;
  public readonly baseDir: string;
  public readonly plugins: CorePlugins;

  public get browserEngine(): IBrowserEngine {
    return this.plugins.browserEngine;
  }

  public get viewport(): IViewport {
    return this.options.viewport;
  }

  public get timezoneId(): string {
    return this.options.timezoneId;
  }

  public get locale(): string {
    return this.options.locale;
  }

  public get geolocation(): IGeolocation {
    return this.options.geolocation;
  }

  public get userProfile(): IUserProfile {
    return this.options.userProfile;
  }

  public get mode(): ISessionCreateOptions['mode'] {
    return this.options.mode;
  }

  public readonly createdTime: number;

  public readonly mitmRequestSession: RequestSession;
  public browserContext?: IPuppetContext;
  public resources: Resources;
  public commands: Commands;
  public websocketMessages: WebsocketMessages;
  public readonly db: SessionDb;

  public tabsById = new Map<number, Tab>();

  public get isClosing(): boolean {
    return this._isClosing;
  }

  public get summary(): ISessionSummary {
    return {
      id: this.id,
      options: { ...this.options },
    };
  }

  public get meta(): IHeroMeta {
    const { plugins, viewport, locale, timezoneId, geolocation } = this;

    const { userAgentString, operatingSystemPlatform } = this.plugins.browserEmulator;

    return {
      sessionId: this.id,
      ...this.options,
      browserEmulatorId: plugins.browserEmulator.id,
      humanEmulatorId: plugins.humanEmulator.id,
      upstreamProxyUrl: this.options.upstreamProxyUrl,
      upstreamProxyIpMask: this.options.upstreamProxyIpMask,
      viewport,
      locale,
      timezoneId,
      geolocation,
      userAgentString,
      operatingSystemPlatform,
    };
  }

  public awaitedEventEmitter = new TypedEventEmitter<{ close: void }>();

  protected readonly logger: IBoundLog;

  private hasLoadedUserProfile = false;
  private commandRecorder: CommandRecorder;
  private isolatedMitmProxy?: MitmProxy;
  private _isClosing = false;
  private isResettingState = false;
  private detachedTabsById = new Map<number, Tab>();
  private readonly logSubscriptionId: number;

  constructor(readonly options: ISessionCreateOptions) {
    super();
    this.createdTime = Date.now();
    this.id = this.getId(options.sessionId);
    Session.byId[this.id] = this;
    this.db = new SessionDb(this.id);

    this.logger = log.createChild(module, { sessionId: this.id });
    loggerSessionIdNames.set(this.id, options.sessionName);
    this.logSubscriptionId = LogEvents.subscribe(this.recordLog.bind(this));

    const providedOptions = { ...options };
    const { userProfile, userAgent } = options;

    this.plugins = new CorePlugins(
      {
        ...options,
        userAgentSelector: userAgent ?? userProfile?.userAgentString,
        deviceProfile: userProfile?.deviceProfile,
        getSessionSummary: () => this.summary,
      },
      this.logger,
    );
    this.configureHeaded(options);
    this.plugins.configure(options);

    // should come after plugins can initiate
    this.recordSession(providedOptions);

    SessionsDb.find().recordSession(this);

    this.mitmRequestSession = new RequestSession(
      this.id,
      this.plugins,
      this.options.upstreamProxyUrl,
    );
    this.mitmRequestSession.respondWithHttpErrorStacks =
      this.mode === 'development' && this.options.showBrowserInteractions === true;
    this.resources = new Resources(this, this.mitmRequestSession.browserRequestMatcher);
    this.websocketMessages = new WebsocketMessages(this.db);
    this.commands = new Commands(this.db);
    this.commandRecorder = new CommandRecorder(this, this, null, null, [
      this.configure,
      this.detachTab,
      this.close,
      this.flush,
      this.exportUserProfile,
      this.getTabs,
      this.getHeroMeta,
      this.addRemoteEventListener,
      this.removeRemoteEventListener,
    ]);
  }

  public configureHeaded(
    options: Pick<ISessionCreateOptions, 'showBrowser' | 'showBrowserInteractions'>,
  ): void {
    this.options.showBrowser = options.showBrowser ?? false;
    this.options.showBrowserInteractions = options.showBrowserInteractions ?? options.showBrowser;

    this.browserEngine.isHeaded = this.options.showBrowser;
  }

  public isAllowedCommand(method: string): boolean {
    return this.commandRecorder.fnNames.has(method);
  }

  public canReuseCommand(command: ICommandMeta): boolean {
    if (command.name === 'close') return false;
    return true;
  }

  public getTab(id: number): Tab {
    return this.tabsById.get(id) ?? this.detachedTabsById.get(id);
  }

  public getTabs(): Promise<Tab[]> {
    return Promise.resolve([...this.tabsById.values()].filter(x => !x.isClosing));
  }

  public flush(): Promise<void> {
    this.logger.info('SessionFlushing');
    return Promise.resolve();
  }

  public getHeroMeta(): Promise<IHeroMeta> {
    return Promise.resolve(this.meta);
  }

  public async configure(options: IConfigureSessionOptions): Promise<void> {
    Object.assign(this.options, options);
    this.mitmRequestSession.upstreamProxyUrl = this.options.upstreamProxyUrl;

    if (options.blockedResourceTypes !== undefined) {
      for (const tab of this.tabsById.values()) {
        await tab.setBlockedResourceTypes(options.blockedResourceTypes);
      }
    }
    this.plugins.configure(options);
  }

  public async detachTab(
    sourceTabId: number,
    callsite: string,
    key?: string,
  ): Promise<{
    detachedTab: Tab;
    prefetchedJsPaths: IJsPathResult[];
  }> {
    const sourceTab = this.getTab(sourceTabId);

    const detachedState = await sourceTab.createDetachedState(callsite, key);

    const newTab = await detachedState.openInNewTab(this.browserContext, this.viewport);

    this.recordTab(
      newTab.id,
      newTab.puppetPage.id,
      newTab.puppetPage.devtoolsSession.id,
      sourceTab.id,
      detachedState.detachedAtCommandId,
    );
    this.detachedTabsById.set(newTab.id, newTab);
    newTab.on('close', () => {
      if (newTab.mainFrameEnvironment.jsPath.hasNewExecJsPathHistory) {
        detachedState.saveHistory(newTab.mainFrameEnvironment.jsPath.execHistory);
      }

      this.detachedTabsById.delete(newTab.id);
    });

    const jsPathCalls = detachedState.getJsPathHistory();
    const prefetches = await newTab.mainFrameEnvironment.prefetchExecJsPaths(jsPathCalls);
    return { detachedTab: newTab, prefetchedJsPaths: prefetches };
  }

  public getMitmProxy(): { address: string; password?: string } {
    return {
      address: this.isolatedMitmProxy ? `localhost:${this.isolatedMitmProxy.port}` : null,
      password: this.isolatedMitmProxy ? null : this.id,
    };
  }

  public useIncognitoContext(): boolean {
    const isChromeAlive =
      this.options.showBrowser === true &&
      this.options.sessionKeepAlive === true &&
      this.mode === 'development';
    return isChromeAlive === false;
  }

  public async registerWithMitm(
    sharedMitmProxy: MitmProxy,
    doesPuppetSupportBrowserContextProxy: boolean,
  ): Promise<void> {
    let mitmProxy = sharedMitmProxy;
    if (doesPuppetSupportBrowserContextProxy && this.useIncognitoContext()) {
      this.isolatedMitmProxy = await MitmProxy.start(GlobalPool.localProxyPortStart, Core.dataDir);
      mitmProxy = this.isolatedMitmProxy;
    }

    mitmProxy.registerSession(this.mitmRequestSession, !!this.isolatedMitmProxy);
  }

  public async initialize(context: IPuppetContext): Promise<void> {
    this.browserContext = context;
    context.on('devtools-message', this.onDevtoolsMessage.bind(this));
    if (this.userProfile) {
      await UserProfile.install(this);
    }

    context.defaultPageInitializationFn = page =>
      InjectedScripts.install(page, this.options.showBrowserInteractions);

    const requestSession = this.mitmRequestSession;
    requestSession.on('request', this.onMitmRequest.bind(this));
    requestSession.on('response', this.onMitmResponse.bind(this));
    requestSession.on('http-error', this.onMitmError.bind(this));
    requestSession.on('resource-state', this.onResourceStates.bind(this));
    requestSession.on('socket-close', this.onSocketClose.bind(this));
    requestSession.on('socket-connect', this.onSocketConnect.bind(this));
    await this.plugins.onHttpAgentInitialized(requestSession.requestAgent);
  }

  public exportUserProfile(): Promise<IUserProfile> {
    return UserProfile.export(this);
  }

  public async createTab(): Promise<Tab> {
    const page = await this.newPage();

    // if first tab, install session storage
    if (!this.hasLoadedUserProfile && this.userProfile?.storage) {
      await UserProfile.installSessionStorage(this, page);
      this.hasLoadedUserProfile = true;
    }

    const first = this.tabsById.size === 0;
    const tab = Tab.create(this, page);
    this.recordTab(tab.id, page.id, page.devtoolsSession.id);
    this.registerTab(tab, page);
    await tab.isReady;
    if (first) this.db.session.updateConfiguration(this.id, this.meta);
    return tab;
  }

  public getLastActiveTab(): Tab {
    for (let idx = this.commands.history.length - 1; idx >= 0; idx -= 1) {
      const command = this.commands.history[idx];
      if (command.tabId) {
        const tab = this.tabsById.get(command.tabId);
        if (tab && !tab.isClosing) return tab;
      }
    }
    // if there are open tabs, send these as next option
    for (const tab of this.tabsById.values()) {
      if (!tab.isClosing) return tab;
    }
    return null;
  }

  public async resetStorage(): Promise<void> {
    const securityOrigins = new Set<string>();
    this.isResettingState = true;
    try {
      for (const tab of this.tabsById.values()) {
        const clearPromises: Promise<void>[] = [];
        for (const frame of tab.frameEnvironmentsById.values()) {
          const origin = frame.puppetFrame.securityOrigin;
          if (!securityOrigins.has(origin)) {
            const promise = tab.puppetPage.devtoolsSession
              .send('Storage.clearDataForOrigin', {
                origin,
                storageTypes: 'all',
              })
              .catch(err => err);
            clearPromises.push(promise);
            securityOrigins.add(origin);
          }
        }
        await Promise.all(clearPromises);
        await tab.close();
      }
      // after we're all the way cleared, install user profile again
      if (this.userProfile) {
        await UserProfile.install(this);
      }
      // pop a new tab on
      await this.createTab();
    } finally {
      this.isResettingState = false;
    }
  }

  public async close(force = false): Promise<{ didKeepAlive: boolean; message?: string }> {
    // if this session is set to keep alive and core isn't closing
    if (
      !force &&
      this.options.sessionKeepAlive &&
      !Core.isClosing &&
      !this.commands.requiresScriptRestart
    ) {
      return await this.keepAlive();
    }

    delete Session.byId[this.id];
    if (this._isClosing) return;
    this._isClosing = true;

    await this.willClose();

    this.awaitedEventEmitter.emit('close');
    this.emit('closing');
    const start = log.info('Session.Closing', {
      sessionId: this.id,
    });

    try {
      const promises: Promise<any>[] = [];
      for (const tab of this.tabsById.values()) {
        promises.push(tab.close());
      }
      for (const tab of this.detachedTabsById.values()) {
        promises.push(tab.close());
      }
      await Promise.all(promises);
      this.mitmRequestSession.close();
      if (this.isolatedMitmProxy) this.isolatedMitmProxy.close();
    } catch (error) {
      log.error('Session.CloseMitmError', { error, sessionId: this.id });
    }

    log.stats('Session.Closed', {
      sessionId: this.id,
      parentLogId: start,
    });

    const closedEvent = { waitForPromise: null };
    this.emit('closed', closedEvent);
    await closedEvent.waitForPromise;
    // should go last so we can capture logs
    this.db.session.close(this.id, Date.now());
    LogEvents.unsubscribe(this.logSubscriptionId);
    loggerSessionIdNames.delete(this.id);
    this.db.flush();

    // give the system a second to write to db before clearing
    setImmediate(() => {
      try {
        this.db.close();
      } catch (err) {
        // drown
      }
    });
  }

  public addRemoteEventListener(
    type: string,
    emitFn: IRemoteEmitFn,
  ): Promise<{ listenerId: string }> {
    const listener = this.commands.observeRemoteEvents(type, emitFn);
    this.awaitedEventEmitter.on(type as any, listener.listenFn);
    return Promise.resolve({ listenerId: listener.id });
  }

  public removeRemoteEventListener(listenerId: string): Promise<any> {
    const details = this.commands.getRemoteEventListener(listenerId);
    this.awaitedEventEmitter.off(details.type as any, details.listenFn);
    return Promise.resolve();
  }

  private async willClose(): Promise<void> {
    const willCloseEvent = { waitForPromise: null };
    this.emit('will-close', willCloseEvent);
    await willCloseEvent.waitForPromise;
  }

  private async keepAlive(): Promise<{ didKeepAlive: boolean; message?: string }> {
    await this.willClose();
    const result = { didKeepAlive: false, message: null };
    result.message = `This session has the "sessionKeepAlive" variable active. Your Chrome session will remain open until you terminate this Hero instance.`;
    result.didKeepAlive = true;
    this.emit('kept-alive', result);
    for (const tab of this.tabsById.values()) {
      await tab.flushDomChanges();
    }
    return result;
  }

  private async resume(options: ISessionCreateOptions): Promise<void> {
    const { sessionResume } = options;
    if (sessionResume.startLocation === 'sessionStart') {
      await this.resetStorage();
      // create a new tab
    }
    Object.assign(this.options, options);
    this.commands.resumeCounter += 1;
    this.emit('resumed');
  }

  private getId(sessionId?: string): string {
    if (sessionId) {
      if (Session.byId[sessionId]) {
        throw new Error('The pre-provided sessionId is already in use.');
      }
      // make sure this is a valid sessionid
      if (/^[0-9a-zA-Z-_]{6,}/.test(sessionId) === false) {
        throw new Error(
          'Unsupported sessionId format provided. Must be > 10 characters including: a-z, 0-9 and dashes.',
        );
      }
    }
    return sessionId ?? nanoid();
  }

  private onDevtoolsMessage(event: IPuppetContextEvents['devtools-message']): void {
    this.db.devtoolsMessages.insert(event);
  }

  private onMitmRequest(event: IRequestSessionRequestEvent): void {
    // don't know the tab id at this point
    this.resources.record(null, event, false);
  }

  private onMitmResponse(event: IRequestSessionResponseEvent): void {
    const tabId = this.resources.getBrowserRequestTabId(event.browserRequestId);
    let tab = this.tabsById.get(tabId);
    if (!tab && !tabId) {
      // if we can't place it, just use the first active tab
      tab = [...this.tabsById.values()].find(x => !x.isClosing);
    }

    const resource = this.resources.record(tab?.id ?? tabId, event, true);
    if (!event.didBlockResource) {
      tab?.emit('resource', resource);
    }
    tab?.checkForResolvedNavigation(event.browserRequestId, resource);
  }

  private onMitmError(event: IRequestSessionHttpErrorEvent): void {
    const { browserRequestId, request, resourceType, response } = event.request;
    let tabId = this.resources.getBrowserRequestTabId(browserRequestId);
    const url = request?.url;
    const isDocument = resourceType === 'Document';
    if (isDocument && !tabId) {
      for (const tab of this.tabsById.values()) {
        const isMatch = tab.frameWithPendingNavigation(browserRequestId, url, response?.url);
        if (isMatch) {
          tabId = tab.id;
          break;
        }
      }
    }

    // record errors
    const resource = this.resources.onMitmRequestError(tabId, event, event.error);

    if (tabId && isDocument) {
      const tab = this.tabsById.get(tabId);
      tab?.checkForResolvedNavigation(browserRequestId, resource, event.error);
    }
  }

  private onResourceStates(event: IResourceStateChangeEvent): void {
    this.db.resourceStates.insert(event.context.id, event.context.stateChanges);
  }

  private onSocketClose(event: ISocketEvent): void {
    this.db.sockets.insert(event.socket);
  }

  private onSocketConnect(event: ISocketEvent): void {
    this.db.sockets.insert(event.socket);
  }

  private async onNewTab(
    parentTab: Tab,
    page: IPuppetPage,
    openParams: { url: string; windowName: string } | null,
  ): Promise<Tab> {
    const tab = Tab.create(this, page, false, parentTab, {
      ...openParams,
      loaderId: page.mainFrame.isDefaultUrl ? null : page.mainFrame.activeLoaderId,
    });
    this.recordTab(tab.id, page.id, page.devtoolsSession.id, parentTab.id);
    this.registerTab(tab, page);

    await tab.isReady;

    parentTab.emit('child-tab-created', tab);
    return tab;
  }

  private registerTab(tab: Tab, page: IPuppetPage): Tab {
    const id = tab.id;
    this.tabsById.set(id, tab);
    tab.on('close', () => {
      this.tabsById.delete(id);
      if (this.tabsById.size === 0 && this.detachedTabsById.size === 0 && !this.isResettingState) {
        this.emit('all-tabs-closed');
      }
    });
    page.popupInitializeFn = this.onNewTab.bind(this, tab);
    this.emit('tab-created', { tab });
    return tab;
  }

  private async newPage(): Promise<IPuppetPage> {
    if (this._isClosing) throw new Error('Cannot create tab, shutting down');
    return await this.browserContext.newPage();
  }

  private recordLog(entry: ILogEntry): void {
    if (entry.sessionId === this.id || !entry.sessionId) {
      if (entry.action === 'Window.runCommand') entry.data = { id: entry.data.id };
      if (entry.action === 'Window.ranCommand') entry.data = null;
      this.db.sessionLogs.insert(entry);
    }
  }

  private recordTab(
    tabId: number,
    pageId: string,
    devtoolsSessionId: string,
    parentTabId?: number,
    detachedAtCommandId?: number,
  ): void {
    this.db.tabs.insert(
      tabId,
      pageId,
      devtoolsSessionId,
      this.viewport,
      parentTabId,
      detachedAtCommandId,
    );
  }

  private recordSession(providedOptions: ISessionCreateOptions): void {
    const configuration = this.meta;
    const { sessionName, scriptInstanceMeta, ...optionsToStore } = providedOptions;
    this.db.session.insert(
      this.id,
      configuration,
      this.browserEngine.fullVersion,
      this.createdTime,
      scriptInstanceMeta,
      this.plugins.browserEmulator.deviceProfile,
      optionsToStore,
    );
  }

  public static restoreOptionsFromSessionRecord(
    options: ISessionCreateOptions,
    resumeSessionId: string,
  ): ISessionCreateOptions {
    // if session not active, re-create
    let db: SessionDb;
    try {
      db = SessionDb.getCached(resumeSessionId, true);
    } catch (err) {
      // not found
    }
    if (!db) {
      const data = [
        ''.padEnd(50, '-'),
        `------HERO SESSION ID`.padEnd(50, '-'),
        `------${Core.dataDir}`.padEnd(50, '-'),
        `------${resumeSessionId ?? ''}`.padEnd(50, '-'),
        ''.padEnd(50, '-'),
      ].join('\n');

      throw new Error(
        `You're trying to resume a Hero session that could not be located.
${data}`,
      );
    }

    const record = db.session.get();
    options.userAgent = record.userAgentString;
    options.locale = record.locale;
    options.timezoneId = record.timezoneId;
    options.viewport = record.viewport;

    options.geolocation ??= record.createSessionOptions?.geolocation;
    options.userProfile ??= record.createSessionOptions?.userProfile;
    options.userProfile ??= {};
    options.userProfile.deviceProfile ??= record.deviceProfile;
    options.browserEmulatorId = record.browserEmulatorId;
    options.humanEmulatorId = record.humanEmulatorId;
    return options;
  }

  public static async create(
    options: ISessionCreateOptions,
  ): Promise<{ session: Session; tab: Tab; isSessionResume: boolean }> {
    let session: Session;
    let tab: Tab;
    let isSessionResume = false;

    // try to resume session. Modify options to match if not active.
    const resumeSessionId = options?.sessionResume?.sessionId;
    if (resumeSessionId) {
      session = Session.get(resumeSessionId);
      if (session) {
        await session.resume(options);
        tab = session.getLastActiveTab();
        isSessionResume = true;
      } else {
        Session.restoreOptionsFromSessionRecord(options, resumeSessionId);
      }
    }

    if (!session) {
      session = await GlobalPool.createSession(options);
    }
    tab ??= await session.createTab();

    return { session, tab, isSessionResume };
  }

  public static get(sessionId: string): Session {
    if (!sessionId) return null;
    return this.byId[sessionId];
  }

  public static getTab(meta: ISessionMeta): Tab | undefined {
    if (!meta) return undefined;
    const session = this.get(meta.sessionId);
    if (!session) return undefined;
    return session.tabsById.get(meta.tabId) ?? session.detachedTabsById.get(meta.tabId);
  }

  public static hasKeepAliveSessions(): boolean {
    for (const session of Object.values(this.byId)) {
      if (session.options.sessionKeepAlive) return true;
    }
    return false;
  }

  public static sessionsWithBrowserId(browserId: string): Session[] {
    return Object.values(this.byId).filter(x => x.browserContext?.browserId === browserId);
  }
}
