import IPuppetContext from '@ulixee/hero-interfaces/IPuppetContext';
import { ITabDetails, ITick } from '@ulixee/hero-core/apis/Session.ticks';
import { IDomRecording } from '@ulixee/hero-core/models/DomChangesTable';
import { IPuppetPage } from '@ulixee/hero-interfaces/IPuppetPage';
import MirrorPage from '../lib/MirrorPage';
import MirrorNetwork from '../lib/MirrorNetwork';

export default class TabPlaybackController {
  public get id(): number {
    return this.tabDetails.tab.id;
  }

  public get ticks(): ITick[] {
    return this.tabDetails.ticks;
  }

  public get currentTick(): ITick {
    return this.ticks[this.currentTickIndex];
  }

  public get nextTick(): ITick {
    return this.ticks[this.currentTickIndex + 1];
  }

  public get previousTick(): ITick {
    return this.ticks[this.currentTickIndex - 1];
  }

  public get nextTimelineOffsetPercent(): number {
    const currentOffset = this.currentTick?.timelineOffsetPercent || 0;
    let tick: ITick;
    for (let i = this.currentTickIndex; i < this.ticks.length; i += 1) {
      tick = this.ticks[i];
      if (tick && tick.timelineOffsetPercent > currentOffset) {
        return tick.timelineOffsetPercent;
      }
    }
    return 100;
  }

  public get previousTimelineOffsetPercent(): number {
    const currentOffset = this.currentTick?.timelineOffsetPercent || 0;
    let tick: ITick;
    for (let i = this.currentTickIndex; i >= 0; i -= 1) {
      tick = this.ticks[i];
      if (tick && tick.timelineOffsetPercent < currentOffset) {
        return tick.timelineOffsetPercent;
      }
    }
    return 0;
  }

  public get isOpen(): boolean {
    return !!this.mirrorPage?.puppetPageId;
  }

  public currentTimelineOffsetPct = 0;
  public isPlaying = false;
  public currentTickIndex = -1;
  public readonly mirrorPage: MirrorPage;

  // put in placeholder
  private paintEventsLoadedIdx = -1;

  constructor(
    private readonly tabDetails: ITabDetails,
    private readonly mirrorNetwork: MirrorNetwork,
    private readonly sessionId: string,
    debugLogging = false,
  ) {
    const domRecording = TabPlaybackController.tabDetailsToDomRecording(tabDetails);
    this.mirrorPage = new MirrorPage(this.mirrorNetwork, domRecording, true, debugLogging);
    this.mirrorPage.once('close', () => {
      this.paintEventsLoadedIdx = -1;
      this.isPlaying = false;
      this.currentTickIndex = -1;
      this.currentTimelineOffsetPct = 0;
    });
  }

  public updateTabDetails(tabDetails: ITabDetails): Promise<void> {
    Object.assign(this.tabDetails, tabDetails);
    if (this.currentTickIndex >= 0) {
      this.currentTimelineOffsetPct =
        this.tabDetails.ticks[this.currentTickIndex]?.timelineOffsetPercent;
    }
    const domRecording = TabPlaybackController.tabDetailsToDomRecording(tabDetails);
    return this.mirrorPage.replaceDomRecording(domRecording);
  }

  public isPage(id: string): boolean {
    return this.mirrorPage?.puppetPageId === id;
  }

  public async open(
    browserContext: IPuppetContext,
    onPage?: (page: IPuppetPage) => Promise<void>,
  ): Promise<void> {
    await this.mirrorPage.open(browserContext, this.sessionId, null, onPage);
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

  public async close(): Promise<void> {
    // go ahead and say this is closed
    this.mirrorPage.emit('close');
    await this.mirrorPage.close();
  }

  public async setTimelineOffset(timelineOffset: number): Promise<void> {
    const ticks = this.ticks;
    if (!ticks.length || this.currentTimelineOffsetPct === timelineOffset) return;

    let newTickIdx = this.currentTickIndex;
    // if going forward, load next ticks
    if (timelineOffset > this.currentTimelineOffsetPct) {
      for (let i = newTickIdx; i < ticks.length; i += 1) {
        if (i < 0) continue;
        if (ticks[i].timelineOffsetPercent > timelineOffset) break;
        newTickIdx = i;
      }
    } else {
      for (let i = newTickIdx; i >= 0; i -= 1) {
        newTickIdx = i;
        if (ticks[i].timelineOffsetPercent <= timelineOffset) break;
      }
    }

    await this.loadTick(newTickIdx, timelineOffset);
  }

  public async loadEndState(): Promise<void> {
    await this.loadTick(this.ticks.length - 1);
  }

  public async loadTick(
    newTickOrIdx: number | ITick,
    specificTimelineOffset?: number,
  ): Promise<void> {
    if (newTickOrIdx === this.currentTickIndex || newTickOrIdx === this.currentTick) {
      return;
    }
    const mirrorPage = this.mirrorPage;

    let newTick = newTickOrIdx as ITick;
    let newTickIdx = newTickOrIdx as number;
    if (typeof newTickOrIdx === 'number') {
      newTick = this.ticks[newTickOrIdx];
    } else {
      newTickIdx = this.ticks.indexOf(newTickOrIdx);
    }

    this.currentTickIndex = newTickIdx;
    this.currentTimelineOffsetPct = specificTimelineOffset ?? newTick.timelineOffsetPercent;

    const newPaintIndex = newTick.paintEventIndex;
    if (newPaintIndex !== this.paintEventsLoadedIdx) {
      this.paintEventsLoadedIdx = newPaintIndex;
      await mirrorPage.load(newPaintIndex);
    }

    const mouseEvent = this.tabDetails.mouse[newTick.mouseEventIndex];
    const scrollEvent = this.tabDetails.scroll[newTick.scrollEventIndex];
    const nodesToHighlight = newTick.highlightNodeIds;

    if (nodesToHighlight || mouseEvent || scrollEvent) {
      await mirrorPage.showInteractions(nodesToHighlight, mouseEvent, scrollEvent);
    }
  }

  public async showStatusText(text: string): Promise<void> {
    await this.mirrorPage.showStatusText(text);
  }

  private static tabDetailsToDomRecording(tabDetails: ITabDetails): IDomRecording {
    const mainFrameIds = new Set<number>();
    const domNodePathByFrameId: { [frameId: number]: string } = {};
    for (const frame of tabDetails.tab.frames) {
      if (frame.isMainFrame) mainFrameIds.add(frame.id);
      domNodePathByFrameId[frame.id] = frame.domNodePath;
    }
    return <IDomRecording>{
      paintEvents: tabDetails.paintEvents,
      documents: tabDetails.documents,
      domNodePathByFrameId,
      mainFrameIds,
    };
  }
}
