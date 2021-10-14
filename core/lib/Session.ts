import { v1 as uuidv1 } from 'uuid';
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

const { log } = Log(module);

export default class Session
  extends TypedEventEmitter<{
    closing: void;
    closed: void;
    resumed: void;
    'kept-alive': { message: string };
    'tab-created': { tab: Tab };
    'all-tabs-closed': void;
  }>
  implements ICommandableTarget
{
  private static readonly byId: { [id: string]: Session } = {};

  public readonly id: string;
  public readonly baseDir: string;
  public browserEngine: IBrowserEngine;
  public plugins: CorePlugins;

  public viewport: IViewport;
  public timezoneId: string;
  public locale: string;
  public geolocation: IGeolocation;
  public readonly createdTime: number;

  public upstreamProxyUrl: string | null;
  public readonly mitmRequestSession: RequestSession;
  public browserContext?: IPuppetContext;
  public userProfile?: IUserProfile;
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
    if (options.sessionId) {
      if (Session.byId[options.sessionId]) {
        throw new Error('The pre-provided sessionId is already in use.');
      }
      // make sure this is a valid sessionid
      if (/^[0-9a-zA-Z-]{1,48}/.test(options.sessionId) === false) {
        throw new Error(
          'Unsupported sessionId format provided. Must be 5-48 characters including: a-z, 0-9 and dashes.',
        );
      }
    }
    this.id = options.sessionId ?? uuidv1();
    this.createdTime = Date.now();
    Session.byId[this.id] = this;
    this.db = new SessionDb(this.id);

    this.logger = log.createChild(module, { sessionId: this.id });
    loggerSessionIdNames.set(this.id, options.sessionName);
    this.logSubscriptionId = LogEvents.subscribe(this.recordLog.bind(this));

    const providedOptions = { ...options };
    const {
      browserEmulatorId,
      humanEmulatorId,
      dependencyMap,
      corePluginPaths,
      userProfile,
      userAgent,
    } = options;

    if (!options.showBrowser) {
      options.showBrowser = false;
      options.showBrowserInteractions = false;
    }

    const userAgentSelector = userAgent ?? userProfile?.userAgentString;
    this.plugins = new CorePlugins(
      {
        userAgentSelector,
        browserEmulatorId,
        humanEmulatorId,
        dependencyMap,
        corePluginPaths,
        deviceProfile: userProfile?.deviceProfile,
        getSessionSummary: () => this.summary,
      },
      this.logger,
    );

    this.browserEngine = this.plugins.browserEngine;
    this.browserEngine.isHeaded ??= options.showBrowser;

    this.userProfile = options.userProfile;
    this.upstreamProxyUrl = options.upstreamProxyUrl;
    this.geolocation = options.geolocation;

    this.plugins.configure(options);
    this.timezoneId = options.timezoneId || '';
    this.locale = options.locale;
    this.viewport = options.viewport;

    this.recordSession(providedOptions);

    SessionsDb.find().recordSession(this);

    this.mitmRequestSession = new RequestSession(this.id, this.plugins, this.upstreamProxyUrl);
    this.mitmRequestSession.respondWithHttpErrorStacks = options.showBrowserInteractions === true;
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
    ]);
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

  public getTabs(): Tab[] {
    return [...this.tabsById.values()].filter(x => !x.isClosing);
  }

  public flush(): void {
    this.logger.info('SessionFlushing');
  }

  public getHeroMeta(): IHeroMeta {
    const { plugins, viewport, locale, timezoneId, geolocation } = this;

    const { userAgentString, operatingSystemPlatform } = this.plugins.browserEmulator;

    return {
      sessionId: this.id,
      ...this.options,
      browserEmulatorId: plugins.browserEmulator.id,
      humanEmulatorId: plugins.humanEmulator.id,
      upstreamProxyUrl: this.upstreamProxyUrl,
      viewport,
      locale,
      timezoneId,
      geolocation,
      userAgentString,
      operatingSystemPlatform,
    };
  }

  public async configure(options: IConfigureSessionOptions): Promise<void> {
    if (options.upstreamProxyUrl !== undefined) {
      this.upstreamProxyUrl = options.upstreamProxyUrl;
      this.mitmRequestSession.upstreamProxyUrl = options.upstreamProxyUrl;
    }
    if (options.blockedResourceTypes !== undefined) {
      for (const tab of this.tabsById.values()) {
        await tab.setBlockedResourceTypes(options.blockedResourceTypes);
      }
    }

    if (options.userProfile !== undefined) {
      this.userProfile = options.userProfile;
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
    const options = this.options;
    return !(options.showBrowser === true && options.sessionKeepAlive === true);
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

    const tab = Tab.create(this, page);
    this.recordTab(tab.id, page.id, page.devtoolsSession.id);
    this.registerTab(tab, page);
    await tab.isReady;
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
    // if this session is set to keep alive and core is closing,
    if (!force && this.options.sessionKeepAlive && !Core.isClosing) {
      const result = { didKeepAlive: false, message: null };
      result.message = `This session has the "sessionKeepAlive" variable active. Your Chrome session will remain open until you terminate this Hero instance.`;
      result.didKeepAlive = true;
      this.emit('kept-alive', result);
      for (const tab of this.tabsById.values()) {
        await tab.flushDomChanges();
      }
      return result;
    }

    delete Session.byId[this.id];
    if (this._isClosing) return;
    // client events are listening to "close"
    this.emit('close' as any);
    this.emit('closing');
    this._isClosing = true;
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

    try {
      await this.browserContext?.close();
    } catch (error) {
      log.error('Session.CloseBrowserContextError', { error, sessionId: this.id });
    }
    log.stats('Session.Closed', {
      sessionId: this.id,
      parentLogId: start,
    });
    this.emit('closed');
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
    const configuration = this.getHeroMeta();
    const { sessionName, scriptInstanceMeta, ...optionsToStore } = providedOptions;
    this.db.session.insert(
      this.id,
      configuration.sessionName,
      configuration.browserEmulatorId,
      this.browserEngine.fullVersion,
      configuration.userAgentString,
      configuration.humanEmulatorId,
      this.createdTime,
      scriptInstanceMeta?.id,
      scriptInstanceMeta?.entrypoint,
      scriptInstanceMeta?.startDate,
      configuration.timezoneId,
      this.plugins.browserEmulator.deviceProfile,
      configuration.viewport,
      configuration.locale,
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
