import Log from '@ulixee/commons/lib/Logger';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { Session } from '@ulixee/hero-core';
import ConnectionToHeroApiClient from '@ulixee/hero-core/connections/ConnectionToHeroApiClient';
import ConnectionToHeroApiCore from '@ulixee/hero-core/connections/ConnectionToHeroApiCore';
import ITimelineMetadata from '@ulixee/hero-interfaces/ITimelineMetadata';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { IDomRecording } from '@ulixee/hero-core/models/DomChangesTable';
import { ITabDetails } from '@ulixee/hero-core/apis/Session.ticks';
import TabPlaybackController from './TabPlaybackController';
import MirrorPage from '../lib/MirrorPage';

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
}> {
  public get activeCommandId(): number {
    return this.activeTab?.currentTick?.commandId;
  }

  public activeTabId: number;

  public get activeTab(): TabPlaybackController {
    return this.tabsById.get(this.activeTabId);
  }

  public get isOpen(): boolean {
    return this.loadedPromise?.isResolved;
  }

  private tabsById = new Map<number, TabPlaybackController>();
  private loadedPromise: Resolvable<void>;
  private readonly sessionOptions: ISessionCreateOptions;

  private constructor(
    readonly sessionId: string,
    readonly connection: ConnectionToHeroApiCore,
    readonly context: IMirrorPageContext,
    private timelineRange?: [startTime: number, endTime?: number],
    readonly debugLogging = false,
  ) {
    super();
    this.sessionOptions = {
      ...(Session.get(sessionId)?.options ??
        Session.restoreOptionsFromSessionRecord({}, sessionId)),
    };
    this.sessionOptions.mode = 'timetravel';
  }

  public async findCommandPercentOffset(commandId: number): Promise<number> {
    await this.load();
    for (const tick of this.activeTab.ticks) {
      if (tick.commandId === commandId) return tick.timelineOffsetPercent;
    }
    return 0;
  }

  public async step(direction: 'forward' | 'back'): Promise<number> {
    await this.load();
    let percentOffset: number;
    if (direction === 'forward') {
      percentOffset = this.activeTab.nextTimelineOffsetPercent;
    } else {
      percentOffset = this.activeTab.previousTimelineOffsetPercent;
    }
    await this.goto(percentOffset);
    return percentOffset;
  }

  public async setFocusedOffsetRange(offsetRange: [start: number, end: number]): Promise<void> {
    await this.load();
    this.activeTab.setFocusedOffsetRange(offsetRange);
  }

  public async goto(
    sessionOffsetPercent: number,
    statusMetadata?: ITimelineMetadata,
  ): Promise<TabPlaybackController> {
    await this.load();

    /**
     * TODO: eventually this playbar needs to know which tab is active in the timeline at this offset
     *       If 1 tab is active, switch to it, otherwise, need to show the multi-timeline view and pick one tab to show
     */
    const tab = this.activeTab;
    const startTick = tab.currentTick;
    const startOffset = tab.currentTimelineOffsetPct;
    await tab.gotoStart();
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
    if (this.loadedPromise === null) return;
    await this.loadedPromise;
    const tab = this.activeTab;
    if (!tab) return;
    await tab.gotoStart();
    await tab.showStatusText(text);
  }

  public async close(): Promise<void> {
    this.loadedPromise = null;
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
    this.loadedPromise = null;
    await this.load();
  }

  public async getDomRecording(): Promise<IDomRecording> {
    await this.load();
    return;
  }

  public async setTabState(state: ITabDetails[]): Promise<void> {
    this.loadedPromise ??= new Resolvable();

    for (const tabDetails of state) {
      const tabPlaybackController = this.tabsById.get(tabDetails.tab.id);
      if (tabPlaybackController) {
        await tabPlaybackController.updateTabDetails(tabDetails);
        continue;
      }
      const mirrorPage = await this.context.getMirrorPage(tabDetails.tab.id);
      const tab = new TabPlaybackController(tabDetails, mirrorPage);
      this.tabsById.set(tabDetails.tab.id, tab);

      this.activeTabId ??= tabDetails.tab.id;
    }
    this.loadedPromise.resolve();
  }

  private async load(): Promise<void> {
    if (this.loadedPromise) return this.loadedPromise;
    this.loadedPromise = new Resolvable();
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
        ticksResult,
      });
    }

    await this.setTabState(ticksResult.tabDetails);

    this.loadedPromise.resolve();
  }

  public static create(
    heroSessionId: string,
    context: IMirrorPageContext,
    timelineRange?: [startTime: number, endTime: number],
    connectionToCoreApi?: ConnectionToHeroApiCore,
  ): TimetravelPlayer {
    if (!connectionToCoreApi) {
      const bridge = ConnectionToHeroApiClient.createBridge();
      connectionToCoreApi = new ConnectionToHeroApiCore(bridge.transportToCore);
    }
    return new TimetravelPlayer(heroSessionId, connectionToCoreApi, context, timelineRange);
  }
}

export interface IMirrorPageContext {
  getMirrorPage(tabId: number): Promise<MirrorPage>;
}
