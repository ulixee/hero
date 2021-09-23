import { DomActionType } from '@ulixee/hero-interfaces/IDomChangeEvent';
import { IPuppetPage } from '@ulixee/hero-interfaces/IPuppetPage';
import Log from '@ulixee/commons/lib/Logger';
import { IPaintEvent, ITabDetails, ITick } from '../apis/Session.ticks';
import InjectedScripts from './InjectedScripts';

const { log } = Log(module);

export default class SessionReplayTab {
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

  public get isOpen(): boolean {
    return !!this.page && !!this.pageId;
  }

  public currentTimelineOffsetPct = 0;
  public isPlaying = false;
  public currentTickIndex = -1;

  private pageId: string;
  private page: Promise<IPuppetPage>;
  // put in placeholder
  private paintEventsLoadedIdx = -1;
  private readonly mainFrameId: number;
  private readonly domNodePathByFrameId: { [frameId: number]: string } = {};

  constructor(
    private readonly tabDetails: ITabDetails,
    private readonly pageCreator: () => Promise<IPuppetPage>,
    private readonly sessionId: string,
    private readonly debugLogging: boolean = false,
  ) {
    for (const frame of this.tabDetails.tab.frames) {
      if (frame.isMainFrame) this.mainFrameId = frame.id;
      this.domNodePathByFrameId[frame.id] = frame.domNodePath;
    }
  }

  public async open(): Promise<void> {
    if (this.page) {
      await this.page;
      return;
    }
    this.page = this.pageCreator();
    const page = await this.page;
    page.on('close', () => {
      this.page = null;
      this.pageId = null;
      this.paintEventsLoadedIdx = -1;
      this.isPlaying = false;
      this.currentTickIndex = -1;
      this.currentTimelineOffsetPct = 0;
    });
    this.pageId = page.id;
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
    const pagePromise = this.page;
    this.page = null;
    if (pagePromise) {
      const page = await pagePromise;
      // go ahead and say this is closed
      page.emit('close');
      await page?.close();
    }
  }

  public async setTimelineOffset(timelineOffset: number): Promise<void> {
    const ticks = this.ticks;
    if (!ticks.length || this.currentTimelineOffsetPct === timelineOffset) return;

    let newTickIdx = this.currentTickIndex;
    // if going forward, load next ticks
    if (timelineOffset > this.currentTimelineOffsetPct) {
      for (let i = this.currentTickIndex; i < ticks.length; i += 1) {
        if (i < 0) continue;
        if (ticks[i].timelineOffsetPercent > timelineOffset) break;
        newTickIdx = i;
      }
    } else {
      for (let i = this.currentTickIndex - 1; i >= 0; i -= 1) {
        if (ticks[i].timelineOffsetPercent < timelineOffset) break;
        newTickIdx = i;
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
    if (newPaintIndex === -1 && newTick.documentUrl) {
      this.paintEventsLoadedIdx = newPaintIndex;
      await this.goto(newTick.documentUrl);
    } else if (newPaintIndex !== this.paintEventsLoadedIdx) {
      const isBackwards = newPaintIndex < this.paintEventsLoadedIdx;

      let startIndex = newTick.documentLoadPaintIndex;
      // is document loaded and moving forward? yes - no need to reload old ticks
      if (!isBackwards && this.paintEventsLoadedIdx > newTick.documentLoadPaintIndex) {
        startIndex = this.paintEventsLoadedIdx + 1;
      }

      this.paintEventsLoadedIdx = newPaintIndex;
      await this.loadPaintEvents([startIndex, newPaintIndex]);
    }

    const mouseEvent = this.tabDetails.mouse[newTick.mouseEventIndex];
    const scrollEvent = this.tabDetails.scroll[newTick.scrollEventIndex];
    const nodesToHighlight = newTick.highlightNodeIds;

    if (nodesToHighlight || mouseEvent || scrollEvent) {
      await InjectedScripts.replayInteractions(
        await this.page,
        this.applyFrameNodePath(nodesToHighlight),
        this.applyFrameNodePath(mouseEvent),
        this.applyFrameNodePath(scrollEvent),
      );
    }
  }

  public async showStatusText(text: string): Promise<void> {
    await InjectedScripts.showStatusText(await this.page, text);
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

  private async loadPaintEvents(paintIndexRange: [number, number]): Promise<void> {
    const page = await this.page;
    const startIndex = paintIndexRange[0];
    let loadUrl: string = null;
    const { action, frameId, textContent } =
      this.tabDetails.paintEvents[startIndex].changeEvents[0] ?? {};

    if (action === DomActionType.newDocument && frameId === this.mainFrameId) {
      loadUrl = textContent;
    }

    if (loadUrl && loadUrl !== page.mainFrame.url) {
      await this.goto(loadUrl);
    }
    if (startIndex >= 0) {
      if (this.debugLogging) {
        log.info('Replay.loadPaintEvents', {
          sessionId: this.sessionId,
          paintIndexRange,
        });
      }
      await InjectedScripts.setPaintIndexRange(page, startIndex, paintIndexRange[1], !!loadUrl);
    }
  }

  private applyFrameNodePath<T extends { frameId: number }>(item: T): T & { frameIdPath: string } {
    if (!item) return undefined;
    const result = item as T & { frameIdPath: string };
    result.frameIdPath = this.domNodePathByFrameId[item.frameId];
    return result;
  }

  private async goto(url: string): Promise<void> {
    if (this.debugLogging) {
      log.info('Replay.goto', {
        sessionId: this.sessionId,
        url,
      });
    }

    const page = await this.page;
    const loader = await page.navigate(url);

    await Promise.all([
      page.mainFrame.waitForLoader(loader.loaderId),
      page.mainFrame.waitForLoad('DOMContentLoaded'),
    ]);
    await InjectedScripts.injectPaintEvents(
      page,
      this.tabDetails.paintEvents,
      this.domNodePathByFrameId,
    );
  }
}
