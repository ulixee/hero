import { DomActionType } from '@ulixee/hero-interfaces/IDomChangeEvent';
import { IPuppetPage } from '@ulixee/hero-interfaces/IPuppetPage';
import { IScrollRecord } from '../models/ScrollEventsTable';
import { IMouseEventRecord } from '../models/MouseEventsTable';
import ICommandWithResult from '../interfaces/ICommandWithResult';
import { IPaintEvent, ITabDetails, ITick } from '../apis/Session.ticks';
import InjectedScripts from './InjectedScripts';
import SessionReplay from './SessionReplay';

export default class SessionReplayTab {
  public get ticks(): ITick[] {
    return this.tabDetails.ticks;
  }

  public get tabId(): number {
    return this.tabDetails.tab.id;
  }

  public get detachedFromTabId(): number {
    return this.tabDetails.tab.detachedFromTabId;
  }

  public get firstDocumentUrl(): string {
    return this.tabDetails.tab.startUrl;
  }

  public get tabCreatedTime(): number {
    return this.tabDetails.tab.createdTime;
  }

  public mainFrameId: number;

  public get currentTick(): ITick {
    return this.ticks[this.currentTickIndex];
  }

  public get nextTick(): ITick {
    return this.ticks[this.currentTickIndex + 1];
  }

  public readonly commandsById = new Map<number, ICommandWithResult>();

  public currentUrl: string;
  public currentPlaybarOffsetPct = 0;
  public isPlaying = false;
  public currentTickIndex = -1;
  // put in placeholder
  private paintEventsLoadedIdx = -1;
  private page: IPuppetPage;
  private domNodePathByFrameId = new Map<number, string>();

  constructor(
    private readonly tabDetails: ITabDetails,
    private readonly sessionReplay: SessionReplay,
  ) {
    for (const command of tabDetails.commands) {
      this.commandsById.set(command.id, command);
    }
    for (const frame of this.tabDetails.tab.frames) {
      if (frame.isMainFrame) this.mainFrameId = frame.id;
      this.domNodePathByFrameId.set(frame.id, frame.domNodePath);
    }
  }

  public async openTab(): Promise<void> {
    this.page = await this.sessionReplay.createNewPage();
    await this.goto(this.tabDetails.tab.startUrl);
  }

  public async play(onTick?: (tick: ITick) => void): Promise<void> {
    let pendingMillisDeficit = 0;
    this.isPlaying = true;

    for (let i = this.currentTickIndex; i < this.ticks.length; i += 1) {
      if (!this.isPlaying) break;
      if (i < 0) continue;

      const startTime = Date.now();
      await this.loadTick(i);
      onTick(this.ticks[i]);
      const fnDuration = Date.now() - startTime;

      if (i < this.ticks.length - 1) {
        const currentTick = this.ticks[i];
        const nextTick = this.ticks[i + 1];
        const diff = nextTick.timestamp - currentTick.timestamp;
        const delay = diff - fnDuration - pendingMillisDeficit;

        if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
        else if (delay < 0) pendingMillisDeficit = Math.abs(delay);
      }
    }
  }

  public pause(): void {
    this.isPlaying = false;
  }

  public goBack(): Promise<void> {
    const prevTickIdx =
      this.currentTickIndex > 0 ? this.currentTickIndex - 1 : this.currentTickIndex;
    return this.loadTick(prevTickIdx);
  }

  public goForward(): Promise<void> {
    const result = this.loadTick(this.currentTickIndex + 1);
    if (this.currentTickIndex === this.ticks.length - 1) {
      this.currentPlaybarOffsetPct = 100;
    }
    return result;
  }

  public async close(): Promise<void> {
    await this.page.close();
  }

  public getTickState(): {
    currentPlaybarOffsetPct: number;
    currentTickIndex: number;
    ticks: number[];
  } {
    return {
      currentPlaybarOffsetPct: this.currentPlaybarOffsetPct,
      currentTickIndex: this.currentTickIndex,
      ticks: this.ticks.filter(x => x.isMajor).map(x => x.playbarOffsetPercent),
    };
  }

  public async setPlaybarOffset(playbarOffset: number, isReset = false): Promise<void> {
    const ticks = this.ticks;
    if (isReset) {
      this.currentPlaybarOffsetPct = 0;
      this.currentTickIndex = -1;
      this.paintEventsLoadedIdx = -1;
    }
    if (!ticks.length || this.currentPlaybarOffsetPct === playbarOffset) return;

    let newTickIdx = this.currentTickIndex;
    // if going forward, load next ticks
    if (playbarOffset > this.currentPlaybarOffsetPct) {
      for (let i = this.currentTickIndex; i < ticks.length; i += 1) {
        if (i < 0) continue;
        if (ticks[i].playbarOffsetPercent > playbarOffset) break;
        newTickIdx = i;
      }
    } else {
      for (let i = this.currentTickIndex - 1; i >= 0; i -= 1) {
        if (ticks[i].playbarOffsetPercent < playbarOffset) break;
        newTickIdx = i;
      }
    }

    await this.loadTick(newTickIdx, playbarOffset);
  }

  public async loadTick(newTickIdx: number, specificPlaybarOffset?: number): Promise<void> {
    if (newTickIdx === this.currentTickIndex) {
      return;
    }
    const newTick = this.ticks[newTickIdx];

    // need to wait for load
    if (!newTick) {
      return;
    }

    const playbarOffset = specificPlaybarOffset ?? newTick.playbarOffsetPercent;
    this.currentTickIndex = newTickIdx;
    this.currentPlaybarOffsetPct = playbarOffset;

    const paintEvents = this.getPaintEventsForNewTick(newTick);
    const mouseEvent = this.tabDetails.mouse[newTick.mouseEventIndex];
    const scrollEvent = this.tabDetails.scroll[newTick.scrollEventIndex];
    const nodesToHighlight = newTick.highlightNodeIds;

    this.currentUrl = newTick.documentUrl;
    this.paintEventsLoadedIdx = newTick.paintEventIndex;

    await this.loadDomState(paintEvents, nodesToHighlight, mouseEvent, scrollEvent);
  }

  public loadDetachedState(
    paintEvents: IPaintEvent[],
    timestamp: number,
    commandId: number,
    startUrl: string,
  ): void {
    const flatEvent = <IPaintEvent>{ changeEvents: [], commandId, timestamp };
    for (const paintEvent of paintEvents) {
      flatEvent.changeEvents.push(...paintEvent.changeEvents);
    }
    this.tabDetails.paintEvents.push(flatEvent);
    const tick = <ITick>{
      eventTypeIndex: 0,
      eventType: 'paint',
      commandId,
      timestamp,
      isNewDocumentTick: true,
      documentUrl: startUrl,
    };
    this.ticks.unshift(tick);
  }

  private getPaintEventsForNewTick(newTick: ITick): IPaintEvent['changeEvents'] {
    if (
      newTick.paintEventIndex === this.paintEventsLoadedIdx ||
      newTick.paintEventIndex === undefined
    ) {
      return;
    }

    const isBackwards = newTick.paintEventIndex < this.paintEventsLoadedIdx;

    let startIndex = this.paintEventsLoadedIdx + 1;
    if (isBackwards) {
      startIndex = newTick.documentLoadPaintIndex;
    }

    const changeEvents: IPaintEvent['changeEvents'] = [];
    if ((newTick.paintEventIndex === -1 && isBackwards) || newTick.eventType === 'init') {
      startIndex = -1;
      changeEvents.push({
        action: DomActionType.newDocument,
        textContent: this.firstDocumentUrl,
        commandId: newTick.commandId,
      } as any);
    } else {
      for (let i = startIndex; i <= newTick.paintEventIndex; i += 1) {
        const paints = this.tabDetails.paintEvents[i];
        const first = paints.changeEvents[0];
        // find last newDocument change
        if (first.frameId === this.mainFrameId && first.action === DomActionType.newDocument) {
          changeEvents.length = 0;
        }
        changeEvents.push(...paints.changeEvents);
      }
    }

    if (this.sessionReplay.debugLogging) {
      // eslint-disable-next-line no-console
      console.log(
        'Paint load. Current Idx=%s, Loading [%s->%s] (paints: %s, back? %s)',
        this.paintEventsLoadedIdx,
        startIndex,
        newTick.paintEventIndex,
        changeEvents.length,
        isBackwards,
      );
    }
    return changeEvents;
  }

  private async loadDomState(
    domChanges: IPaintEvent['changeEvents'],
    highlightedNodes?: { frameId: number; nodeIds: number[] },
    mouse?: IMouseEventRecord,
    scroll?: IScrollRecord,
  ): Promise<void> {
    if (domChanges?.length) {
      const { action, frameId } = domChanges[0];
      const hasNewUrlToLoad = action === DomActionType.newDocument && frameId === this.mainFrameId;
      if (hasNewUrlToLoad) {
        const nav = domChanges.shift();
        await this.goto(nav.textContent);
      }
      await InjectedScripts.restoreDom(
        this.page,
        domChanges.map(this.applyFrameNodePath.bind(this)),
      );
    }

    if (highlightedNodes || mouse || scroll) {
      await InjectedScripts.replayInteractions(
        this.page,
        this.applyFrameNodePath(highlightedNodes),
        this.applyFrameNodePath(mouse),
        this.applyFrameNodePath(scroll),
      );
    }
  }

  private applyFrameNodePath<T extends { frameId: number }>(item: T): T & { frameIdPath: string } {
    if (!item) return undefined;
    const result = item as T & { frameIdPath: string };
    result.frameIdPath = this.domNodePathByFrameId.get(item.frameId);
    return result;
  }

  private async goto(url: string): Promise<void> {
    const page = this.page;
    const loader = await page.navigate(url);

    await Promise.all([
      page.mainFrame.waitForLoader(loader.loaderId),
      page.mainFrame.waitForLoad('DOMContentLoaded'),
    ]);
  }
}
