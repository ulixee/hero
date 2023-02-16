import { DomActionType } from '@ulixee/hero-interfaces/IDomChangeEvent';
import SessionDb from '@ulixee/hero-core/dbs/SessionDb';
import { IMouseEventRecord, MouseEventType } from '@ulixee/hero-core/models/MouseEventsTable';
import { IFocusRecord } from '@ulixee/hero-core/models/FocusEventsTable';
import { IScrollRecord } from '@ulixee/hero-core/models/ScrollEventsTable';
import ICommandWithResult from '@ulixee/hero-core/interfaces/ICommandWithResult';
import CommandFormatter from '@ulixee/hero-core/lib/CommandFormatter';
import DomChangesTable, {
  IDocument,
  IDomChangeRecord,
  IPaintEvent,
} from '@ulixee/hero-core/models/DomChangesTable';
import CommandTimeline from '../lib/CommandTimeline';

export default function getTimetravelTicks(options: {
  sessionId: string;
  timelineRange?: [startTime: number, endTime?: number];
}): ITabDetails[] {
  const sessionDb = SessionDb.getCached(options.sessionId, true);
  const timeline = CommandTimeline.fromDb(sessionDb);
  const commands = timeline.commands.map(CommandFormatter.parseResult);
  const state = createSessionState(sessionDb, timeline);

  createCommandTicks(state, commands);
  createInteractionTicks(state, sessionDb);
  createPaintTicks(state, sessionDb);

  // now sort all ticks and assign events
  sortTicks(state);

  return Object.values(state.tabsById);
}

/////// HELPER FUNCTIONS  //////////////////////////////////////////////////////////////////////////////////////////////

function createSessionState(sessionDb: SessionDb, timeline: CommandTimeline): ISessionState {
  const state: ISessionState = {
    tabsById: {},
    timeline,
  };
  const tabs = sessionDb.tabs.all();
  const frames = sessionDb.frames.all();
  // don't take redirects
  const frameNavigations = sessionDb.frameNavigations.all().filter(x => !x.httpRedirectedTime);

  for (const tab of tabs) {
    const tabFrames = frames.filter(x => x.tabId === tab.id);
    const mainFrame = frames.find(x => !x.parentId && x.tabId === tab.id);
    const startNavigation = frameNavigations.find(x => x.frameId === mainFrame.id);
    const tabResult = {
      id: tab.id,
      width: tab.viewportWidth,
      height: tab.viewportHeight,
      startUrl: startNavigation.finalUrl ?? startNavigation.requestedUrl,
      createdTime: tab.createdTime,
      frames: tabFrames.map(x => {
        return {
          id: x.id,
          isMainFrame: !x.parentId,
          domNodePath: sessionDb.frames.frameDomNodePathsById[x.id],
        };
      }),
    };

    state.tabsById[tab.id] = {
      tab: tabResult,
      ticks: [],
      documents: [],
      mouse: [],
      focus: [],
      scroll: [],
      commands: [],
      paintEvents: [],
    };
  }
  return state;
}

function createCommandTicks(state: ISessionState, commands: ICommandWithResult[]): void {
  for (let i = 0; i < commands.length; i += 1) {
    const command = commands[i];
    const tabId = command.tabId ?? Number(Object.keys(state.tabsById)[0]);

    addTick(state, 'command', i, {
      timestamp: command.startTime,
      commandId: command.id,
      label: command.label,
      tabId,
    });

    const tabDetails = state.tabsById[tabId];
    tabDetails.commands.push(command);
  }
}

function createInteractionTicks(state: ISessionState, sessionDb: SessionDb): void {
  function sort(a: { timestamp: number }, b: { timestamp: number }): number {
    return a.timestamp - b.timestamp;
  }

  const validMouseEvents = [MouseEventType.MOVE, MouseEventType.DOWN, MouseEventType.UP];

  const filteredMouseEvents = new Set(validMouseEvents);
  const interactions = {
    mouse: sessionDb.mouseEvents
      .all()
      .filter(x => filteredMouseEvents.has(x.event))
      .sort(sort),
    focus: sessionDb.focusEvents.all().sort(sort),
    scroll: sessionDb.scrollEvents.all().sort(sort),
  } as const;

  for (const [type, events] of Object.entries(interactions)) {
    for (let i = 0; i < events.length; i += 1) {
      const event = events[i];
      addTick(state, type as any, i, event);

      const tabEvents = state.tabsById[event.tabId][type];
      tabEvents.push(event);
    }
  }
}

function createPaintTicks(state: ISessionState, sessionDb: SessionDb): void {
  const allDomChanges = sessionDb.domChanges.all();

  const domChangesByTabId: { [tabId: number]: IDomChangeRecord[] } = {};

  for (const change of allDomChanges) {
    domChangesByTabId[change.tabId] ??= [];
    domChangesByTabId[change.tabId].push(change);
  }

  for (const [tabId, changes] of Object.entries(domChangesByTabId)) {
    const details = state.tabsById[tabId] as ITabDetails;
    const { documents, tab } = details;
    const mainFrameIds = new Set(tab.frames.filter(x => x.isMainFrame).map(x => x.id));

    const toPaint = DomChangesTable.toDomRecording(changes, mainFrameIds);
    documents.push(...toPaint.documents);

    let idx = 0;
    for (const event of toPaint.paintEvents) {
      const tick = addTick(state, 'paint', idx, { tabId: Number(tabId), ...event });
      const { action, frameId, textContent } = event.changeEvents[0];

      details.paintEvents.push(event);

      const isMainframe = mainFrameIds.has(frameId);
      if (isMainframe && action === DomActionType.newDocument) {
        tick.isNewDocumentTick = true;
        tick.documentUrl = textContent;
      }
      idx += 1;
    }
  }
}

function sortTicks(state: ISessionState): void {
  for (const tabDetails of Object.values(state.tabsById)) {
    const { focus, mouse, commands, tab } = tabDetails;
    const firstDocument = tabDetails.documents[0];

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
    for (const command of commands) {
      if (command.resultNodeIds) {
        commandHighlightsById.set(command.id, command);
      }
    }

    tabDetails.ticks.sort((a, b) => {
      if (a.timestamp === b.timestamp) {
        if (a.eventType === b.eventType) return a.eventTypeIndex - b.eventTypeIndex;
        return a.eventType.localeCompare(b.eventType);
      }
      return a.timestamp - b.timestamp;
    });

    for (const tick of tabDetails.ticks) {
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
        tick.documentUrl = tab.startUrl;
        tick.paintEventIndex = -1;
      }
    }

    // filter afterwards so we get correct navigations
    tabDetails.ticks = tabDetails.ticks.filter(tick => {
      tick.timelineOffsetPercent ??= state.timeline.getTimelineOffsetForTimestamp(tick.timestamp);
      return tick.timelineOffsetPercent <= 100 && tick.timelineOffsetPercent >= 0;
    });
  }
}

function addTick(
  state: ISessionState,
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

  const tabDetails = tabId ? state.tabsById[tabId] : Object.values(state.tabsById)[0];
  tabDetails.ticks.push(newTick);
  return newTick;
}

export interface ISessionTab {
  id: number;
  createdTime: number;
  startUrl: string;
  width: number;
  height: number;
  frames: ISessionFrame[];
}

export interface ISessionFrame {
  id: number;
  isMainFrame: boolean;
  domNodePath: string;
}

export interface ITabDetails {
  tab: ISessionTab;
  ticks: ITick[];
  mouse?: IMouseEventRecord[];
  focus?: IFocusRecord[];
  scroll?: IScrollRecord[];
  commands?: ICommandWithResult[];
  paintEvents?: IPaintEvent[];
  documents: IDocument[];
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

interface ISessionState {
  tabsById: { [tabId: number]: ITabDetails };
  timeline: CommandTimeline;
}
