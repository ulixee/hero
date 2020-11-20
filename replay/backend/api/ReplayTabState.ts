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
import { IDomChangeEvent, IFrontendDomChangeEvent } from '~shared/interfaces/IDomChangeEvent';
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
  public viewportWidth: number;
  public viewportHeight: number;
  public currentPlaybarOffsetPct = 0;
  public replayTime: ReplayTime;
  public tabCreatedTime: string;

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
    this.viewportHeight = tabMeta.height;
    this.viewportWidth = tabMeta.width;
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

  public transitionToPreviousTick() {
    const prevTickIdx = this.currentTickIdx > 0 ? this.currentTickIdx - 1 : this.currentTickIdx;
    return this.loadTick(prevTickIdx);
  }

  public transitionToNextTick() {
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

    const changeEvents: IFrontendDomChangeEvent[] = [];
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
        if (
          paints.changeEvents[0].frameIdPath === 'main' &&
          paints.changeEvents[0].action === 'newDocument'
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

  public loadTick(
    newTickIdx: number,
    specificPlaybarOffset?: number,
  ): [IFrontendDomChangeEvent[], number[], IFrontendMouseEvent, IScrollRecord] {
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

    let frontendMouseEvent: IFrontendMouseEvent;
    if (mouseEvent) {
      frontendMouseEvent = {
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

    // if this is a subframe without a frame, ignore it
    if (!event.frameIdPath) return;

    const isMainFrame = event.frameIdPath === 'main';
    if (isMainFrame && event.action === 'newDocument' && !this.startOrigin) {
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

    const frontendEvent: IFrontendDomChangeEvent = {
      nodeId: event.nodeId,
      eventIndex: event.eventIndex,
      action: event.action,
      frameIdPath: event.frameIdPath,
      nodeType: event.nodeType,
      textContent: event.textContent,
      tagName: event.tagName,
      namespaceUri: event.namespaceUri,
      previousSiblingId: event.previousSiblingId,
      parentNodeId: event.parentNodeId,
      attributes: event.attributes,
      attributeNamespaces: event.attributeNamespaces,
      properties: event.properties,
      timestamp: event.timestamp,
    };

    if (paintEvent) {
      const events = paintEvent.changeEvents;
      events.push(frontendEvent);

      if (events.length > 0 && events[events.length - 1].eventIndex > event.eventIndex) {
        events.sort((a, b) => {
          if (a.frameIdPath === b.frameIdPath) {
            if (a.timestamp === b.timestamp) return a.eventIndex - b.eventIndex;
            return a.timestamp.localeCompare(b.timestamp);
          }
          return a.frameIdPath.localeCompare(b.frameIdPath);
        });
        const paintIndex = this.paintEvents.indexOf(paintEvent);
        if (paintIndex < this.paintEventsLoadedIdx) this.paintEventsLoadedIdx = paintIndex - 1;
      }
    } else {
      paintEvent = {
        changeEvents: [frontendEvent],
        timestamp,
        commandId,
      };

      const index = this.paintEvents.length;
      this.paintEvents.push(paintEvent);

      const tick = new ReplayTick(this, 'paint', index, commandId, timestamp);
      this.ticks.push(tick);
      if (isMainFrame && action === 'newDocument') {
        tick.isNewDocumentTick = true;
        tick.documentOrigin = textContent;
        this.pages.push({
          id: pageCounter += 1,
          url: textContent,
          commandId,
        });
      }

      if (lastPaintEvent && lastPaintEvent.timestamp >= timestamp) {
        console.log('Need to resort paint events - received out of order');

        this.paintEvents.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

        for (const t of this.ticks) {
          if (t.eventType !== 'paint') continue;
          const newIndex = this.paintEvents.findIndex(x => x.timestamp === t.timestamp);
          if (t.eventTypeIdx !== newIndex) {
            if (this.paintEventsLoadedIdx >= newIndex) this.paintEventsLoadedIdx = newIndex - 1;
            t.eventTypeIdx = newIndex;
          }
        }
      }
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
          break;
        case 'focus':
          lastFocusEventIdx = tick.eventTypeIdx;
          const focusEvent = this.focusEvents[lastFocusEventIdx];
          if (focusEvent.event === 0 && focusEvent.targetNodeId) {
            lastSelectedNodeIds = [focusEvent.targetNodeId];
          } else if (focusEvent.event === 1) {
            lastSelectedNodeIds = null;
          }

          break;
        case 'paint':
          lastPaintEventIdx = tick.eventTypeIdx;
          break;
        case 'scroll':
          lastScrollEventIdx = tick.eventTypeIdx;
          break;
        case 'mouse':
          lastMouseEventIdx = tick.eventTypeIdx;
          const mouseEvent = this.mouseEvents[lastMouseEventIdx];
          if (mouseEvent.event === 1 && mouseEvent.targetNodeId) {
            lastSelectedNodeIds = [mouseEvent.targetNodeId];
          } else if (mouseEvent.event === 2) {
            lastSelectedNodeIds = null;
          }
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
  timestamp: string;
}
