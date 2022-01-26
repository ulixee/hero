import { IPuppetPage } from '@ulixee/hero-interfaces/IPuppetPage';
import Log from '@ulixee/commons/lib/Logger';
import IPuppetContext from '@ulixee/hero-interfaces/IPuppetContext';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ConnectionToCoreApi from '@ulixee/hero-core/connections/ConnectionToCoreApi';
import { ITick } from '@ulixee/hero-core/apis/Session.ticks';
import { Session } from '@ulixee/hero-core';
import { ISessionResourceDetails } from '@ulixee/hero-core/apis/Session.resource';
import TabPlaybackController from './TabPlaybackController';
import MirrorNetwork from '../lib/MirrorNetwork';
import DirectConnectionToCoreApi from '@ulixee/hero-core/connections/DirectConnectionToCoreApi';
import ITimelineMetadata from '@ulixee/hero-interfaces/ITimelineMetadata';
import CorePlugins from '@ulixee/hero-core/lib/CorePlugins';

const { log } = Log(module);

export default class TimetravelPlayer extends TypedEventEmitter<{
  'all-tabs-closed': void;
  'timetravel-to-end': void;
  'new-tick-command': void;
  open: void;
}> {
  public get activeCommandId(): number {
    if (this.isOpen) {
      return this.activeTab?.currentTick?.commandId;
    }
  }

  public activeTabId: number;

  public get activeTab(): TabPlaybackController {
    return this.tabsById.get(this.activeTabId);
  }

  public get isOpen(): boolean {
    for (const tab of this.tabsById.values()) {
      if (tab.isOpen) return true;
    }
    return false;
  }

  private mirrorNetwork = new MirrorNetwork({
    ignoreJavascriptRequests: true,
    headersFilter: ['set-cookie'],
    loadResourceDetails: this.getResourceDetails.bind(this),
  });

  private tabsById = new Map<number, TabPlaybackController>();
  private readonly sessionOptions: ISessionCreateOptions;
  private isReady: Promise<void>;

  private constructor(
    readonly sessionId: string,
    readonly connection: ConnectionToCoreApi,
    readonly loadIntoContext: { browserContext?: IPuppetContext; plugins?: CorePlugins },
    private timelineRange?: [startTime: number, endTime?: number],
    readonly debugLogging = false,
  ) {
    super();
    this.sessionOptions = Object.assign(
      {},
      Session.get(sessionId)?.options ?? Session.restoreOptionsFromSessionRecord({}, sessionId),
    );
    this.sessionOptions.mode = 'timetravel';
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
    await this.openTab(tab);

    await tab.loadTick(tick);
  }

  public async step(direction: 'forward' | 'back'): Promise<number> {
    this.isReady ??= this.load();
    await this.isReady;
    let percentOffset: number;
    if (!this.isOpen) {
      percentOffset = this.activeTab.ticks[this.activeTab.ticks.length - 1]?.timelineOffsetPercent;
    } else if (direction === 'forward') {
      percentOffset = this.activeTab.nextTimelineOffsetPercent;
    } else {
      percentOffset = this.activeTab.previousTimelineOffsetPercent;
    }
    await this.goto(percentOffset);
    return percentOffset;
  }

  public async goto(
    sessionOffsetPercent: number,
    statusMetadata?: ITimelineMetadata,
  ): Promise<TabPlaybackController> {
    this.isReady ??= this.load();
    await this.isReady;

    /**
     * TODO: eventually this playbar needs to know which tab is active in the timeline at this offset
     *       If 1 tab is active, switch to it, otherwise, need to show the multi-timeline view and pick one tab to show
     */
    const tab = this.activeTab;

    const startTick = tab.currentTick;
    const startedOpen = tab.isOpen;
    await this.openTab(tab);
    if (sessionOffsetPercent !== undefined) {
      await tab.setTimelineOffset(sessionOffsetPercent);
    } else {
      await tab.loadEndState();
    }

    if (startedOpen && sessionOffsetPercent === 100) {
      this.emit('timetravel-to-end');
    }
    if (tab.currentTick?.commandId !== startTick?.commandId) {
      this.emit('new-tick-command');
    }
    if (statusMetadata) await this.showLoadStatus(statusMetadata);
    return tab;
  }

  public async showLoadStatus(metadata: ITimelineMetadata): Promise<void> {
    if (!this.activeTab) return;
    const timelineOffsetPercent = this.activeTab.currentTimelineOffsetPct;
    if (!metadata || timelineOffsetPercent === 100) return;

    let currentUrl: ITimelineMetadata['urls'][0];
    let activeStatus: ITimelineMetadata['urls'][0]['loadStatusOffsets'][0];
    for (const url of metadata.urls) {
      if (url.offsetPercent > timelineOffsetPercent) break;
      currentUrl = url;
    }

    for (const status of currentUrl?.loadStatusOffsets ?? []) {
      if (status.offsetPercent > timelineOffsetPercent) break;
      activeStatus = status;
    }

    if (activeStatus) {
      await this.showStatusText(activeStatus.status);
    }
  }

  public async showStatusText(text: string): Promise<void> {
    await this.isReady;
    const tab = this.activeTab;
    if (!tab) return;
    await this.openTab(tab);
    await tab.showStatusText(text);
  }

  public async close(): Promise<void> {
    this.isReady = null;
    for (const tab of this.tabsById.values()) {
      await tab.close();
    }
    this.activeTabId = null;
    this.tabsById.clear();
  }

  public activateTab(tabPlaybackController: TabPlaybackController): void {
    this.activeTabId = tabPlaybackController.id;
    if (!this.tabsById.has(tabPlaybackController.id)) {
      this.tabsById.set(tabPlaybackController.id, tabPlaybackController);
    }
  }

  public async refreshTicks(
    timelineOffsetRange: [startTime: number, endTime?: number],
  ): Promise<void> {
    if (this.timelineRange && this.timelineRange.toString() === timelineOffsetRange.toString())
      return;
    if (timelineOffsetRange) {
      this.timelineRange = [...timelineOffsetRange];
    }
    await this.load();
  }

  private async openTab(tab: TabPlaybackController): Promise<void> {
    if (tab.isOpen) return;
    await tab.open(this.loadIntoContext.browserContext, this.activePlugins.bind(this));
  }

  private async activePlugins(page: IPuppetPage): Promise<void> {
    if (!this.loadIntoContext.plugins) return;
    await Promise.all(
      this.loadIntoContext.plugins.corePlugins
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
        timelineRange: this.timelineRange,
      },
    });

    if (this.debugLogging) {
      log.info('Timetravel Tab State', {
        sessionId: this.sessionId,
        tabDetails: ticksResult.tabDetails,
      });
    }

    for (const tabDetails of ticksResult.tabDetails) {
      const tabPlaybackController = this.tabsById.get(tabDetails.tab.id);
      if (tabPlaybackController) {
        await tabPlaybackController.updateTabDetails(tabDetails);
        continue;
      }
      const tab = new TabPlaybackController(
        tabDetails,
        this.mirrorNetwork,
        this.sessionId,
        this.debugLogging,
      );
      tab.mirrorPage.on('open', this.onTabOpen.bind(this));
      tab.mirrorPage.on('close', this.checkAllPagesClosed.bind(this));
      this.tabsById.set(tabDetails.tab.id, tab);

      this.activeTabId ??= tabDetails.tab.id;
    }

    const resourcesResult = await this.connection.run({
      api: 'Session.resources',
      args: { sessionId: this.sessionId, omitWithoutResponse: true, omitNonHttpGet: true },
    });

    this.mirrorNetwork.setResources(resourcesResult.resources);
  }

  private onTabOpen(): void {
    this.emit('open');
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

  public static create(
    heroSessionId: string,
    loadIntoContext: { browserContext?: IPuppetContext; plugins?: CorePlugins },
    timelineRange?: [startTime: number, endTime: number],
    connectionToCoreApi?: ConnectionToCoreApi,
  ): TimetravelPlayer {
    connectionToCoreApi ??= new DirectConnectionToCoreApi();
    return new TimetravelPlayer(heroSessionId, connectionToCoreApi, loadIntoContext, timelineRange);
  }
}
