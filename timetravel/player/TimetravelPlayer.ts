import { IPuppetPage } from '@ulixee/hero-interfaces/IPuppetPage';
import Log from '@ulixee/commons/lib/Logger';
import IPuppetContext from '@ulixee/hero-interfaces/IPuppetContext';
import ICorePlugin from '@ulixee/hero-interfaces/ICorePlugin';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ConnectionToCoreApi from '@ulixee/hero-core/connections/ConnectionToCoreApi';
import { ITick } from '@ulixee/hero-core/apis/Session.ticks';
import { Session } from '@ulixee/hero-core';
import { ISessionResourceDetails } from '@ulixee/hero-core/apis/Session.resource';
import TabPlaybackController from './TabPlaybackController';
import MirrorNetwork from '../lib/MirrorNetwork';

const { log } = Log(module);

export default class TimetravelPlayer extends TypedEventEmitter<{ 'all-tabs-closed': void }> {
  public activeTab: TabPlaybackController;
  public get isOpen(): boolean {
    for (const tab of this.tabsById.values()) {
      if (tab.isOpen) return true;
    }
    return false;
  }

  private mirrorNetwork = new MirrorNetwork();
  private tabsById = new Map<number, TabPlaybackController>();
  private readonly sessionOptions: ISessionCreateOptions;
  private browserContext: IPuppetContext;
  private isReady: Promise<void>;

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
  ): Promise<TabPlaybackController> {
    this.browserContext = browserContext;
    this.isReady ??= this.load();
    return await this.goto(timelineOffsetPercent);
  }

  public isOwnPage(pageId: string): boolean {
    for (const tab of this.tabsById.values()) {
      if (tab.isPage(pageId)) return true;
    }
    return false;
  }

  public async loadTick(tick: ITick): Promise<void> {
    await this.isReady;
    const tab = this.activeTab;
    if (!tab.isOpen) await tab.open(this.browserContext);

    await tab.loadTick(tick);
  }

  public async goto(sessionOffsetPercent: number): Promise<TabPlaybackController> {
    await this.isReady;

    /**
     * TODO: eventually this playbar needs to know which tab is active in the timeline at this offset
     *       If 1 tab is active, switch to it, otherwise, need to show the multi-timeline view and pick one tab to show
     */
    const tab = this.activeTab;
    await this.openTab(tab);
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
    await this.openTab(tab);
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
  }

  public activateTab(tabPlaybackController: TabPlaybackController): void {
    this.activeTab = tabPlaybackController;
  }

  private async openTab(tab: TabPlaybackController): Promise<void> {
    if (tab.isOpen) return;
    await tab.open(this.browserContext, this.activePlugins.bind(this));
  }

  private async activePlugins(page: IPuppetPage): Promise<void> {
    await Promise.all(
      this.plugins
        .filter(x => x.onNewPuppetPage)
        .map(x =>
          x.onNewPuppetPage(page, {
            id: this.sessionId,
            options: this.sessionOptions,
          }),
        ),
    );
  }

  private async checkAllPagesClosed(): Promise<void> {
    await new Promise<void>(setImmediate);
    for (const tab of this.tabsById.values()) {
      if (tab.isOpen) return;
    }
    this.emit('all-tabs-closed');
  }

  private async load(): Promise<void> {
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
      const tab = new TabPlaybackController(
        tabDetails,
        this.mirrorNetwork,
        this.sessionId,
        this.debugLogging,
      );
      tab.mirrorPage.on('close', this.checkAllPagesClosed.bind(this));
      this.tabsById.set(tabDetails.tab.id, tab);

      this.activeTab ??= tab;
    }

    const resourcesResult = await this.connection.run({
      api: 'Session.resources',
      args: { sessionId: this.sessionId, omitWithoutResponse: true, omitNonHttpGet: true },
    });

    this.mirrorNetwork.loadResources(resourcesResult.resources, this.getResourceDetails.bind(this));
  }

  private async getResourceDetails(resourceId: number): Promise<ISessionResourceDetails> {
    const { resource } = await this.connection.run({
      api: 'Session.resource',
      args: {
        sessionId: this.sessionId,
        resourceId,
      },
    });
    return resource;
  }
}
