import { v1 as uuidv1 } from 'uuid';
import Log from '@ulixee/commons/Logger';
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
import { TypedEventEmitter } from '@ulixee/commons/eventUtils';
import ICoreEventPayload from '@ulixee/hero-interfaces/ICoreEventPayload';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import { IBoundLog } from '@ulixee/hero-interfaces/ILog';
import { MitmProxy } from '@ulixee/hero-mitm/index';
import IViewport from '@ulixee/hero-interfaces/IViewport';
import IJsPathResult from '@ulixee/hero-interfaces/IJsPathResult';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import IGeolocation from '@ulixee/hero-interfaces/IGeolocation';
import SessionState from './SessionState';
import AwaitedEventListener from './AwaitedEventListener';
import GlobalPool from './GlobalPool';
import Tab from './Tab';
import UserProfile from './UserProfile';
import InjectedScripts from './InjectedScripts';
import CommandRecorder from './CommandRecorder';
import DetachedTabState from './DetachedTabState';
import CorePlugins from './CorePlugins';
import { IOutputChangeRecord } from '../models/OutputTable';

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

  public tabsById = new Map<number, Tab>();

  public get isClosing() {
    return this._isClosing;
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
  private detachedTabsById = new Map<number, Tab>();

  private tabIdCounter = 0;
  private frameIdCounter = 0;

  constructor(readonly options: ISessionCreateOptions) {
    super();
    this.id = uuidv1();
    Session.byId[this.id] = this;
    const providedOptions = { ...options };
    this.logger = log.createChild(module, { sessionId: this.id });
    this.awaitedEventListener = new AwaitedEventListener(this);

    const {
      browserEmulatorId,
      humanEmulatorId,
      dependencyMap,
      corePluginPaths,
      userProfile,
      userAgent,
    } = options;

    const userAgentSelector = userAgent ?? userProfile?.userAgentString;
    this.plugins = new CorePlugins(
      {
        userAgentSelector,
        browserEmulatorId,
        humanEmulatorId,
        dependencyMap,
        corePluginPaths,
        deviceProfile: userProfile?.deviceProfile,
      },
      this.logger,
    );

    this.browserEngine = this.plugins.browserEngine;

    this.userProfile = options.userProfile;
    this.upstreamProxyUrl = options.upstreamProxyUrl;
    this.geolocation = options.geolocation;

    this.plugins.configure(options);
    this.timezoneId = options.timezoneId || '';
    this.viewport =
      options.viewport ||
      ({
        positionX: 0,
        positionY: 0,
        screenWidth: 1440,
        screenHeight: 900,
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
      } as IViewport);

    this.baseDir = GlobalPool.sessionsDir;
    this.sessionState = new SessionState(
      this.baseDir,
      this.id,
      options.sessionName,
      options.scriptInstanceMeta,
      this.viewport,
    );
    this.sessionState.recordSession({
      browserEmulatorId: this.plugins.browserEmulator.id,
      browserVersion: this.browserEngine.fullVersion,
      humanEmulatorId: this.plugins.humanEmulator.id,
      locale: options.locale,
      timezoneId: options.timezoneId,
      sessionOptions: providedOptions,
    });
    this.mitmRequestSession = new RequestSession(this.id, this.plugins, this.upstreamProxyUrl);
    this.commandRecorder = new CommandRecorder(this, this, null, null, [
      this.configure,
      this.detachTab,
      this.exportUserProfile,
    ]);
  }

  public getTab(id: number): Tab {
    return this.tabsById.get(id) ?? this.detachedTabsById.get(id);
  }

  public async configure(options: IConfigureSessionOptions) {
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
    sourceTab: Tab,
    callsite: string,
    key?: string,
  ): Promise<{
    detachedTab: Tab;
    detachedState: DetachedTabState;
    prefetchedJsPaths: IJsPathResult[];
  }> {
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
    return { detachedTab: newTab, detachedState, prefetchedJsPaths: prefetches };
  }

  public getMitmProxy(): { address: string; password?: string } {
    return {
      address: this.isolatedMitmProxy ? `localhost:${this.isolatedMitmProxy.port}` : null,
      password: this.isolatedMitmProxy ? null : this.id,
    };
  }

  public async registerWithMitm(
    sharedMitmProxy: MitmProxy,
    doesPuppetSupportBrowserContextProxy: boolean,
  ): Promise<void> {
    let mitmProxy = sharedMitmProxy;
    if (doesPuppetSupportBrowserContextProxy) {
      this.isolatedMitmProxy = await MitmProxy.start(
        GlobalPool.localProxyPortStart,
        GlobalPool.sessionsDir,
      );
      mitmProxy = this.isolatedMitmProxy;
    }

    mitmProxy.registerSession(this.mitmRequestSession, !!this.isolatedMitmProxy);
  }

  public async initialize(context: IPuppetContext) {
    this.browserContext = context;
    context.on('devtools-message', this.onDevtoolsMessage.bind(this));
    if (this.userProfile) {
      await UserProfile.install(this);
    }

    context.defaultPageInitializationFn = InjectedScripts.install;

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

  public async createTab() {
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

  public async close() {
    delete Session.byId[this.id];
    if (this._isClosing) return;
    this.emit('closing');
    this._isClosing = true;
    const start = log.info('Session.Closing', {
      sessionId: this.id,
    });

    try {
      this.awaitedEventListener.close();
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

  public onAwaitedEvent(payload: ICoreEventPayload) {
    this.emit('awaited-event', payload);
  }

  public recordOutput(changes: IOutputChangeRecord[]) {
    this.sessionState.recordOutputChanges(changes);
  }

  private onDevtoolsMessage(event: IPuppetContextEvents['devtools-message']) {
    this.sessionState.captureDevtoolsMessage(event);
  }

  private onMitmRequest(event: IRequestSessionRequestEvent) {
    // don't know the tab id at this point
    this.sessionState.captureResource(null, event, false);
  }

  private onMitmResponse(event: IRequestSessionResponseEvent) {
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

  private onMitmError(event: IRequestSessionHttpErrorEvent) {
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

  private registerTab(tab: Tab, page: IPuppetPage) {
    const id = tab.id;
    this.tabsById.set(id, tab);
    tab.on('close', () => this.tabsById.delete(id));
    page.popupInitializeFn = this.onNewTab.bind(this, tab);
    return tab;
  }

  private async newPage() {
    if (this._isClosing) throw new Error('Cannot create tab, shutting down');
    return await this.browserContext.newPage();
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
}
