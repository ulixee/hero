import { EventEmitter } from 'events';
import ICommandWithResult from '~shared/interfaces/ICommandResult';
import {
  IFocusRecord,
  IFrontendMouseEvent,
  IMouseEvent,
  IScrollRecord,
  ISessionTab,
} from '~shared/interfaces/ISaSession';
import ReplayTick, { IEventType } from '~backend/api/ReplayTick';
import IPaintEvent from '~shared/interfaces/IPaintEvent';
import {
  DomActionType,
  IDomChangeEvent,
  IFrontendDomChangeEvent,
} from '~shared/interfaces/IDomChangeEvent';
import ITickState from '~shared/interfaces/ITickState';
import ReplayTime from '~backend/api/ReplayTime';
import getResolvable from '~shared/utils/promise';

export default class ReplayTabState extends EventEmitter {
  public ticks: ReplayTick[] = [];
  public readonly commandsById = new Map<number, ICommandWithResult>();

  public tabId: number;
  public detachedFromTabId: number;
  public startOrigin: string;
  public urlOrigin: string;
  public viewportWidth: number;
  public viewportHeight: number;
  public currentPlaybarOffsetPct = 0;
  public replayTime: ReplayTime;
  public tabCreatedTime: number;
  public hasAllData = false;

  public get isActive() {
    return this.listenerCount('tick:changes') > 0;
  }

  public get currentTick() {
    return this.ticks[this.currentTickIdx];
  }

  public get nextTick() {
    return this.ticks[this.currentTickIdx + 1];
  }

  public isReady = getResolvable<void>();

  private readonly mouseEventsByTick: Record<number, IMouseEvent> = {};
  private readonly scrollEventsByTick: Record<number, IScrollRecord> = {};
  private readonly focusEventsByTick: Record<number, IFocusRecord> = {};
  private readonly paintEvents: IPaintEvent[] = [];

  private currentTickIdx = -1;
  // put in placeholder
  private paintEventsLoadedIdx = -1;
  private broadcastTimer: NodeJS.Timer;
  private lastBroadcast?: Date;
  private eventRouter = {
    'dom-changes': this.loadDomChange.bind(this),
    'mouse-events': this.loadPageEvent.bind(this, 'mouse'),
    'focus-events': this.loadPageEvent.bind(this, 'focus'),
    'scroll-events': this.loadPageEvent.bind(this, 'scroll'),
    commands: this.loadCommand.bind(this),
  };

  constructor(tabMeta: ISessionTab, replayTime: ReplayTime) {
    super();
    this.replayTime = replayTime;
    this.tabCreatedTime = tabMeta.createdTime;
    this.startOrigin = tabMeta.startOrigin;
    this.viewportHeight = tabMeta.height;
    this.viewportWidth = tabMeta.width;
    this.detachedFromTabId = tabMeta.detachedFromTabId;
    if (this.startOrigin) this.isReady.resolve();
    this.tabId = tabMeta.tabId;
    this.ticks.push(new ReplayTick(this, 'init', 0, -1, replayTime.start.getTime(), 'Load'));
  }

  public onApiFeed(eventName: string, event: any) {
    const method = this.eventRouter[eventName];
    if (method) method(event);
  }

  public getTickState() {
    return {
      currentTickOffset: this.currentPlaybarOffsetPct,
      durationMillis: this.replayTime.millis,
      ticks: this.ticks.filter(x => x.isMajor()).map(x => x.playbarOffsetPercent),
    } as ITickState;
  }

  public transitionToPreviousTick() {
    const prevTickIdx = this.currentTickIdx > 0 ? this.currentTickIdx - 1 : this.currentTickIdx;
    return this.loadTick(prevTickIdx);
  }

  public transitionToNextTick() {
    const result = this.loadTick(this.currentTickIdx + 1);
    if (this.replayTime.close && this.hasAllData && this.currentTickIdx === this.ticks.length - 1) {
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

    const changeEvents: IFrontendDomChangeEvent[] = [];
    if (newTick.eventType === 'init' || (newTick.paintEventIdx === -1 && isBackwards)) {
      startIndex = -1;
      changeEvents.push({
        action: DomActionType.newDocument,
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
        if (
          paints.changeEvents[0].frameIdPath === 'main' &&
          paints.changeEvents[0].action === DomActionType.newDocument
        ) {
          changeEvents.length = 0;
        }
        changeEvents.push(...paints.changeEvents);
      }
    }

    console.log(
      'Paint load. Current Idx=%s, Loading [%s->%s] (paints: %s, back? %s)',
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

  public copyPaintEvents(
    timestampRange: [number, number],
    eventIndexRange: [number, number],
  ): IPaintEvent[] {
    const [startTimestamp, endTimestamp] = timestampRange;
    const [startIndex, endIndex] = eventIndexRange;
    const paintEvents: IPaintEvent[] = [];
    for (const paintEvent of this.paintEvents) {
      if (paintEvent.timestamp >= startTimestamp && paintEvent.timestamp <= endTimestamp) {
        paintEvents.push({
          timestamp: paintEvent.timestamp,
          commandId: paintEvent.commandId,
          changeEvents: paintEvent.changeEvents.filter(x => {
            if (x.timestamp === startTimestamp) {
              return x.eventIndex >= startIndex;
            }
            if (x.timestamp === endTimestamp) {
              return x.eventIndex <= endIndex;
            }
            return true;
          }),
        });
      }
    }
    return paintEvents;
  }

  public loadTick(
    newTickIdx: number,
    specificPlaybarOffset?: number,
  ): [
    IFrontendDomChangeEvent[],
    { frameIdPath: string; nodeIds: number[] },
    IFrontendMouseEvent,
    IScrollRecord,
  ] {
    if (newTickIdx === this.currentTickIdx) return;
    const newTick = this.ticks[newTickIdx];

    // need to wait for load
    if (!newTick) return;
    if (!this.replayTime.close) {
      // give ticks time to load. TODO: need a better strategy for this
      if (new Date().getTime() - new Date(newTick.timestamp).getTime() < 2e3) return;
    }

    // console.log('Loading tick %s', newTickIdx);

    const playbarOffset = specificPlaybarOffset ?? newTick.playbarOffsetPercent;
    this.currentTickIdx = newTickIdx;
    this.currentPlaybarOffsetPct = playbarOffset;

    const paintEvents = this.setPaintIndex(newTick);
    const mouseEvent = this.mouseEventsByTick[newTick.mouseEventTick];
    const scrollEvent = this.scrollEventsByTick[newTick.scrollEventTick];
    const nodesToHighlight = newTick.highlightNodeIds;

    let frontendMouseEvent: IFrontendMouseEvent;
    if (mouseEvent) {
      frontendMouseEvent = {
        frameIdPath: mouseEvent.frameIdPath,
        pageX: mouseEvent.pageX,
        pageY: mouseEvent.pageY,
        offsetX: mouseEvent.offsetX,
        offsetY: mouseEvent.offsetY,
        targetNodeId: mouseEvent.targetNodeId,
        buttons: mouseEvent.buttons,
        viewportHeight: this.viewportHeight,
        viewportWidth: this.viewportWidth,
      };
    }

    return [paintEvents, nodesToHighlight, frontendMouseEvent, scrollEvent];
  }

  public loadCommand(command: ICommandWithResult) {
    if (command.result && typeof command.result === 'string' && command.result.startsWith('"{')) {
      try {
        command.result = JSON.parse(command.result);
      } catch (e) {
        // didn't parse, just ignore
      }
    }
    const existing = this.commandsById.get(command.id);
    if (existing) {
      Object.assign(existing, command);
    } else {
      const idx = this.commandsById.size;
      this.commandsById.set(command.id, command);
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
    let events: Record<number, IDomEvent>;
    if (eventType === 'mouse') events = this.mouseEventsByTick;
    if (eventType === 'focus') events = this.focusEventsByTick;
    if (eventType === 'scroll') events = this.scrollEventsByTick;

    events[event.timestamp] = event;
    const tick = new ReplayTick(
      this,
      eventType,
      event.timestamp,
      event.commandId,
      Number(event.timestamp),
    );
    this.ticks.push(tick);
  }

  public loadDetachedState(
    detachedFromTabId: number,
    paintEvents: IPaintEvent[],
    timestamp: number,
    commandId: number,
    origin: string,
  ): void {
    this.detachedFromTabId = detachedFromTabId;
    const flatEvent = <IPaintEvent>{ changeEvents: [], commandId, timestamp };
    for (const paintEvent of paintEvents) {
      flatEvent.changeEvents.push(...paintEvent.changeEvents);
    }
    this.paintEvents.push(flatEvent);
    this.startOrigin = origin;
    const tick = new ReplayTick(this, 'paint', 0, commandId, timestamp);
    tick.isNewDocumentTick = true;
    tick.documentOrigin = origin;
    this.ticks.push(tick);
    this.isReady.resolve();
  }

  public loadDomChange(event: IDomChangeEvent) {
    const { commandId, action, textContent, timestamp } = event;

    // if this is a subframe without a frame, ignore it
    if (!event.frameIdPath) return;

    const isMainFrame = event.frameIdPath === 'main';
    if (isMainFrame && event.action === DomActionType.newDocument && !this.startOrigin) {
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
      for (let i = this.paintEvents.length - 1; i >= 0; i -= 1) {
        const paint = this.paintEvents[i];
        if (!paint) continue;
        if (paint.timestamp === timestamp) {
          paintEvent = paint;
          break;
        }
      }
    }

    if (paintEvent) {
      const events = paintEvent.changeEvents;
      events.push(event);

      // if events are out of order, set the index of paints back to this index
      if (events.length > 1 && events[events.length - 2].eventIndex > event.eventIndex) {
        events.sort((a, b) => {
          if (a.frameIdPath === b.frameIdPath) {
            return a.eventIndex - b.eventIndex;
          }
          return a.frameIdPath.localeCompare(b.frameIdPath);
        });

        const paintIndex = this.paintEvents.indexOf(paintEvent);
        if (paintIndex !== -1 && paintIndex < this.paintEventsLoadedIdx)
          this.paintEventsLoadedIdx = paintIndex - 1;
      }
    } else {
      paintEvent = {
        changeEvents: [event],
        timestamp,
        commandId,
      };

      const index = this.paintEvents.length;
      this.paintEvents.push(paintEvent);

      const tick = new ReplayTick(this, 'paint', index, commandId, timestamp);
      this.ticks.push(tick);
      if (isMainFrame && action === DomActionType.newDocument) {
        tick.isNewDocumentTick = true;
        tick.documentOrigin = textContent;
      }

      if (lastPaintEvent && lastPaintEvent.timestamp >= timestamp) {
        console.log('Need to resort paint events - received out of order');

        this.paintEvents.sort((a, b) => a.timestamp - b.timestamp);

        for (const t of this.ticks) {
          if (t.eventType !== 'paint') continue;
          const newIndex = this.paintEvents.findIndex(x => x.timestamp === t.timestamp);
          if (newIndex >= 0 && t.eventTypeTick !== newIndex) {
            if (this.paintEventsLoadedIdx >= newIndex) this.paintEventsLoadedIdx = newIndex - 1;
            t.eventTypeTick = newIndex;
          }
        }
      }
    }
  }

  public sortTicks() {
    for (const tick of this.ticks) {
      tick.updateDuration(this.replayTime);
    }

    // The ticks can get out of order when they sync from browser -> db -> replay, so need to be resorted

    this.ticks.sort((a, b) => {
      return a.playbarOffsetPercent - b.playbarOffsetPercent;
    });

    let prev: ReplayTick;
    for (const tick of this.ticks) {
      if (prev && prev.playbarOffsetPercent >= tick.playbarOffsetPercent) {
        tick.playbarOffsetPercent = prev.playbarOffsetPercent + 0.01;
      }
      prev = tick;
    }

    let lastPaintEventIdx: number = null;
    let lastScrollEventTick: number = null;
    let lastFocusEventTick: number = null;
    let lastMouseEventTick: number = null;
    let lastSelectedNodeIds: { frameIdPath: string; nodeIds: number[] } = null;
    let documentLoadPaintIndex: number = null;
    let documentOrigin = this.startOrigin;
    for (const tick of this.ticks) {
      // if new doc, reset the markers
      if (tick.isNewDocumentTick) {
        lastFocusEventTick = null;
        lastScrollEventTick = null;
        lastPaintEventIdx = tick.eventTypeTick;
        documentLoadPaintIndex = tick.eventTypeTick;
        documentOrigin = tick.documentOrigin;
        lastMouseEventTick = null;
        lastSelectedNodeIds = null;
      }
      switch (tick.eventType) {
        case 'command':
          const command = this.commandsById.get(tick.commandId);
          if (command.resultNodeIds) {
            lastSelectedNodeIds = {
              nodeIds: command.resultNodeIds,
              frameIdPath: command.frameIdPath,
            };
          }
          break;
        case 'focus':
          lastFocusEventTick = tick.eventTypeTick;
          const focusEvent = this.focusEventsByTick[tick.eventTypeTick];
          if (focusEvent.event === 0 && focusEvent.targetNodeId) {
            lastSelectedNodeIds = {
              nodeIds: [focusEvent.targetNodeId],
              frameIdPath: focusEvent.frameIdPath,
            };
          } else if (focusEvent.event === 1) {
            lastSelectedNodeIds = null;
          }

          break;
        case 'paint':
          lastPaintEventIdx = tick.eventTypeTick;
          break;
        case 'scroll':
          lastScrollEventTick = tick.eventTypeTick;
          break;
        case 'mouse':
          lastMouseEventTick = tick.eventTypeTick;
          const mouseEvent = this.mouseEventsByTick[tick.eventTypeTick];
          if (mouseEvent.event === 1 && mouseEvent.targetNodeId) {
            lastSelectedNodeIds = {
              nodeIds: [mouseEvent.targetNodeId],
              frameIdPath: mouseEvent.frameIdPath,
            };
          } else if (mouseEvent.event === 2) {
            lastSelectedNodeIds = null;
          }
          break;
      }

      tick.focusEventTick = lastFocusEventTick;
      tick.scrollEventTick = lastScrollEventTick;
      tick.mouseEventTick = lastMouseEventTick;
      tick.paintEventIdx = lastPaintEventIdx;
      tick.documentLoadPaintIndex = documentLoadPaintIndex;
      tick.documentOrigin = documentOrigin;
      tick.highlightNodeIds = lastSelectedNodeIds;

      if (tick.eventType === 'init' || lastPaintEventIdx === null) {
        tick.documentLoadPaintIndex = -1;
        tick.documentOrigin = this.startOrigin;
        tick.paintEventIdx = -1;
      }
    }
    this.checkBroadcast();
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
  timestamp: number;
}
