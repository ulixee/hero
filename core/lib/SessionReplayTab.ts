import { DomActionType } from '@ulixee/hero-interfaces/IDomChangeEvent';
import { IPuppetPage } from '@ulixee/hero-interfaces/IPuppetPage';
import Log from '@ulixee/commons/lib/Logger';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import ICommandWithResult from '../interfaces/ICommandWithResult';
import { IPaintEvent, ITabDetails, ITick } from '../apis/Session.ticks';
import InjectedScripts from './InjectedScripts';

const { log } = Log(module);

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

  public get isOpen(): boolean {
    return !!this.page && !!this.pageId;
  }

  public readonly commandsById = new Map<number, ICommandWithResult>();

  public currentPlaybarOffsetPct = 0;
  public isPlaying = false;
  public currentTickIndex = -1;

  private pageId: string;
  private page: Promise<IPuppetPage>;
  // put in placeholder
  private paintEventsLoadedIdx = -1;
  private domNodePathByFrameId: { [frameId: number]: string } = {};

  constructor(
    private readonly tabDetails: ITabDetails,
    private readonly pageCreator: () => Promise<IPuppetPage>,
    private readonly sessionId: string,
    private readonly debugLogging: boolean = false,
  ) {
    for (const command of tabDetails.commands) {
      this.commandsById.set(command.id, command);
    }
    for (const frame of this.tabDetails.tab.frames) {
      if (frame.isMainFrame) this.mainFrameId = frame.id;
      this.domNodePathByFrameId[frame.id] = frame.domNodePath;
    }
  }

  public async open(): Promise<void> {
    if (!this.page) {
      this.page = this.pageCreator();
      const page = await this.page;
      page.on('close', () => {
        this.page = null;
        this.pageId = null;
      });
      this.pageId = page.id;
    }
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
    await this.page?.then(x => x.close());
  }

  public async setPlaybarOffset(playbarOffset: number): Promise<void> {
    const ticks = this.ticks;
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

  public async loadEndState(): Promise<void> {
    await this.loadTick(this.ticks.length - 1);
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

    this.currentTickIndex = newTickIdx;
    this.currentPlaybarOffsetPct = specificPlaybarOffset ?? newTick.playbarOffsetPercent;

    const newPaintIndex = newTick.paintEventIndex;
    if (newPaintIndex !== undefined && newPaintIndex !== this.paintEventsLoadedIdx) {
      const isBackwards = newPaintIndex < this.paintEventsLoadedIdx;

      let startIndex = newTick.documentLoadPaintIndex;
      if ((isBackwards && newPaintIndex === -1) || newTick.eventType === 'init') {
        await this.goto(this.firstDocumentUrl);
        return;
      }

      // if going forward and past document load, start at currently loaded index
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
      try {
        await InjectedScripts.setPaintIndexRange(page, startIndex, paintIndexRange[1]);
      } catch (err) {
        // -32000 means ContextNotFound. ie, page has navigated
        if (err.code === -32000) throw new CanceledPromiseError('Context not found');

        throw err;
      }
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
