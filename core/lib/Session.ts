import { v1 as uuidv1 } from 'uuid';
import Log from '@ulixee/commons/lib/Logger';
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
import SessionState from './SessionState';
import GlobalPool from './GlobalPool';
import Tab from './Tab';
import UserProfile from './UserProfile';
import InjectedScripts from './InjectedScripts';
import CommandRecorder from './CommandRecorder';
import CorePlugins from './CorePlugins';
import Core from '../index';
import SessionDb from '../dbs/SessionDb';
import { ICommandableTarget } from './CommandRunner';

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

  public upstreamProxyUrl: string | null;
  public readonly mitmRequestSession: RequestSession;
  public sessionState: SessionState;
  public browserContext?: IPuppetContext;
  public userProfile?: IUserProfile;
  public resumeCounter = 0;

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

  public mitmErrorsByUrl = new Map<
    string,
    {
      resourceId: number;
      event: IRequestSessionHttpErrorEvent;
    }[]
  >();

  protected readonly logger: IBoundLog;

  private hasLoadedUserProfile = false;
  private commandRecorder: CommandRecorder;
  private isolatedMitmProxy?: MitmProxy;
  private _isClosing = false;
  private isResettingState = false;
  private detachedTabsById = new Map<number, Tab>();

  private tabIdCounter = 0;
  private frameIdCounter = 0;

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
    Session.byId[this.id] = this;
    const providedOptions = { ...options };
    this.logger = log.createChild(module, { sessionId: this.id });

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

    this.sessionState = new SessionState(
      this.id,
      options.sessionName,
      options.scriptInstanceMeta,
      this.viewport,
    );
    this.sessionState.recordSession({
      browserEmulatorId: this.plugins.browserEmulator.id,
      browserVersion: this.browserEngine.fullVersion,
      humanEmulatorId: this.plugins.humanEmulator.id,
      userAgentString: this.plugins.browserEmulator.userAgentString,
      deviceProfile: this.plugins.browserEmulator.deviceProfile,
      locale: options.locale,
      timezoneId: options.timezoneId,
      sessionOptions: providedOptions,
    });
    this.mitmRequestSession = new RequestSession(this.id, this.plugins, this.upstreamProxyUrl);
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

    const [detachedState, page] = await Promise.all([
      sourceTab.createDetachedState(),
      this.browserContext.newPage({
        runPageScripts: false,
      }),
    ]);
    const jsPathCalls = this.sessionState.findDetachedJsPathCalls(callsite, key);
    await Promise.all([
      page.setNetworkRequestInterceptor(detachedState.mockNetworkRequests.bind(detachedState)),
      page.setJavaScriptEnabled(false),
    ]);
    const newTab = Tab.create(this, page, true, sourceTab);

    await detachedState.restoreDomIntoTab(newTab);
    await newTab.isReady;

    this.sessionState.captureTab(
      newTab.id,
      page.id,
      page.devtoolsSession.id,
      sourceTab.id,
      detachedState.detachedAtCommandId,
    );
    this.detachedTabsById.set(newTab.id, newTab);
    newTab.on('close', () => {
      if (newTab.mainFrameEnvironment.jsPath.hasNewExecJsPathHistory) {
        this.sessionState.recordDetachedJsPathCalls(
          newTab.mainFrameEnvironment.jsPath.execHistory,
          callsite,
          key,
        );
      }

      this.detachedTabsById.delete(newTab.id);
    });

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

  public nextTabId(): number {
    return (this.tabIdCounter += 1);
  }

  public nextFrameId(): number {
    return (this.frameIdCounter += 1);
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
    this.sessionState.captureTab(tab.id, page.id, page.devtoolsSession.id);
    this.registerTab(tab, page);
    await tab.isReady;
    return tab;
  }

  public getLastActiveTab(): Tab {
    for (let idx = this.sessionState.commands.length - 1; idx >= 0; idx -= 1) {
      const command = this.sessionState.commands[idx];
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
    this.sessionState.close();
  }

  private async resume(options: ISessionCreateOptions): Promise<void> {
    const { sessionResume } = options;
    if (sessionResume.startLocation === 'sessionStart') {
      await this.resetStorage();
      // create a new tab
    }
    Object.assign(this.options, options);
    this.resumeCounter += 1;
    this.emit('resumed');
  }

  private onDevtoolsMessage(event: IPuppetContextEvents['devtools-message']): void {
    this.sessionState.captureDevtoolsMessage(event);
  }

  private onMitmRequest(event: IRequestSessionRequestEvent): void {
    // don't know the tab id at this point
    this.sessionState.captureResource(null, event, false);
  }

  private onMitmResponse(event: IRequestSessionResponseEvent): void {
    const tabId = this.mitmRequestSession.browserRequestMatcher.requestIdToTabId.get(
      event.browserRequestId,
    );
    let tab = this.tabsById.get(tabId);
    if (!tab && !tabId) {
      // if we can't place it, just use the first active tab
      for (const next of this.tabsById.values()) {
        tab = next;
        if (!next.isClosing) break;
      }
    }

    const resource = this.sessionState.captureResource(tab?.id ?? tabId, event, true);
    if (!event.didBlockResource) {
      tab?.emit('resource', resource);
    }
    tab?.checkForResolvedNavigation(event.browserRequestId, resource);
  }

  private onMitmError(event: IRequestSessionHttpErrorEvent): void {
    const { request } = event;
    let tabId = this.mitmRequestSession.browserRequestMatcher.requestIdToTabId.get(
      request.browserRequestId,
    );
    const url = request.request?.url;
    const isDocument = request?.resourceType === 'Document';
    if (isDocument && !tabId) {
      for (const tab of this.tabsById.values()) {
        const isMatch = tab.findFrameWithUnresolvedNavigation(
          request.browserRequestId,
          request.request?.method,
          url,
          request.response?.url,
        );
        if (isMatch) {
          tabId = tab.id;
          break;
        }
      }
    }

    // record errors
    const resource = this.sessionState.captureResourceError(tabId, request, event.error);
    if (!request.browserRequestId && url) {
      const existing = this.mitmErrorsByUrl.get(url) ?? [];
      existing.push({
        resourceId: resource.id,
        event,
      });
      this.mitmErrorsByUrl.set(url, existing);
    }

    if (tabId && isDocument) {
      const tab = this.tabsById.get(tabId);
      tab?.checkForResolvedNavigation(request.browserRequestId, resource, event.error);
    }
  }

  private onResourceStates(event: IResourceStateChangeEvent): void {
    this.sessionState.captureResourceState(event.context.id, event.context.stateChanges);
  }

  private onSocketClose(event: ISocketEvent): void {
    this.sessionState.captureSocketEvent(event);
  }

  private onSocketConnect(event: ISocketEvent): void {
    this.sessionState.captureSocketEvent(event);
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
    this.sessionState.captureTab(tab.id, page.id, page.devtoolsSession.id, parentTab.id);
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
