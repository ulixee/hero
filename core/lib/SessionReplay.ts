import { IPuppetPage } from '@ulixee/hero-interfaces/IPuppetPage';
import Log from '@ulixee/commons/lib/Logger';
import IPuppetContext from '@ulixee/hero-interfaces/IPuppetContext';
import { Protocol } from '@ulixee/hero-interfaces/IDevtoolsSession';
import decodeBuffer from '@ulixee/commons/lib/decodeBuffer';
import ICorePlugin, { ISessionSummary } from '@ulixee/hero-interfaces/ICorePlugin';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import SessionReplayTab from './SessionReplayTab';
import ConnectionToCoreApi from '../connections/ConnectionToCoreApi';
import { IDocument, ITick } from '../apis/Session.ticks';
import { ISessionResource } from '../apis/Session.resources';
import { ISessionResourceDetails } from '../apis/Session.resource';
import CorePlugins from './CorePlugins';
import { Session } from '../index';
import GlobalPool from './GlobalPool';
import InjectedScripts from './InjectedScripts';
import Fetch = Protocol.Fetch;

const { log } = Log(module);

export default class SessionReplay extends TypedEventEmitter<{ 'all-tabs-closed': void }> {
  public activeTab: SessionReplayTab;
  public get isOpen(): boolean {
    for (const tab of this.tabsById.values()) {
      if (tab.isOpen) return true;
    }
    return false;
  }

  private tabsById = new Map<number, SessionReplayTab>();
  private resourceLookup: { [method_url: string]: ISessionResource[] } = {};
  private readonly documents: IDocument[] = [];
  private readonly sessionOptions: ISessionCreateOptions;
  private browserContext: IPuppetContext;
  private isReady: Promise<void>;

  private pageIds = new Set<string>();

  constructor(
    readonly sessionId: string,
    readonly connection: ConnectionToCoreApi,
    readonly plugins: ICorePlugin[] = [],
    readonly debugLogging = false,
  ) {
    super();
    this.sessionOptions =
      Session.get(sessionId)?.options ?? Session.restoreOptionsFromSessionRecord({}, sessionId);
  }

  public async open(
    browserContext: IPuppetContext,
    timelineOffsetPercent?: number,
  ): Promise<SessionReplayTab> {
    this.browserContext = browserContext;
    this.isReady ??= this.load();
    return await this.goto(timelineOffsetPercent);
  }

  public isReplayPage(pageId: string): boolean {
    return this.pageIds.has(pageId);
  }

  public async loadTick(tick: ITick): Promise<void> {
    await this.isReady;
    const tab = this.activeTab;
    if (!tab.isOpen) await tab.open();

    await tab.loadTick(tick);
  }

  public async goto(sessionOffsetPercent: number): Promise<SessionReplayTab> {
    await this.isReady;

    /**
     * TODO: eventually this playbar needs to know which tab is active in the timeline at this offset
     *       If 1 tab is active, switch to it, otherwise, need to show the multi-timeline view and pick one tab to show
     */
    const tab = this.activeTab;
    if (!tab.isOpen) {
      await tab.open();
    }
    if (sessionOffsetPercent !== undefined) {
      await tab.setTimelineOffset(sessionOffsetPercent);
    } else {
      await tab.loadEndState();
    }
    return tab;
  }

  public async showStatusText(text: string): Promise<void> {
    await this.isReady;
    const tab = this.activeTab;
    if (!tab.isOpen) {
      await tab.open();
    }
    await tab.showStatusText(text);
  }

  public async close(closeContext = false): Promise<void> {
    this.isReady = null;
    if (!closeContext) {
      for (const tab of this.tabsById.values()) {
        await tab.close();
      }
      this.activeTab = null;
    } else {
      await this.browserContext?.close();
      this.browserContext = null;
    }
    this.tabsById.clear();
    this.resourceLookup = {};
    this.documents.length = 0;
  }

  public async mockNetworkRequests(
    request: Fetch.RequestPausedEvent,
  ): Promise<Fetch.FulfillRequestRequest> {
    const { url, method } = request.request;
    if (request.resourceType === 'Document') {
      const doctype = this.documents.find(x => x.url === url)?.doctype ?? '';
      return {
        requestId: request.requestId,
        responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }],
        body: Buffer.from(`${doctype}<html><head></head><body></body></html>`).toString('base64'),
      };
    }

    const matches = this.resourceLookup[`${method}_${url}`];
    if (!matches?.length) {
      return {
        requestId: request.requestId,
        responseCode: 404,
        body: Buffer.from(`Not Found`).toString('base64'),
      };
    }

    const { resource } = await this.connection.run({
      api: 'Session.resource',
      args: {
        sessionId: this.sessionId,
        resourceId: matches[0].id,
      },
    });

    const { headers, contentEncoding } = this.getMockHeaders(resource);
    let body = resource.body;

    // Chrome Devtools has an upstream issue that gzipped responses don't work, so we have to do it.. :(
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1138839
    if (contentEncoding) {
      body = await decodeBuffer(resource.body, contentEncoding);
      headers.splice(
        headers.findIndex(x => x.name === 'content-encoding'),
        1,
      );
    }
    return {
      requestId: request.requestId,
      body: body.toString('base64'),
      responseHeaders: headers,
      responseCode: resource.statusCode,
    };
  }

  public activateTab(sessionReplayTab: SessionReplayTab): void {
    this.activeTab = sessionReplayTab;
  }

  private async createNewPage(): Promise<IPuppetPage> {
    const page = await this.browserContext.newPage({ runPageScripts: false });
    this.pageIds.add(page.id);

    page.once('close', this.checkAllPagesClosed.bind(this));
    const sessionSummary = <ISessionSummary>{
      id: this.sessionId,
      options: this.sessionOptions,
    };
    await Promise.all([
      this.plugins.filter(x => x.onNewPuppetPage).map(x => x.onNewPuppetPage(page, sessionSummary)),
      InjectedScripts.installDetachedScripts(page, true),
      page.setNetworkRequestInterceptor(this.mockNetworkRequests.bind(this)),
      page.setJavaScriptEnabled(false),
    ]);
    return page;
  }

  private getMockHeaders(resource: ISessionResourceDetails): {
    isJavascript: boolean;
    hasChunkedTransfer: boolean;
    contentEncoding: string;
    headers: { name: string; value: string }[];
  } {
    const headers: { name: string; value: string }[] = [];
    let isJavascript = false;
    let contentEncoding: string;
    let hasChunkedTransfer = false;

    for (const [key, header] of Object.entries(resource.headers)) {
      const name = key.toLowerCase();

      if (name === 'content-encoding') {
        contentEncoding = header as string;
      }

      if (name === 'transfer-encoding' && header === 'chunked') {
        // node has stripped this out by the time we have the body
        hasChunkedTransfer = true;
        continue;
      }

      if (name === 'content-type' && header.includes('javascript')) {
        isJavascript = true;
        break;
      }

      if (Array.isArray(header)) {
        for (const value of header) {
          headers.push({ name, value });
        }
      } else {
        headers.push({ name, value: header });
      }
    }
    return { headers, isJavascript, contentEncoding, hasChunkedTransfer };
  }

  private async checkAllPagesClosed(): Promise<void> {
    await new Promise<void>(setImmediate);
    for (const tab of this.tabsById.values()) {
      if (tab.isOpen) return;
    }
    this.emit('all-tabs-closed');
  }

  private async load(): Promise<void> {
    await this.loadTicks();
    await this.loadResources();
  }

  private async loadTicks(): Promise<void> {
    const ticksResult = await this.connection.run({
      api: 'Session.ticks',
      args: {
        sessionId: this.sessionId,
        includeCommands: true,
        includeInteractionEvents: true,
        includePaintEvents: true,
      },
    });
    if (this.debugLogging) {
      log.info('Replay Tab State', {
        sessionId: this.sessionId,
        tabDetails: ticksResult.tabDetails,
      });
    }
    for (const tabDetails of ticksResult.tabDetails) {
      const tab = new SessionReplayTab(
        tabDetails,
        () => this.createNewPage(),
        this.sessionId,
        this.debugLogging,
      );
      this.activeTab ??= tab;
      this.tabsById.set(tabDetails.tab.id, tab);
      this.documents.push(...tabDetails.documents);
    }
  }

  private async loadResources(): Promise<void> {
    const resourcesResult = await this.connection.run({
      api: 'Session.resources',
      args: { sessionId: this.sessionId, omitWithoutResponse: true, omitNonHttpGet: true },
    });
    for (const resource of resourcesResult.resources) {
      const key = `${resource.method}_${resource.url}`;
      this.resourceLookup[key] ??= [];
      this.resourceLookup[key].push(resource);
    }
  }

  public static async recreateBrowserContextForSession(
    sessionId: string,
    headed = true,
  ): Promise<IPuppetContext> {
    const options = Session.restoreOptionsFromSessionRecord({}, sessionId);
    options.sessionResume = null;
    options.showBrowserInteractions = headed;
    options.showBrowser = headed;
    options.allowManualBrowserInteraction = false;

    const plugins = new CorePlugins(
      {
        humanEmulatorId: options.humanEmulatorId,
        browserEmulatorId: options.browserEmulatorId,
        userAgentSelector: options.userAgent,
        deviceProfile: options?.userProfile?.deviceProfile,
        getSessionSummary() {
          return {
            id: this.sessionId,
            options,
          };
        },
      },
      log,
    );
    plugins.browserEngine.isHeaded = true;
    plugins.configure(options);

    const puppet = await GlobalPool.getPuppet(plugins);
    return await puppet.newContext(plugins, log);
  }
}
