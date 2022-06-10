import { IPage } from '@unblocked-web/specifications/agent/browser/IPage';
import Log from '@ulixee/commons/lib/Logger';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { ITick } from '@ulixee/hero-core/apis/Session.ticks';
import { Session } from '@ulixee/hero-core';
import { ISessionResourceDetails } from '@ulixee/hero-core/apis/Session.resource';
import ConnectionToHeroApiClient from '@ulixee/hero-core/connections/ConnectionToHeroApiClient';
import ConnectionToHeroApiCore from '@ulixee/hero-core/connections/ConnectionToHeroApiCore';
import ITimelineMetadata from '@ulixee/hero-interfaces/ITimelineMetadata';
import CorePlugins from '@ulixee/hero-core/lib/CorePlugins';
import BrowserContext from '@unblocked-web/agent/lib/BrowserContext';
import MirrorNetwork from '../lib/MirrorNetwork';
import TabPlaybackController from './TabPlaybackController';

const { log } = Log(module);

export default class TimetravelPlayer extends TypedEventEmitter<{
  'new-tick-command': {
    commandId: number;
    paintIndex: number;
  };
  'new-paint-index': {
    tabId: number;
    paintIndexRange: [start: number, end: number];
    documentLoadPaintIndex: number;
  };
  'new-offset': {
    tabId: number;
    percentOffset: number;
    focusedRange: [start: number, end: number];
  };
  'tab-opened': void;
  'all-tabs-closed': void;
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
    readonly connection: ConnectionToHeroApiCore,
    readonly loadIntoContext: { browserContext?: BrowserContext; plugins?: CorePlugins },
    private timelineRange?: [startTime: number, endTime?: number],
    readonly debugLogging = false,
  ) {
    super();
    this.sessionOptions = {
      
      ...Session.get(sessionId)?.options ?? Session.restoreOptionsFromSessionRecord({}, sessionId),
    };
    this.sessionOptions.mode = 'timetravel';
  }

  public isOwnPage(pageId: string): boolean {
    for (const tab of this.tabsById.values()) {
      if (tab.isPage(pageId)) return true;
    }
    return false;
  }

  public async findCommandPercentOffset(commandId: number): Promise<number> {
    this.isReady ??= this.load();
    await this.isReady;
    for (const tick of this.activeTab.ticks) {
      if (tick.commandId === commandId) return tick.timelineOffsetPercent;
    }
    return 0;
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

  public async setFocusedOffsetRange(offsetRange: [start: number, end: number]): Promise<void> {
    this.isReady ??= this.load();
    await this.isReady;
    this.activeTab.setFocusedOffsetRange(offsetRange);
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
    const startOffset = tab.currentTimelineOffsetPct;
    await this.openTab(tab);
    if (sessionOffsetPercent !== undefined) {
      await tab.setTimelineOffset(sessionOffsetPercent);
    } else {
      await tab.loadEndState();
    }

    if (tab.currentTick && tab.currentTick.commandId !== startTick?.commandId) {
      this.emit('new-tick-command', {
        commandId: tab.currentTick.commandId,
        paintIndex: tab.currentTick.paintEventIndex,
      });
    }
    if (tab.currentTick && tab.currentTick.paintEventIndex !== startTick?.paintEventIndex) {
      this.emit('new-paint-index', {
        paintIndexRange: tab.focusedPaintIndexes,
        tabId: tab.id,
        documentLoadPaintIndex: tab.currentTick.documentLoadPaintIndex,
      });
    }
    if (tab.currentTimelineOffsetPct !== startOffset) {
      this.emit('new-offset', {
        tabId: tab.id,
        percentOffset: tab.currentTimelineOffsetPct,
        focusedRange: tab.focusedOffsetRange,
      });
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
    if (this.isReady === null) return;
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

  private async activePlugins(page: IPage): Promise<void> {
    if (!this.loadIntoContext.plugins) return;
    await Promise.all(
      this.loadIntoContext.plugins.instances.filter(x => x.onNewPage).map(x => x.onNewPage(page)),
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
    const ticksResult = await this.connection.sendRequest({
      command: 'Session.ticks',
      args: [
        {
          sessionId: this.sessionId,
          includeCommands: true,
          includeInteractionEvents: true,
          includePaintEvents: true,
          timelineRange: this.timelineRange,
        },
      ],
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

    const resourcesResult = await this.connection.sendRequest({
      command: 'Session.resources',
      args: [{ sessionId: this.sessionId, omitWithoutResponse: true, omitNonHttpGet: true }],
    });

    this.mirrorNetwork.setResources(resourcesResult.resources, this.getResourceDetails.bind(this));
  }

  private onTabOpen(): void {
    this.emit('tab-opened');
  }

  private async getResourceDetails(resourceId: number): Promise<ISessionResourceDetails> {
    const { resource } = await this.connection.sendRequest({
      command: 'Session.resource',
      args: [
        {
          sessionId: this.sessionId,
          resourceId,
        },
      ],
    });
    return resource;
  }

  public static create(
    heroSessionId: string,
    loadIntoContext: { browserContext?: BrowserContext; plugins?: CorePlugins },
    timelineRange?: [startTime: number, endTime: number],
    connectionToCoreApi?: ConnectionToHeroApiCore,
  ): TimetravelPlayer {
    if (!connectionToCoreApi) {
      const bridge = ConnectionToHeroApiClient.createBridge();
      connectionToCoreApi = new ConnectionToHeroApiCore(bridge.transportToCore);
    }
    return new TimetravelPlayer(heroSessionId, connectionToCoreApi, loadIntoContext, timelineRange);
  }
}
