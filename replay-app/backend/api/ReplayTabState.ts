import { EventEmitter } from 'events';
import ICommandWithResult from '~shared/interfaces/ICommandResult';
import {
  IFocusRecord,
  IMouseEvent,
  IScrollRecord,
  ISessionTab,
} from '~shared/interfaces/ISaSession';
import ReplayTick, { IEventType } from '~backend/api/ReplayTick';
import IPaintEvent from '~shared/interfaces/IPaintEvent';
import { IDomChangeEvent } from '~shared/interfaces/IDomChangeEvent';
import ITickState from '~shared/interfaces/ITickState';
import ReplayTime from '~backend/api/ReplayTime';
import getResolvable from '~shared/utils/promise';

const loadWaitTime = 5e3;
let pageCounter = 0;

export default class ReplayTabState extends EventEmitter {
  public ticks: ReplayTick[] = [];
  public readonly commands: ICommandWithResult[] = [];
  public readonly pages: { id: number; url: string; commandId: number }[] = [];
  public readonly mouseEvents: IMouseEvent[] = [];
  public readonly scrollEvents: IScrollRecord[] = [];
  public readonly focusEvents: IFocusRecord[] = [];
  public readonly paintEvents: IPaintEvent[] = [];

  public tabId: string;
  public startOrigin: string;
  public urlOrigin: string;
  public currentPlaybarOffsetPct = 0;
  public replayTime: ReplayTime;
  public tabCreatedTime: string;

  public get isActive() {
    return this.listenerCount('tick:changes') > 0;
  }

  public get currentTick() {
    return this.ticks[this.currentTickIdx];
  }

  public isReady = getResolvable<void>();

  private currentTickIdx = -1;
  // put in placeholder
  private paintEventsLoadedIdx = -1;
  private broadcastTimer: NodeJS.Timer;
  private lastBroadcast?: Date;

  constructor(tabMeta: ISessionTab, replayTime: ReplayTime) {
    super();
    this.replayTime = replayTime;
    this.tabCreatedTime = tabMeta.createdTime;
    this.startOrigin = tabMeta.startOrigin;
    if (this.startOrigin) this.isReady.resolve();
    this.tabId = tabMeta.tabId;
    this.ticks.push(new ReplayTick(this, 'load', 0, -1, replayTime.start.toISOString(), 'Load'));
  }

  public getTickState() {
    return {
      currentTickOffset: this.currentPlaybarOffsetPct,
      durationMillis: this.replayTime.millis,
      ticks: this.ticks.filter(x => x.isMajor()).map(x => x.playbarOffsetPercent),
    } as ITickState;
  }

  public getPageOffset(page: { id: number; url: string }) {
    const pageToLoad = this.pages.find(x => x.id === page.id);
    return this.ticks.find(x => x.commandId === pageToLoad.commandId)?.playbarOffsetPercent ?? 0;
  }

  public gotoNextTick() {
    const result = this.loadTick(this.currentTickIdx + 1);
    if (
      this.replayTime.close &&
      // give it a few seconds to get the rest of the data.
      // TODO: figure out how to confirm via http2 that all data is sent
      new Date().getTime() - this.replayTime.close.getTime() > loadWaitTime &&
      this.currentTickIdx === this.ticks.length - 1
    ) {
      this.currentPlaybarOffsetPct = 100;
    }
    return result;
  }

  public setTickValue(playbarOffset: number, isReset = false) {
    const ticks = this.ticks;
    if (isReset) {
      this.currentPlaybarOffsetPct = 0;
      this.currentTickIdx = -1;
      this.paintEventsLoadedIdx = -1;
    }
    if (!ticks.length || this.currentPlaybarOffsetPct === playbarOffset) return;

    let newTickIdx = this.currentTickIdx;
    // if going forward, load next ticks
    if (playbarOffset > this.currentPlaybarOffsetPct) {
      for (let i = this.currentTickIdx; i < ticks.length; i += 1) {
        if (i < 0) continue;
        if (ticks[i].playbarOffsetPercent > playbarOffset) break;
        newTickIdx = i;
      }
    } else {
      for (let i = this.currentTickIdx - 1; i >= 0; i -= 1) {
        if (ticks[i].playbarOffsetPercent < playbarOffset) break;
        newTickIdx = i;
      }
    }

    return this.loadTick(newTickIdx, playbarOffset);
  }

  public setPaintIndex(newTick: ReplayTick) {
    if (newTick.paintEventIdx === this.paintEventsLoadedIdx || newTick.paintEventIdx === null) {
      return;
    }

    const isBackwards = newTick.paintEventIdx < this.paintEventsLoadedIdx;

    let startIndex = this.paintEventsLoadedIdx + 1;
    if (isBackwards) {
      startIndex = newTick.documentLoadPaintIndex;
    }

    const changeEvents: IDomChangeEvent[] = [];
    if (newTick.eventType === 'load') {
      startIndex = -1;
      changeEvents.push({
        action: 'newDocument',
        textContent: this.startOrigin,
        commandId: newTick.commandId,
      } as any);
    } else {
      for (let i = startIndex; i <= newTick.paintEventIdx; i += 1) {
        const paints = this.paintEvents[i];
        if (!paints) {
          console.log('Paint event not loaded!', i);
          return;
        }
        if (paints.changeEvents[0].action === 'newDocument') {
          changeEvents.length = 0;
        }
        changeEvents.push(...paints.changeEvents);
      }
    }

    console.log(
      'Paint load. Current=%s. New: %s->%s (%s, back? %s)',
      this.paintEventsLoadedIdx,
      startIndex,
      newTick.paintEventIdx,
      changeEvents.length,
      isBackwards,
    );

    this.urlOrigin = newTick.documentOrigin;
    this.paintEventsLoadedIdx = newTick.paintEventIdx;
    return changeEvents;
  }

  public loadTick(
    newTickIdx: number,
    specificPlaybarOffset?: number,
  ): [IDomChangeEvent[], number[], IMouseEvent, IScrollRecord] {
    if (newTickIdx === this.currentTickIdx) return;
    const newTick = this.ticks[newTickIdx];

    // need to wait for load
    if (!newTick) return;
    if (!this.replayTime.close) {
      // give ticks time to load. TODO: need a better strategy for this
      if (new Date().getTime() - new Date(newTick.timestamp).getTime() < loadWaitTime) return;
    }

    console.log('Loading tick %s', newTickIdx);

    const playbarOffset = specificPlaybarOffset ?? newTick.playbarOffsetPercent;
    this.currentTickIdx = newTickIdx;
    this.currentPlaybarOffsetPct = playbarOffset;

    const paintEvents = this.setPaintIndex(newTick);
    const mouseEvent = this.mouseEvents[newTick.mouseEventIdx];
    const scrollEvent = this.scrollEvents[newTick.scrollEventIdx];
    const nodesToHighlight = newTick.highlightNodeIds;

    return [paintEvents, nodesToHighlight, mouseEvent, scrollEvent];
  }

  public loadCommand(command: ICommandWithResult) {
    const existing = this.commands.find(x => x.id === command.id);
    if (existing) {
      Object.assign(existing, command);
    } else {
      const idx = this.commands.length;
      this.commands.push(command);
      const tick = new ReplayTick(
        this,
        'command',
        idx,
        command.id,
        command.startDate,
        command.label,
      );
      this.ticks.push(tick);
    }
  }

  public loadPageEvent(eventType: IEventType, event: IDomEvent) {
    let array: IDomEvent[];
    if (eventType === 'mouse') array = this.mouseEvents;
    if (eventType === 'focus') array = this.focusEvents;
    if (eventType === 'scroll') array = this.scrollEvents;

    const idx = array.length;
    array.push(event);
    const tick = new ReplayTick(this, eventType, idx, event.commandId, event.timestamp);
    this.ticks.push(tick);
  }

  public loadDomChange(event: IDomChangeEvent) {
    const { commandId, action, textContent, timestamp } = event;
    if (event.action === 'newDocument' && !this.startOrigin) {
      this.startOrigin = event.textContent;
      console.log('Got start origin for new tab', this.startOrigin);
      this.isReady.resolve();
    }

    const lastPaintEvent = this.paintEvents.length
      ? this.paintEvents[this.paintEvents.length - 1]
      : null;

    let paintEvent: IPaintEvent;
    if (lastPaintEvent?.timestamp === timestamp) {
      paintEvent = lastPaintEvent;
    } else {
      paintEvent = this.paintEvents.find(x => x.timestamp === timestamp);
    }

    if (paintEvent) {
      // reset paint load if we backfilled
      if (paintEvent !== lastPaintEvent) {
        console.log('Adding to a previous paint bucket (events out of order)');
        this.paintEventsLoadedIdx = -1;
      }
      paintEvent.changeEvents.push(event);
    } else {
      paintEvent = {
        changeEvents: [event],
        timestamp,
        commandId,
      };

      const index = this.paintEvents.length;
      const tick = new ReplayTick(this, 'paint', index, commandId, timestamp);

      if (action === 'newDocument') {
        tick.isNewDocumentTick = true;
        tick.documentOrigin = textContent;
        this.pages.push({
          id: pageCounter += 1,
          url: textContent,
          commandId,
        });
      }

      this.paintEvents.push(paintEvent);
      if (lastPaintEvent && lastPaintEvent.timestamp >= timestamp) {
        console.log('Need to resort paint events - received out of order');
        this.paintEventsLoadedIdx = -1;
      }

      this.ticks.push(tick);
    }
  }

  public sortTicks() {
    for (const tick of this.ticks) {
      tick.updateDuration(this.replayTime);
    }
    this.ticks.sort((a, b) => {
      return a.playbarOffsetPercent - b.playbarOffsetPercent;
    });

    let prev: ReplayTick;
    for (const tick of this.ticks) {
      if (prev && prev.playbarOffsetPercent >= tick.playbarOffsetPercent) {
        tick.playbarOffsetPercent += 0.01;
      }
      prev = tick;
    }

    let lastPaintEventIdx: number = null;
    let lastScrollEventIdx: number = null;
    let lastFocusEventIdx: number = null;
    let lastMouseEventIdx: number = null;
    let lastSelectedNodeIds: number[] = null;
    let documentLoadPaintIndex: number = null;
    let documentOrigin = this.startOrigin;
    for (const tick of this.ticks) {
      // if new doc, reset the markers
      if (tick.isNewDocumentTick) {
        lastFocusEventIdx = null;
        lastScrollEventIdx = null;
        lastPaintEventIdx = tick.eventTypeIdx;
        documentLoadPaintIndex = tick.eventTypeIdx;
        documentOrigin = tick.documentOrigin;
        lastMouseEventIdx = null;
        lastSelectedNodeIds = null;
      }
      switch (tick.eventType) {
        case 'command':
          const command = this.commands.find(x => x.id === tick.commandId);
          if (command.resultNodeIds) {
            lastSelectedNodeIds = command.resultNodeIds;
          }
          if (lastFocusEventIdx !== null) {
            const focusEvent = this.focusEvents[lastFocusEventIdx];
            if (focusEvent.event === 0 && !lastSelectedNodeIds) {
              lastSelectedNodeIds = [focusEvent.targetNodeId];
            }
          }
          break;
        case 'focus':
          lastFocusEventIdx = tick.eventTypeIdx;
          break;
        case 'paint':
          lastPaintEventIdx = tick.eventTypeIdx;
          break;
        case 'scroll':
          lastScrollEventIdx = tick.eventTypeIdx;
          break;
        case 'mouse':
          lastMouseEventIdx = tick.eventTypeIdx;
          break;
      }

      tick.focusEventIdx = lastFocusEventIdx;
      tick.scrollEventIdx = lastScrollEventIdx;
      tick.mouseEventIdx = lastMouseEventIdx;
      tick.paintEventIdx = lastPaintEventIdx;
      tick.documentLoadPaintIndex = documentLoadPaintIndex;
      tick.documentOrigin = documentOrigin;
      tick.highlightNodeIds = lastSelectedNodeIds;

      if (tick.eventType === 'load') {
        tick.documentLoadPaintIndex = -1;
        tick.documentOrigin = this.startOrigin;
        tick.paintEventIdx = -1;
      }
    }
  }

  public checkBroadcast() {
    clearTimeout(this.broadcastTimer);

    const shouldBroadcast =
      !this.lastBroadcast || new Date().getTime() - this.lastBroadcast.getTime() > 500;

    // if we haven't updated in 500ms, do so now
    if (shouldBroadcast) {
      setImmediate(this.broadcast.bind(this));
      return;
    }

    this.broadcastTimer = setTimeout(this.broadcast.bind(this), 50);
  }

  private broadcast() {
    this.lastBroadcast = new Date();
    this.emit('tick:changes');
  }
}

interface IDomEvent {
  commandId: number;
  timestamp: string;
}
