import { nanoid } from 'nanoid';
import Log, { ILogEntry, LogEvents, loggerSessionIdNames } from '@ulixee/commons/lib/Logger';
import RequestSession, {
  IResourceStateChangeEvent,
  ISocketEvent,
} from '@unblocked-web/agent-mitm/handlers/RequestSession';
import IUserProfile from '@ulixee/hero-interfaces/IUserProfile';
import IBrowserEngine from '@unblocked-web/specifications/agent/browser/IBrowserEngine';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import { ISessionSummary } from '@ulixee/hero-interfaces/ICorePlugin';
import IHeroMeta from '@ulixee/hero-interfaces/IHeroMeta';
import ICollectedElement from '@ulixee/hero-interfaces/ICollectedElement';
import ICollectedSnippet from '@ulixee/hero-interfaces/ICollectedSnippet';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import ICollectedResource from '@ulixee/hero-interfaces/ICollectedResource';
import Agent from '@unblocked-web/agent/lib/Agent';
import Resources from '@unblocked-web/agent/lib/Resources';
import WebsocketMessages from '@unblocked-web/agent/lib/WebsocketMessages';
import BrowserContext from '@unblocked-web/agent/lib/BrowserContext';
import DevtoolsSessionLogger from '@unblocked-web/agent/lib/DevtoolsSessionLogger';
import Page from '@unblocked-web/agent/lib/Page';
import IEmulationProfile from '@unblocked-web/specifications/plugin/IEmulationProfile';
import { IEmulatorOptions } from '@unblocked-web/default-browser-emulator';
import IViewport from '@unblocked-web/specifications/agent/browser/IViewport';
import Tab from './Tab';
import UserProfile from './UserProfile';
import InjectedScripts from './InjectedScripts';
import CommandRecorder from './CommandRecorder';
import CorePlugins from './CorePlugins';
import Core from '../index';
import SessionDb from '../dbs/SessionDb';
import { ICommandableTarget } from './CommandRunner';
import Commands from './Commands';
import SessionsDb from '../dbs/SessionsDb';
import { IRemoteEmitFn, IRemoteEventListener } from '../interfaces/IRemoteEventListener';
import { IOutputChangeRecord } from '../models/OutputTable';
import env from '../env';

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
    output: { changes: IOutputChangeRecord[] };
    'collected-asset': {
      type: 'resource' | 'snippet' | 'element';
      asset: ICollectedSnippet | ICollectedElement | ICollectedResource;
    };
  }>
  implements ICommandableTarget, IRemoteEventListener
{
  public static events = new TypedEventEmitter<{
    new: { session: Session };
  }>();

  private static readonly byId: { [id: string]: Session } = {};

  public readonly id: string;
  public readonly baseDir: string;
  public readonly plugins: CorePlugins;

  public get browserEngine(): IBrowserEngine {
    return this.emulationProfile.browserEngine;
  }

  public get userProfile(): IUserProfile {
    return this.options.userProfile;
  }

  public get mode(): ISessionCreateOptions['mode'] {
    return this.options.mode;
  }

  public get viewport(): IViewport {
    return this.emulationProfile.viewport;
  }

  public readonly createdTime: number;

  public bypassResourceRegistrationForHost: URL;

  public get mitmRequestSession(): RequestSession {
    return this.agent.mitmRequestSession;
  }

  public browserContext?: BrowserContext;
  public commands: Commands;
  public db: SessionDb;
  public get resources(): Resources {
    return this.browserContext.resources;
  }

  public get websocketMessages(): WebsocketMessages {
    return this.browserContext.websocketMessages;
  }

  public tabsById = new Map<number, Tab>();

  public get isClosing(): boolean {
    return this._isClosing;
  }

  public get emulationProfile(): IEmulationProfile {
    return this.agent?.emulationProfile;
  }

  public get meta(): IHeroMeta {
    const { viewport, locale, timezoneId, geolocation } = this.emulationProfile;

    const {
      string: userAgentString,
      operatingSystemPlatform,
      operatingSystemName,
      operatingSystemVersion,
      browserVersion,
      browserName,
    } = this.emulationProfile.userAgentOption;

    return {
      sessionId: this.id,
      ...this.options,
      upstreamProxyUrl: this.options.upstreamProxyUrl,
      upstreamProxyIpMask: this.options.upstreamProxyIpMask,
      viewport,
      locale,
      timezoneId,
      geolocation,
      userAgentString,
      operatingSystemName,
      operatingSystemPlatform,
      operatingSystemVersion: [
        operatingSystemVersion.major,
        operatingSystemVersion.minor,
        operatingSystemVersion.patch,
        operatingSystemVersion.build,
      ]
        .filter(x => x !== undefined)
        .join('.'),
      browserName,
      browserFullVersion: [
        browserVersion.major,
        browserVersion.minor,
        browserVersion.patch,
        browserVersion.build,
      ]
        .filter(x => x !== undefined)
        .join('.'),

      renderingEngine: this.browserEngine.name,
      renderingEngineVersion: this.browserEngine.fullVersion,
    };
  }

  public awaitedEventEmitter = new TypedEventEmitter<{ close: void }>();
  public readonly agent: Agent;

  protected readonly logger: IBoundLog;

  private hasLoadedUserProfile = false;
  private commandRecorder: CommandRecorder;
  private _isClosing = false;
  private isResettingState = false;
  private readonly logSubscriptionId: number;
  private events = new EventSubscriber();

  protected constructor(readonly options: ISessionCreateOptions) {
    super();
    this.createdTime = Date.now();
    this.id = this.getId(options.sessionId);
    const id = this.id;
    Session.byId[id] = this;
    this.events.once(this, 'closed', () => delete Session.byId[id]);
    this.db = new SessionDb(this.id);
    this.commands = new Commands(this.db);

    this.logger = log.createChild(module, { sessionId: this.id });
    loggerSessionIdNames.set(this.id, options.sessionName);
    this.logSubscriptionId = LogEvents.subscribe(this.recordLog.bind(this));

    const providedOptions = { ...options };
    // set default script instance if not provided
    options.scriptInstanceMeta ??= {
      id: nanoid(),
      workingDirectory: process.cwd(),
      entrypoint: require.main?.filename ?? process.argv[1],
      startDate: this.createdTime,
    };
    // add env vars
    options.showChrome ??= env.showChrome;
    options.noChromeSandbox ??= env.noChromeSandbox;
    options.disableGpu ??= env.disableGpu;
    options.disableMitm ??= env.disableMitm;
    options.disableDevtools ??= env.disableDevtools;

    Session.events.emit('new', { session: this });
    // if no settings for chrome visiblity, default to headless
    options.showChrome ??= false;
    options.showChromeInteractions ??= options.showChrome;

    const { userProfile, userAgent } = options;
    const customEmulatorConfig: IEmulatorOptions = {
      userAgentSelector: userAgent ?? userProfile?.userAgentString,
    };

    this.agent = Core.pool.createAgent({
      options,
      customEmulatorConfig,
      logger: this.logger,
      deviceProfile: userProfile?.deviceProfile,
      id: this.id,
      commandMarker: this.commands,
    });

    this.plugins = new CorePlugins(this.agent, {
      corePluginPaths: options.corePluginPaths,
      dependencyMap: options.dependencyMap,
      getSessionSummary: this.getSummary.bind(this),
    });

    // should come after plugins can initiate
    this.recordSession(providedOptions);

    SessionsDb.find().recordSession(this);

    this.commandRecorder = new CommandRecorder(this, this, null, null, [
      this.collectSnippet,
      this.getCollectedSnippets,
      this.getCollectedElements,
      this.getCollectedResources,
      this.getCollectedAssetNames,
      this.close,
      this.flush,
      this.exportUserProfile,
      this.getTabs,
      this.getHeroMeta,
      this.addRemoteEventListener,
      this.removeRemoteEventListener,
      this.pauseCommands,
      this.resumeCommands,
    ]);
  }

  public getSummary(): ISessionSummary {
    return {
      id: this.id,
      options: { ...this.options },
    };
  }

  public isAllowedCommand(method: string): boolean {
    return this.commandRecorder.fnNames.has(method) || method === 'recordOutput';
  }

  public shouldWaitForCommandLock(method: keyof Session): boolean {
    return method !== 'resumeCommands';
  }

  public getTab(id: number): Tab {
    return this.tabsById.get(id);
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

  public collectSnippet(name: string, value: any, timestamp: number): Promise<void> {
    const asset = this.db.collectedSnippets.insert(name, value, timestamp, this.commands.lastId);
    this.emit('collected-asset', { type: 'snippet', asset });
    return Promise.resolve();
  }

  public getCollectedAssetNames(
    fromSessionId: string,
  ): Promise<{ resources: string[]; elements: string[]; snippets: string[] }> {
    let db = this.db;
    if (fromSessionId === this.id) {
      db.flush();
    } else {
      db = SessionDb.getCached(fromSessionId);
    }
    const snippets = new Set<string>();
    for (const snippet of db.collectedSnippets.all()) {
      snippets.add(snippet.name);
    }
    const resources = new Set<string>();
    for (const resource of db.collectedResources.all()) {
      resources.add(resource.name);
    }

    const elementNames = db.collectedElements.allNames();

    return Promise.resolve({
      snippets: [...snippets],
      resources: [...resources],
      elements: [...elementNames],
    });
  }

  public getCollectedSnippets(fromSessionId: string, name: string): Promise<ICollectedSnippet[]> {
    let db = this.db;
    if (fromSessionId === this.id) {
      db.flush();
    } else {
      db = SessionDb.getCached(fromSessionId);
    }
    return Promise.resolve(db.collectedSnippets.getByName(name));
  }

  public getCollectedResources(fromSessionId: string, name: string): Promise<ICollectedResource[]> {
    let db = this.db;
    if (fromSessionId === this.id) {
      db.flush();
    } else {
      db = SessionDb.getCached(fromSessionId);
    }
    const resources = db.collectedResources.getByName(name).map(async x => {
      const resource = await db.resources.getMeta(x.resourceId, true);
      const collectedResource = {
        ...x,
        resource,
      } as ICollectedResource;

      if (resource.type === 'Websocket') {
        collectedResource.websocketMessages = db.websocketMessages.getTranslatedMessages(
          resource.id,
        );
      }

      return collectedResource;
    });
    return Promise.all(resources);
  }

  public async getCollectedElements(
    fromSessionId: string,
    name: string,
  ): Promise<ICollectedElement[]> {
    let db = this.db;
    if (!fromSessionId || fromSessionId === this.id) {
      for (const tab of this.tabsById.values()) {
        await tab.pendingCollects();
      }
    } else {
      db = SessionDb.getCached(fromSessionId);
    }
    db.flush();
    return db.collectedElements.getByName(name);
  }

  public async openBrowser(): Promise<void> {
    const agent = this.agent;
    await agent.open();
    this.browserContext = agent.browserContext;
    this.events.on(
      agent.browserContext.devtoolsSessionLogger,
      'devtools-message',
      this.onDevtoolsMessage.bind(this),
    );
    if (this.userProfile) {
      await UserProfile.installCookies(this);
    }

    this.browserContext.defaultPageInitializationFn = page =>
      InjectedScripts.install(page, this.options.showChromeInteractions);

    const requestSession = agent.mitmRequestSession;
    requestSession.bypassResourceRegistrationForHost = this.bypassResourceRegistrationForHost;
    this.events.on(requestSession, 'resource-state', this.onResourceStates.bind(this));
    this.events.on(requestSession, 'socket-close', this.onSocketClose.bind(this));
    this.events.on(requestSession, 'socket-connect', this.onSocketConnect.bind(this));

    const resources = this.browserContext.resources;
    this.events.on(resources, 'change', this.onResource.bind(this));
    this.events.on(resources, 'cookie-change', this.onCookieChange.bind(this));
    this.events.on(resources, 'merge', this.onResourceNeedsMerge.bind(this));
    this.events.on(resources, 'browser-loaded', this.onBrowserLoadedResource.bind(this));
    this.events.on(resources, 'browser-requested', this.onBrowserRequestedResource.bind(this));

    agent.mitmRequestSession.respondWithHttpErrorStacks =
      this.mode === 'development' && this.options.showChromeInteractions === true;

    if (this.options.upstreamProxyIpMask) {
      this.db.session.updateConfiguration(this.meta);
    }
  }

  public exportUserProfile(): Promise<IUserProfile> {
    return UserProfile.export(this);
  }

  public async createTab(): Promise<Tab> {
    if (this.mode === 'browserless') return null;

    let page: Page;

    // if first tab, install session storage
    if (!this.hasLoadedUserProfile && this.userProfile?.storage) {
      page = await this.browserContext.newPage({
        groupName: 'session',
        runPageScripts: false,
        enableDomStorageTracker: false,
      });
      await UserProfile.installStorage(this, page);
      this.hasLoadedUserProfile = true;
    } else {
      page = await this.browserContext.newPage({
        groupName: 'session',
      });
    }

    const first = this.tabsById.size === 0;
    const tab = Tab.create(this, page);
    this.recordTab(tab);
    this.registerTab(tab);
    await tab.isReady;

    if (first) this.db.session.updateConfiguration(this.meta);
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
          const origin = frame.frame.securityOrigin;
          if (!securityOrigins.has(origin)) {
            const promise = tab.page.devtoolsSession
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
        await UserProfile.installCookies(this);
      }
      // pop a new tab on
      await this.createTab();
    } finally {
      this.isResettingState = false;
    }
  }

  public async closeTabs(): Promise<void> {
    try {
      const promises: Promise<any>[] = [];
      for (const tab of this.tabsById.values()) {
        promises.push(tab.close());
      }
      await Promise.all(promises);
    } catch (error) {
      log.error('Session.CloseTabsError', { error, sessionId: this.id });
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

    if (this._isClosing) return;
    this._isClosing = true;

    await this.willClose();

    this.awaitedEventEmitter.emit('close');
    this.emit('closing');
    const start = log.info('Session.Closing', {
      sessionId: this.id,
    });

    await this.closeTabs();
    await this.agent.close();

    log.stats('Session.Closed', {
      sessionId: this.id,
      parentLogId: start,
    });

    const closedEvent = { waitForPromise: null };
    this.emit('closed', closedEvent);
    await closedEvent.waitForPromise;

    this.events.close();
    this.commandRecorder.cleanup();
    this.plugins.cleanup();

    // should go last so we can capture logs
    this.db.session.close(Date.now());
    LogEvents.unsubscribe(this.logSubscriptionId);
    loggerSessionIdNames.delete(this.id);
    this.db.flush();

    this.removeAllListeners();
    // give the system a second to write to db before clearing
    setImmediate(db => {
      try {
        db.close();
      } catch (e) {
        /* no-op */
      }
    }, this.db);
  }

  public addRemoteEventListener(
    type: keyof Session['awaitedEventEmitter']['EventTypes'],
    emitFn: IRemoteEmitFn,
  ): Promise<{ listenerId: string }> {
    const listener = this.commands.observeRemoteEvents(type, emitFn);
    this.awaitedEventEmitter.on(type, listener.listenFn);
    return Promise.resolve({ listenerId: listener.id });
  }

  public removeRemoteEventListener(listenerId: string): Promise<any> {
    const details = this.commands.getRemoteEventListener(listenerId);
    this.awaitedEventEmitter.off(details.type as any, details.listenFn);
    return Promise.resolve();
  }

  public recordOutput(...changes: IOutputChangeRecord[]): Promise<void> {
    for (const change of changes) {
      this.db.output.insert(change);
    }
    this.emit('output', { changes });
    return Promise.resolve();
  }

  public pauseCommands(): Promise<void> {
    this.commands.pause();
    return Promise.resolve();
  }

  public resumeCommands(): Promise<void> {
    this.commands.resume();
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
    for (const tab of this.tabsById.values()) {
      await tab.flushDomChanges();
    }
    // give listeners a chance to modify message before publishing to clients
    this.emit('kept-alive', result);
    return result;
  }

  private async resume(options: ISessionCreateOptions): Promise<void> {
    const { sessionResume } = options;
    if (sessionResume.startLocation === 'sessionStart') {
      await this.resetStorage();
      // create a new tab
    }
    Object.assign(this.options, options);
    this.commands.presetMeta = null;
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

  private onResource(event: BrowserContext['resources']['EventTypes']['change']): void {
    this.db.resources.insert(
      event.tabId,
      event.resource,
      event.postData,
      event.body,
      event.requestProcessingDetails,
      event.error,
    );
    if (event.type === 'mitm-response') {
      this.tabsById.get(event.tabId)?.emit('resource', event.resource);
    }
  }

  private onCookieChange(event: BrowserContext['resources']['EventTypes']['cookie-change']): void {
    this.db.storageChanges.insert(event.tabId, event.frameId, {
      type: 'cookie' as any,
      action: event.action as any,
      securityOrigin: event.url.origin,
      key: event.cookie?.name,
      value: event.cookie?.value,
      meta: event.cookie,
      timestamp: event.timestamp,
    });
  }

  private onResourceNeedsMerge(event: BrowserContext['resources']['EventTypes']['merge']): void {
    this.db.resources.mergeWithExisting(
      event.resourceId,
      event.existingResource,
      event.newResourceDetails,
      event.requestProcessingDetails,
      event.error,
    );
  }

  private onBrowserLoadedResource(
    event: BrowserContext['resources']['EventTypes']['browser-loaded'],
  ): void {
    this.db.resources.updateReceivedTime(event.resourceId, event.browserLoadedTime);
  }

  private onBrowserRequestedResource(
    event: BrowserContext['resources']['EventTypes']['browser-requested'],
  ): void {
    this.db.resources.updateBrowserRequestId(event.resourceId, event);
  }

  private onDevtoolsMessage(event: DevtoolsSessionLogger['EventTypes']['devtools-message']): void {
    this.db.devtoolsMessages.insert(event);
  }

  private onResourceStates(event: IResourceStateChangeEvent): void {
    if (!this.browserContext.resources.isCollecting) return;
    this.db.resourceStates.insert(event.context.id, event.context.stateChanges);
  }

  private onSocketClose(event: ISocketEvent): void {
    if (!this.browserContext.resources.isCollecting) return;
    this.db.sockets.insert(event.socket);
  }

  private onSocketConnect(event: ISocketEvent): void {
    if (!this.browserContext.resources.isCollecting) return;
    this.db.sockets.insert(event.socket);
  }

  private async onNewTab(
    parentTab: Tab,
    page: Page,
    openParams: { url: string; windowName: string } | null,
  ): Promise<Tab> {
    const tab = Tab.create(this, page, parentTab?.id, openParams);
    this.recordTab(tab, parentTab.id);
    this.registerTab(tab);

    await tab.isReady;

    parentTab.emit('child-tab-created', tab);
    return tab;
  }

  private registerTab(tab: Tab): Tab {
    const id = tab.id;
    this.tabsById.set(id, tab);
    this.events.once(tab, 'close', () => {
      this.tabsById.delete(id);
      if (this.tabsById.size === 0 && !this.isResettingState) {
        this.emit('all-tabs-closed');
      }
    });
    tab.page.popupInitializeFn = this.onNewTab.bind(this, tab);
    this.emit('tab-created', { tab });
    return tab;
  }

  private recordLog(entry: ILogEntry): void {
    if (entry.sessionId === this.id || !entry.sessionId) {
      if (entry.action === 'Window.runCommand') entry.data = { id: entry.data.id };
      if (entry.action === 'Window.ranCommand') entry.data = null;
      this.db.sessionLogs.insert(entry);
    }
  }

  private recordTab(tab: Tab, parentTabId?: number): void {
    this.db.tabs.insert(
      tab.id,
      tab.page.id,
      tab.page.devtoolsSession.id,
      this.viewport,
      parentTabId,
    );
  }

  private recordSession(providedOptions: ISessionCreateOptions): void {
    const configuration = this.meta;
    const { sessionName, scriptInstanceMeta, ...optionsToStore } = providedOptions;
    this.db.session.insert(
      this.id,
      configuration,
      this.browserEngine.name,
      this.browserEngine.fullVersion,
      this.createdTime,
      scriptInstanceMeta,
      this.emulationProfile.deviceProfile,
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
    options.userProfile ??= record.createSessionOptions?.userProfile ?? {};
    options.userProfile.deviceProfile ??= record.deviceProfile;
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
    const resumeLocation = options.sessionResume?.startLocation;
    if (resumeSessionId) {
      if (resumeLocation !== 'sessionStart') {
        session = Session.get(resumeSessionId);
        if (session) {
          await session.resume(options);
          tab = session.getLastActiveTab();
          isSessionResume = true;
        }
      }
      if (!session) {
        Session.restoreOptionsFromSessionRecord(options, resumeSessionId);
      }
    }

    if (!session) {
      await Core.start({}, false);
      session = new Session(options);

      if (session.mode !== 'browserless') {
        await session.openBrowser();
      }
    }
    tab ??= await session.createTab();

    if (resumeLocation === 'sessionStart') {
      const newId = session.id;
      if (newId !== resumeSessionId) {
        // Bind the new session close to the original one if it's still open
        Session.get(resumeSessionId)?.once('closed', () => Session.get(newId)?.close(true));
      }
    }

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
    return session.tabsById.get(meta.tabId);
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
