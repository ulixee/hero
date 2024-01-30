import { nanoid } from 'nanoid';
import Log, { ILogEntry, LogEvents, loggerSessionIdNames } from '@ulixee/commons/lib/Logger';
import RequestSession, {
  IResourceStateChangeEvent,
  ISocketEvent,
} from '@ulixee/unblocked-agent-mitm/handlers/RequestSession';
import Callsite from '@ulixee/commons/lib/Callsite';
import IUserProfile from '@ulixee/hero-interfaces/IUserProfile';
import IBrowserEngine from '@ulixee/unblocked-specification/agent/browser/IBrowserEngine';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import { ISessionSummary } from '@ulixee/hero-interfaces/ICorePlugin';
import IHeroMeta from '@ulixee/hero-interfaces/IHeroMeta';
import IDetachedElement from '@ulixee/hero-interfaces/IDetachedElement';
import IDataSnippet from '@ulixee/hero-interfaces/IDataSnippet';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import IDetachedResource from '@ulixee/hero-interfaces/IDetachedResource';
import Agent from '@ulixee/unblocked-agent/lib/Agent';
import Resources from '@ulixee/unblocked-agent/lib/Resources';
import WebsocketMessages from '@ulixee/unblocked-agent/lib/WebsocketMessages';
import BrowserContext from '@ulixee/unblocked-agent/lib/BrowserContext';
import DevtoolsSessionLogger from '@ulixee/unblocked-agent/lib/DevtoolsSessionLogger';
import Page from '@ulixee/unblocked-agent/lib/Page';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import { IEmulatorOptions } from '@ulixee/default-browser-emulator';
import IViewport from '@ulixee/unblocked-specification/agent/browser/IViewport';
import { IFrame } from '@ulixee/unblocked-specification/agent/browser/IFrame';
import * as Path from 'path';
import ISessionRegistry from '../interfaces/ISessionRegistry';
import Tab from './Tab';
import UserProfile from './UserProfile';
import InjectedScripts from './InjectedScripts';
import CommandRecorder from './CommandRecorder';
import CorePlugins from './CorePlugins';
import Core from '../index';
import SessionDb from '../dbs/SessionDb';
import { ICommandableTarget } from './CommandRunner';
import Commands from './Commands';
import { IRemoteEmitFn, IRemoteEventListener } from '../interfaces/IRemoteEventListener';
import { IOutputChangeRecord } from '../models/OutputTable';
import env from '../env';
import DetachedAssets from './DetachedAssets';

const { version } = require('../package.json');

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
      asset: IDataSnippet | IDetachedElement | IDetachedResource;
    };
  }>
  implements ICommandableTarget, IRemoteEventListener
{
  public static events = new TypedEventEmitter<{
    new: { session: Session };
    closed: { id: string; databasePath: string };
  }>();

  private static readonly byId: { [id: string]: Session } = {};

  public readonly id: string;
  public readonly baseDir: string;
  public plugins: CorePlugins;

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

  public awaitedEventEmitter = new TypedEventEmitter<{
    close: void;
    'rerun-stderr': string;
    'rerun-stdout': string;
    'rerun-kept-alive': void;
  }>();

  public agent: Agent;

  protected readonly logger: IBoundLog;
  protected hasLoadedUserProfile = false;
  protected commandRecorder: CommandRecorder;
  protected _isClosing = false;
  protected isResettingState = false;
  protected readonly logSubscriptionId: number;
  protected events = new EventSubscriber();

  private get sessionRegistry(): ISessionRegistry {
    return this.core.sessionRegistry;
  }

  protected constructor(readonly options: ISessionCreateOptions, public core: Core) {
    super();

    for (const key of Object.keys(options)) {
      if (
        key === 'showChrome' ||
        key === 'showChromeAlive' ||
        key === 'showChromeInteractions' ||
        key === 'sessionKeepAlive' ||
        key === 'sessionPersistence'
      ) {
        const v = options[key];
        if (typeof v === 'string') {
          options[key] = Boolean(JSON.parse((v as string).toLowerCase()));
        }
      }
    }

    this.createdTime = Date.now();
    this.id = this.assignId(options.sessionId);
    const customPath = options.sessionDbDirectory
      ? Path.join(options.sessionDbDirectory, `${this.id}.db`)
      : undefined;
    this.db = this.sessionRegistry.create(this.id, customPath);
    this.commands = new Commands(this.db);

    this.logger = log.createChild(module, { sessionId: this.id });
    loggerSessionIdNames.set(this.id, options.sessionName);
    this.logSubscriptionId = LogEvents.subscribe(this.recordLog.bind(this));

    this.activateAgent(options);
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

  public shouldWaitForCommandLock(method: string): boolean {
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
    return Promise.resolve(this.db.session.getHeroMeta());
  }

  public setSnippet(key: string, value: any, timestamp: number): Promise<void> {
    const asset = this.db.snippets.insert(key, value, timestamp, this.commands.lastId);
    this.emit('collected-asset', { type: 'snippet', asset });
    return Promise.resolve();
  }

  public async getCollectedAssetNames(
    fromSessionId: string,
  ): Promise<{ resources: string[]; elements: string[]; snippets: string[] }> {
    let db = this.db;
    if (fromSessionId === this.id) {
      db.flush();
    } else {
      const customPath = this.getCustomSessionPath(fromSessionId);
      db = await this.sessionRegistry.get(fromSessionId, customPath);
    }
    return DetachedAssets.getNames(db);
  }

  public async getSnippets(fromSessionId: string, name: string): Promise<IDataSnippet[]> {
    let db = this.db;
    if (fromSessionId === this.id) {
      db.flush();
    } else {
      const customPath = this.getCustomSessionPath(fromSessionId);
      db = await this.sessionRegistry.get(fromSessionId, customPath);
    }
    return Promise.resolve(DetachedAssets.getSnippets(db, name));
  }

  public async getDetachedResources(
    fromSessionId: string,
    name: string,
  ): Promise<IDetachedResource[]> {
    let db = this.db;
    if (fromSessionId === this.id) {
      db.flush();
    } else {
      const customPath = this.getCustomSessionPath(fromSessionId);
      db = await this.sessionRegistry.get(fromSessionId, customPath);
    }
    return DetachedAssets.getResources(db, name);
  }

  public async getDetachedElements(
    fromSessionId: string,
    name: string,
  ): Promise<IDetachedElement[]> {
    let db = this.db;
    if (!fromSessionId || fromSessionId === this.id) {
      for (const tab of this.tabsById.values()) {
        await tab.pendingCollects();
      }
    } else {
      const customPath = this.getCustomSessionPath(fromSessionId);
      db = await this.sessionRegistry.get(fromSessionId, customPath);
    }
    return DetachedAssets.getElements(db, name);
  }

  public async openBrowser(): Promise<void> {
    if (this.mode === 'browserless') return;
    const agent = this.agent;
    await agent.open();
    this.browserContext = agent.browserContext;
    this.events.on(
      agent.browserContext.devtoolsSessionLogger,
      'devtools-message',
      this.onDevtoolsMessage.bind(this),
      true,
    );
    if (this.userProfile) {
      await UserProfile.installCookies(this);
    }

    agent.plugins.hook({
      onNewPage: page => InjectedScripts.install(page, this.options.showChromeInteractions),
      onNewFrameProcess: frame =>
        InjectedScripts.install(
          frame.page,
          this.options.showChromeInteractions,
          frame.devtoolsSession,
        ),
    });

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

    this.events.on(this.websocketMessages, 'new', this.onWebsocketMessage.bind(this));
    agent.mitmRequestSession.respondWithHttpErrorStacks =
      this.mode === 'development' && this.options.showChromeInteractions === true;

    if (this.options.upstreamProxyIpMask) {
      this.db.session.updateConfiguration(this.getConfiguration());
    }
  }

  public exportUserProfile(): Promise<IUserProfile> {
    return UserProfile.export(this);
  }

  public async createTab(): Promise<Tab> {
    if (this.mode === 'browserless') return null;

    let page: Page;

    // register dom script before page is initialized
    this.agent.plugins.addDomOverride(
      'page',
      InjectedScripts.ShadowDomPiercerScript,
      { callbackName: 'onShadowDomPushedCallbackFn' },
      (data, frame: IFrame) => {
        const tab = this.tabsById.get(frame.page.tabId);
        if (tab) {
          void tab.frameEnvironmentsById.get(frame.frameId)?.onShadowDomPushed(data);
        }
      },
    );

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

    if (first) this.db.session.updateConfiguration(this.getConfiguration());
    return tab;
  }

  public getLastActiveTab(): Tab {
    if (!this.commands) return null;
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
      await Promise.allSettled(promises);
    } catch (error) {
      this.logger.warn('Session.CloseTabsError', { error });
    }
  }

  public async close(force = false): Promise<{ didKeepAlive: boolean; message?: string }> {
    // if this session is set to keep alive and core isn't closing
    if (
      !force &&
      this.options.sessionKeepAlive &&
      !this.core.isClosing &&
      !this.commands.requiresScriptRestart
    ) {
      return await this.keepAlive();
    }

    if (this._isClosing) return;
    this._isClosing = true;

    await this.willClose();

    this.awaitedEventEmitter.emit('close');
    this.emit('closing');
    const start = this.logger.info('Session.Closing');

    await this.closeTabs().catch(() => null);
    await this.agent?.close()?.catch(() => null);

    this.logger.stats('Session.Closed', {
      parentLogId: start,
    });

    const closedEvent = { waitForPromise: null };
    try {
      this.emit('closed', closedEvent);
      await closedEvent.waitForPromise;
    } catch (error) {
      this.logger.warn('Session.closeError', { error });
    }

    this.events.close();
    this.commandRecorder.cleanup();
    this.plugins.cleanup();

    try {
      // should go last so we can capture logs
      this.db.session.close(Date.now());
      this.db.flush();
    } catch (error) {
      this.logger.warn('Session.closeDbSessionError', { error });
    }

    // NOTE: need to get sessionRegistry before cleaning up!
    const sessionRegistry = this.sessionRegistry;
    this.cleanup();

    this.removeAllListeners();

    try {
      await sessionRegistry.close(this.id, this.options.sessionPersistence === false);
    } catch (e) {
      /* no-op */
    }

    const databasePath = this.db.path;
    Session.events.emit('closed', { id: this.id, databasePath });
    LogEvents.unsubscribe(this.logSubscriptionId);
    loggerSessionIdNames.delete(this.id);
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

  protected assignId(sessionId?: string): string {
    if (sessionId) {
      if (Session.byId[sessionId]) {
        throw new Error('The pre-provided sessionId is already in use.');
      }
      // make sure this is a valid sessionId
      if (/^[0-9a-zA-Z-_]{6,}/.test(sessionId) === false) {
        throw new Error(
          'Unsupported sessionId format provided. Must be > 10 characters including: a-z, 0-9 and dashes.',
        );
      }
    }
    sessionId ??= nanoid();
    Session.byId[sessionId] = this;
    Session.events.once('closed', ({ id }) => delete Session.byId[id]);
    return sessionId;
  }

  protected activateAgent(options: ISessionCreateOptions): void {
    const providedOptions = { ...options };
    // set default script instance if not provided
    options.scriptInvocationMeta ??= {
      version,
      productId: 'Hero',
      workingDirectory: process.cwd(),
      entrypoint: Callsite.getEntrypoint(),
    };
    // add env vars
    options.showChrome ??= env.showChrome;
    options.noChromeSandbox ??= env.noChromeSandbox;
    options.disableGpu ??= env.disableGpu;
    options.disableMitm ??= env.disableMitm;

    Session.events.emit('new', { session: this });

    // if no settings for chrome visibility, default to headless
    options.showChrome ??= false;
    options.showChromeInteractions ??= options.showChrome;

    const { userProfile, userAgent } = options;
    const customEmulatorConfig: IEmulatorOptions = {
      userAgentSelector: userAgent ?? userProfile?.userAgentString,
    };

    if (userProfile) {
      options.locale ??= userProfile.locale;
      options.timezoneId ??= userProfile.timezoneId;
      options.geolocation ??= userProfile.geolocation;
      options.viewport ??= userProfile.deviceProfile?.viewport;
    }

    this.agent = this.core.pool.createAgent({
      options,
      customEmulatorConfig,
      logger: this.logger,
      deviceProfile: userProfile?.deviceProfile,
      id: this.id,
      commandMarker: this.commands,
      userAgentOption: userProfile?.userAgent,
    });

    this.plugins = new CorePlugins(
      this.agent,
      {
        corePluginPaths: options.corePluginPaths,
        dependencyMap: options.dependencyMap,
        getSessionSummary: this.getSummary.bind(this),
      },
      this.core.corePluginsById,
    );

    // should come after plugins can initiate
    this.recordSession(providedOptions);

    this.commandRecorder = new CommandRecorder(this, this, null, null, [
      this.setSnippet,
      this.getSnippets,
      this.getDetachedElements,
      this.getDetachedResources,
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
    if (options.resumeSessionStartLocation === 'sessionStart') {
      await this.resetStorage();
      // create a new tab
    }
    Object.assign(this.options, options);
    this.commands.presetMeta = null;
    this.emit('resumed');
  }

  private cleanup(): void {
    this.agent = null;
    this.commandRecorder = null;
    this.browserContext = null;
    this.plugins = null;
    this.commands = null;
    this.core = null;
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
    // don't broadcast intercepted resources
    if (event.type === 'mitm-response' && !event.requestProcessingDetails.wasIntercepted) {
      this.tabsById.get(event.tabId)?.emit('resource', event.resource);
    }
  }

  private onWebsocketMessage(
    event: BrowserContext['websocketMessages']['EventTypes']['new'],
  ): void {
    this.db.websocketMessages.insert(event.lastCommandId, event.message);
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
    this.db.sockets.insert({
      id: event.socket.id,
      localAddress: event.socket.localAddress,
      remoteAddress: event.socket.remoteAddress,
      dnsResolvedIp: event.socket.dnsResolvedIp,
      alpn: event.socket.alpn,
      serverName: event.socket.serverName,
      createTime: event.socket.createTime,
      dnsLookupTime: event.socket.dnsLookupTime,
      ipcConnectionTime: event.socket.ipcConnectionTime,
      connectTime: event.socket.connectTime,
      bytesRead: event.socket.socket?.bytesRead,
      bytesWritten: event.socket.socket?.bytesWritten,
      errorTime: event.socket.errorTime,
      closeTime: event.socket.closeTime,
      connectError: event.socket.connectError,
    });
  }

  private onSocketConnect(event: ISocketEvent): void {
    if (!this.browserContext.resources.isCollecting) return;
    this.db.sockets.insert({
      id: event.socket.id,
      localAddress: event.socket.localAddress,
      remoteAddress: event.socket.remoteAddress,
      dnsResolvedIp: event.socket.dnsResolvedIp,
      alpn: event.socket.alpn,
      serverName: event.socket.serverName,
      createTime: event.socket.createTime,
      dnsLookupTime: event.socket.dnsLookupTime,
      ipcConnectionTime: event.socket.ipcConnectionTime,
      connectTime: event.socket.connectTime,
      bytesRead: event.socket.socket?.bytesRead,
      bytesWritten: event.socket.socket?.bytesWritten,
      errorTime: event.socket.errorTime,
      closeTime: event.socket.closeTime,
      connectError: event.socket.connectError,
    });
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

  private getConfiguration(): IHeroMeta {
    const { viewport, locale, timezoneId, geolocation, windowNavigatorPlatform } =
      this.emulationProfile;

    const {
      string: userAgentString,
      operatingSystemName,
      operatingSystemVersion: osVersion,
      uaClientHintsPlatformVersion,
      browserVersion,
      browserName,
    } = this.emulationProfile.userAgentOption ?? {};

    const browserFullVersion = [
      browserVersion.major,
      browserVersion.minor,
      browserVersion.build,
      browserVersion.patch,
    ]
      .filter(x => x !== undefined)
      .join('.');

    const operatingSystemVersion = [
      osVersion.major,
      osVersion.minor,
      osVersion.build,
      osVersion.patch,
    ]
      .filter(x => x !== undefined)
      .join('.');

    return {
      sessionId: this.id,
      ...this.options,
      viewport,
      locale,
      timezoneId,
      geolocation,
      userAgentString,
      operatingSystemName,
      uaClientHintsPlatformVersion,
      windowNavigatorPlatform,
      operatingSystemVersion,
      browserName,
      browserFullVersion,
      renderingEngine: this.browserEngine.name,
      renderingEngineVersion: this.browserEngine.fullVersion,
    };
  }

  private recordSession(providedOptions: ISessionCreateOptions): void {
    if (!this.browserEngine) {
      let extraMessage = '.';
      if (this.options.userAgent) extraMessage = ` matching selector(${this.options.userAgent}).`;
      throw new Error(`Failed to select a browser engine${extraMessage}`);
    }

    const { sessionName: _name, scriptInvocationMeta, ...optionsToStore } = providedOptions;

    this.db.session.insert(
      this.getConfiguration(),
      this.createdTime,
      scriptInvocationMeta,
      this.emulationProfile.deviceProfile,
      optionsToStore,
    );
  }

  private getCustomSessionPath(sessionId: string): string {
    return this.options.sessionDbDirectory
      ? Path.join(this.options.sessionDbDirectory, `${sessionId}.db`)
      : undefined;
  }

  public static async restoreOptionsFromSessionRecord(
    options: ISessionCreateOptions,
    resumeSessionId: string,
    core: Core,
  ): Promise<ISessionCreateOptions> {
    // if session not active, re-create
    let db: SessionDb;
    try {
      db = await core.sessionRegistry.get(resumeSessionId);
    } catch (err) {
      // not found
    }
    if (!db) {
      const data = [
        ''.padEnd(50, '-'),
        `------HERO SESSION ID`.padEnd(50, '-'),
        `------${core.dataDir}`.padEnd(50, '-'),
        `------${resumeSessionId ?? ''}`.padEnd(50, '-'),
        ''.padEnd(50, '-'),
      ].join('\n');

      throw new Error(
        `You're trying to resume a Hero session that could not be located.
${data}`,
      );
    }

    const record = db.session.get();
    if (record.createSessionOptions) {
      Object.assign(options, record.createSessionOptions);
    }
    options.userAgent = record.userAgentString;
    options.locale = record.locale;
    options.timezoneId = record.timezoneId;
    options.viewport = record.viewport;

    options.userProfile ??= {};
    options.userProfile.deviceProfile ??= record.deviceProfile;
    return options;
  }

  public static async create(
    options: ISessionCreateOptions,
    core: Core,
  ): Promise<{ session: Session; tab: Tab; isSessionResume: boolean }> {
    let session: Session;
    let tab: Tab;
    let isSessionResume = false;

    // try to resume session. Modify options to match if not active.
    const { resumeSessionId, resumeSessionStartLocation } = options;
    if (resumeSessionId) {
      if (resumeSessionStartLocation !== 'sessionStart') {
        session = Session.get(resumeSessionId);
        if (session) {
          await session.resume(options);
          tab = session.getLastActiveTab();
          isSessionResume = true;
          session.logger.info('Continuing session', { options });
        }
      }
      if (!session) {
        await Session.restoreOptionsFromSessionRecord(options, resumeSessionId, core);
      }
    }

    if (!session) {
      await core.start();
      session = new Session(options, core);

      await session.openBrowser();
    }
    tab ??= await session.createTab();

    if (resumeSessionId) {
      if (resumeSessionStartLocation === 'sessionStart' && session.id !== resumeSessionId) {
        const newId = session.id;

        const resumed = Session.get(resumeSessionId);
        // Bind the new session close to the original one if it's still open
        if (resumed) {
          resumed.logger.info('Session resumed from start.', { options });
          resumed.events.once(resumed, 'closed', () => Session.get(newId)?.close(true));
        }
      }
      // Broadcast new event kept-alive to the original session
      session.events.on(session, 'kept-alive', () => {
        const resumed = Session.get(resumeSessionId);
        if (resumed) {
          resumed.awaitedEventEmitter.emit('rerun-kept-alive');
        }
      });
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
