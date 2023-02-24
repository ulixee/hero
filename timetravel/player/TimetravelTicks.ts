import SessionDb from '@ulixee/hero-core/dbs/SessionDb';
import { IMouseEventRecord, MouseEventType } from '@ulixee/hero-core/models/MouseEventsTable';
import { IFocusRecord } from '@ulixee/hero-core/models/FocusEventsTable';
import { IScrollRecord } from '@ulixee/hero-core/models/ScrollEventsTable';
import ICommandWithResult from '@ulixee/hero-core/interfaces/ICommandWithResult';
import CommandFormatter from '@ulixee/hero-core/lib/CommandFormatter';
import DomChangesTable, {
  IDomChangeRecord,
  IDomRecording,
} from '@ulixee/hero-core/models/DomChangesTable';
import CommandTimeline from '../lib/CommandTimeline';

export default class TimetravelTicks {
  public get tabs(): ITabDetails[] {
    return Object.values(this.tabsById);
  }

  public timeline: CommandTimeline;
  private tabsById: { [tabId: number]: ITabDetails } = {};

  constructor(
    readonly sessionDb: SessionDb,
    private timelineRange?: [startTime: number, endTime?: number],
  ) {}

  public load(
    domRecordingsWithTabId?: { tabId: number; domRecording: IDomRecording }[],
    commandTimeline?: CommandTimeline,
  ): ITabDetails[] {
    this.timeline = commandTimeline ?? CommandTimeline.fromDb(this.sessionDb);
    domRecordingsWithTabId ??= TimetravelTicks.loadDomRecording(this.sessionDb);
    for (const { tabId, domRecording } of domRecordingsWithTabId) {
      this.tabsById[tabId] = {
        domRecording,
        tabId,
        ticks: [],
        mouse: [],
        focus: [],
        scroll: [],
      };
    }

    this.createCommandTicks();
    this.createInteractionTicks();
    this.createPaintTicks();

    // now sort all ticks and assign events
    this.sortTicks();
    return this.tabs;
  }

  private createCommandTicks(): void {
    const commands = this.timeline.commands;
    for (let i = 0; i < commands.length; i += 1) {
      const command = commands[i];
      const tabId = command.tabId ?? this.tabs[0]?.tabId;

      this.addTick('command', i, {
        timestamp: command.startTime,
        commandId: command.id,
        label: CommandFormatter.toString(command),
        tabId,
      });
    }
  }

  private createInteractionTicks(): void {
    const filteredMouseEvents = new Set([
      MouseEventType.MOVE,
      MouseEventType.DOWN,
      MouseEventType.UP,
    ]);

    const interactions = {
      mouse: this.sessionDb.mouseEvents
        .all()
        .filter(x => filteredMouseEvents.has(x.event))
        .sort(sortByTimestamp),
      focus: this.sessionDb.focusEvents.all().sort(sortByTimestamp),
      scroll: this.sessionDb.scrollEvents.all().sort(sortByTimestamp),
    } as const;

    for (const [type, events] of Object.entries(interactions)) {
      for (let i = 0; i < events.length; i += 1) {
        const event = events[i];
        this.addTick(type as any, i, event);

        const tabEvents = this.tabsById[event.tabId][type];
        tabEvents.push(event);
      }
    }
  }

  private createPaintTicks(): void {
    for (const { tabId, domRecording } of this.tabs) {
      if (!domRecording) continue;
      const newDocumentUrlByPaintIndex: { [index: number]: string } = {};
      for (const document of domRecording.documents) {
        newDocumentUrlByPaintIndex[document.paintEventIndex] = document.url;
      }

      let idx = 0;
      for (const event of domRecording.paintEvents) {
        const tick = this.addTick('paint', idx, { tabId, ...event });
        const newDocumentUrl = newDocumentUrlByPaintIndex[idx];
        if (newDocumentUrl) {
          tick.isNewDocumentTick = true;
          tick.documentUrl = newDocumentUrl;
        }
        idx += 1;
      }
    }
  }

  private sortTicks(): void {
    for (const tab of this.tabs) {
      const { focus, mouse, domRecording, ticks } = tab;
      if (!domRecording) {
        delete this.tabsById[tab.tabId];
        continue;
      }
      const firstDocument = domRecording.documents[0];
      if (!firstDocument) continue;

      let lastEvents: Pick<
        ITick,
        | 'paintEventIndex'
        | 'scrollEventIndex'
        | 'mouseEventIndex'
        | 'focusEventIndex'
        | 'highlightNodeIds'
        | 'documentUrl'
        | 'documentLoadPaintIndex'
      > = {
        documentLoadPaintIndex: firstDocument.paintEventIndex,
        documentUrl: firstDocument.url,
      };
      const commandHighlightsById = new Map<number, ICommandWithResult>();
      for (const command of this.timeline.commands) {
        const result = CommandFormatter.parseResult(command);
        if (result.resultNodeIds) {
          commandHighlightsById.set(command.id, result);
        }
      }

      ticks.sort((a, b) => {
        if (a.timestamp === b.timestamp) {
          if (a.eventType === b.eventType) return a.eventTypeIndex - b.eventTypeIndex;
          return a.eventType.localeCompare(b.eventType);
        }
        return a.timestamp - b.timestamp;
      });

      for (const tick of ticks) {
        // if new doc, reset the markers
        if (tick.isNewDocumentTick) {
          lastEvents = {
            paintEventIndex: tick.eventTypeIndex,
            scrollEventIndex: undefined,
            mouseEventIndex: undefined,
            focusEventIndex: undefined,
            documentLoadPaintIndex: tick.eventTypeIndex,
            documentUrl: tick.documentUrl,
            highlightNodeIds: undefined,
          };
        }
        switch (tick.eventType) {
          case 'command':
            const command = commandHighlightsById.get(tick.commandId);
            if (command) {
              lastEvents.highlightNodeIds = {
                nodeIds: command.resultNodeIds,
                frameId: command.frameId,
              };
            }
            break;
          case 'focus':
            lastEvents.focusEventIndex = tick.eventTypeIndex;
            const focusEvent = focus[tick.eventTypeIndex];
            if (focusEvent.event === 0 && focusEvent.targetNodeId) {
              lastEvents.highlightNodeIds = {
                nodeIds: [focusEvent.targetNodeId],
                frameId: focusEvent.frameId,
              };
            } else if (focusEvent.event === 1) {
              lastEvents.highlightNodeIds = undefined;
            }

            break;
          case 'paint':
            lastEvents.paintEventIndex = tick.eventTypeIndex;
            break;
          case 'scroll':
            lastEvents.scrollEventIndex = tick.eventTypeIndex;
            break;
          case 'mouse':
            lastEvents.mouseEventIndex = tick.eventTypeIndex;
            const mouseEvent = mouse[tick.eventTypeIndex];
            if (mouseEvent.event === 1 && mouseEvent.targetNodeId) {
              lastEvents.highlightNodeIds = {
                nodeIds: [mouseEvent.targetNodeId],
                frameId: mouseEvent.frameId,
              };
            } else if (mouseEvent.event === 2) {
              lastEvents.highlightNodeIds = undefined;
            }
            break;
        }

        Object.assign(tick, lastEvents);
        if (tick.eventType === 'init' || lastEvents.paintEventIndex === undefined) {
          tick.documentLoadPaintIndex = -1;
          tick.documentUrl = firstDocument.url;
          tick.paintEventIndex = -1;
        }
      }

      // filter afterwards so we get correct navigations
      tab.ticks = ticks.filter(tick => {
        tick.timelineOffsetPercent ??= this.timeline.getTimelineOffsetForTimestamp(tick.timestamp);
        return tick.timelineOffsetPercent <= 100 && tick.timelineOffsetPercent >= 0;
      });
    }
  }

  private addTick(
    eventType: ITick['eventType'],
    eventTypeIndex: number,
    tick: { commandId?: number; timestamp: number; label?: string; tabId: number },
  ): ITick {
    const { commandId, timestamp, label, tabId } = tick;

    const newTick = {
      eventType,
      eventTypeIndex,
      commandId,
      timestamp,
      label,
      isMajor: eventType === 'command',
    } as ITick;

    const tabDetails = tabId ? this.tabsById[tabId] : Object.values(this.tabsById)[0];
    tabDetails.ticks.push(newTick);
    return newTick;
  }

  public static loadFromDb(
    sessionId: string,
    timelineRange?: [startTime: number, endTime?: number],
  ): TimetravelTicks {
    const sessionDb = SessionDb.getCached(sessionId);
    const timetravel = new TimetravelTicks(sessionDb, timelineRange);
    timetravel.load();
    return timetravel;
  }

  public static loadDomRecording(
    sessionDb: SessionDb,
  ): { tabId: number; domRecording: IDomRecording }[] {
    const allDomChanges = sessionDb.domChanges.all();

    const domChangesByTabId: { [tabId: number]: IDomChangeRecord[] } = {};

    for (const change of allDomChanges) {
      domChangesByTabId[change.tabId] ??= [];
      domChangesByTabId[change.tabId].push(change);
    }

    return Object.entries(domChangesByTabId).map(([tabIdString, changes]) => {
      const tabId = Number(tabIdString);
      const domRecording = DomChangesTable.toDomRecording(
        changes,
        sessionDb.frames.mainFrameIds(tabId),
        sessionDb.frames.frameDomNodePathsById,
      );
      return { tabId, domRecording };
    });
  }
}

function sortByTimestamp(a: { timestamp: number }, b: { timestamp: number }): number {
  return a.timestamp - b.timestamp;
}

export interface ITabDetails {
  tabId: number;
  ticks: ITick[];
  mouse?: IMouseEventRecord[];
  focus?: IFocusRecord[];
  scroll?: IScrollRecord[];
  domRecording?: IDomRecording;
}

export interface ITick {
  eventType: 'command' | 'paint' | 'focus' | 'mouse' | 'scroll' | 'init';
  eventTypeIndex: number;
  commandId: number;
  timestamp: number;
  timelineOffsetPercent: number;
  isMajor: boolean;
  label?: string;
  isNewDocumentTick: boolean;
  documentUrl: string;
  documentLoadPaintIndex: number;
  highlightNodeIds?: { frameId: number; nodeIds: number[] };
  paintEventIndex?: number;
  scrollEventIndex?: number;
  focusEventIndex?: number;
  mouseEventIndex?: number;
}
