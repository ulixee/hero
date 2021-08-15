import { DomActionType } from '@ulixee/hero-interfaces/IDomChangeEvent';
import { IDomChangeRecord } from '../models/DomChangesTable';
import sessionCommandsApi from './Session.commands';
import sessionDomChangesApi from './Session.domChanges';
import sessionInteractionsApi, { ISessionInteractionsResult } from './Session.interactions';
import SessionDb from '../dbs/SessionDb';
import { IMouseEventRecord } from '../models/MouseEventsTable';
import { IFocusRecord } from '../models/FocusEventsTable';
import { IScrollRecord } from '../models/ScrollEventsTable';
import ICommandWithResult from '../interfaces/ICommandWithResult';
import ICoreApi from '../interfaces/ICoreApi';
import sessionTabsApi, { ISessionTab } from './Session.tabs';
import { ISessionRecord } from '../models/SessionTable';

export default function sessionTicksApi(args: ISessionTicksArgs): ISessionTicksResult {
  const sessionDb = SessionDb.getCached(args.sessionId, true);
  const session = sessionDb.session.get();
  const { commands } = sessionCommandsApi(args);
  const { domChangesByTabId } = sessionDomChangesApi(args);
  const interactions = sessionInteractionsApi(args);
  const { tabs } = sessionTabsApi(args);

  const state = createSessionState(session, tabs);

  createCommandTicks(state, commands);
  createInteractionTicks(state, interactions);
  createPaintTicks(state, domChangesByTabId);
  copyDetachedPaintEvents(state, commands);

  // now sort all ticks and assign events
  sortTicks(state);

  const tabDetails = Object.values(state.tabsById);
  for (const tab of tabDetails) {
    if (!args.includeInteractionEvents) {
      delete tab.scroll;
      delete tab.focus;
      delete tab.mouse;
    }
    if (!args.includeCommands) {
      delete tab.commands;
    }
    if (!args.includePaintEvents) {
      delete tab.paintEvents;
    }
  }

  return { tabDetails };
}

/////// HELPER FUNCTIONS  //////////////////////////////////////////////////////////////////////////////////////////////

function createSessionState(session: ISessionRecord, tabs: ISessionTab[]): ISessionState {
  const state: ISessionState = {
    tabsById: {},
  };

  for (const tab of tabs) {
    state.tabsById[tab.id] = {
      tab,
      lastActivityTimestamp: tab.createdTime,
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

function createCommandTicks(state: ISessionState, commands: ICommandWithResult[]) {
  for (let i = 0; i < commands.length; i += 1) {
    const { startDate: timestamp, label, id: commandId, tabId, endDate } = commands[i];
    addTick(state, 'command', i, { timestamp, commandId, label, tabId });

    const tabDetails = state.tabsById[tabId];
    tabDetails.commands.push(commands[i]);

    if (endDate && endDate > tabDetails.lastActivityTimestamp) {
      tabDetails.lastActivityTimestamp = endDate;
    }
  }
}

function createInteractionTicks(state: ISessionState, interactions: ISessionInteractionsResult) {
  for (const type of ['mouse', 'focus', 'scroll']) {
    const events = interactions[type];
    for (let i = 0; i < events.length; i += 1) {
      const event = events[i];
      addTick(state, type as any, i, event);

      const { tabId } = event;
      const tabEvents = state.tabsById[tabId][type];
      tabEvents.push(event);
    }
  }
}

function createPaintTicks(
  state: ISessionState,
  domChangesByTabId: { [tabId: number]: IDomChangeRecord[] },
): void {
  for (const [tabId, changes] of Object.entries(domChangesByTabId)) {
    const details = state.tabsById[tabId] as ITabDetails;
    const { documents, tab } = details;
    const mainFrameIds = new Set(tab.frames.filter(x => x.isMainFrame).map(x => x.id));

    const paintEvents: { [timestamp: number]: IPaintEvent } = {};
    let i = 0;
    for (const change of changes) {
      const { timestamp, commandId, ...event } = change;
      const { frameId } = change;
      if (change.action === DomActionType.newDocument) {
        const isMainframe = mainFrameIds.has(frameId);
        const doctype =
          // eslint-disable-next-line no-nested-ternary
          changes[i + 1]?.nodeType === 10
            ? changes[i + 1].textContent
            : changes[i + 2]?.nodeType === 10
            ? changes[i + 2].textContent
            : null;

        documents.push({ url: change.textContent, doctype, isMainframe, frameId });
      }
      paintEvents[timestamp] ??= {
        timestamp,
        commandId,
        changeEvents: [],
      };
      paintEvents[timestamp].changeEvents.push(event as any);
      i += 1;
    }

    let idx = 0;
    for (const event of Object.values(paintEvents)) {
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

function copyDetachedPaintEvents(state: ISessionState, commands: ICommandWithResult[]): void {
  for (const command of commands) {
    if (command.name !== 'detachTab' || command.resultType !== 'Object') continue;

    const { result } = command;
    if (!result) continue;

    let parsedResult = result;
    if (typeof result === 'string') {
      parsedResult = JSON.parse(result);
    }

    const { id, parentTabId } = parsedResult.detachedTab;
    const { domChangeRange, url } = parsedResult.detachedState;

    const parentTabDetails = state.tabsById[parentTabId];
    const tabDetails = state.tabsById[id];

    const [startTimestamp, endTimestamp] = domChangeRange.timestampRange;
    const [startIndex, endIndex] = domChangeRange.indexRange;

    const paintTick: ITick = {
      eventType: 'paint',
      eventTypeIndex: 0,
      commandId: -1,
      timestamp: tabDetails.tab.createdTime + 1,
      isMajor: false,
      playbarOffsetPercent: 1,
      isNewDocumentTick: true,
      paintEventIndex: 0,
      documentUrl: url,
      documentLoadPaintIndex: 0,
    };

    tabDetails.ticks.unshift(paintTick);

    const consolidatedPaintEvent: IPaintEvent = {
      changeEvents: [],
      commandId: command.id,
      timestamp: paintTick.timestamp,
    };
    tabDetails.paintEvents.push(consolidatedPaintEvent);

    const frameIds = new Set<number>();
    for (const paintEvent of parentTabDetails.paintEvents) {
      const { timestamp } = paintEvent;
      if (timestamp > endTimestamp) break;
      if (timestamp < startTimestamp) continue;

      for (const change of paintEvent.changeEvents) {
        let includeChange = true;

        if (timestamp === startTimestamp && change.eventIndex < startIndex) {
          includeChange = false;
        }

        if (timestamp === endTimestamp && change.eventIndex > endIndex) {
          includeChange = false;
        }

        if (includeChange) {
          frameIds.add(change.frameId);
          consolidatedPaintEvent.changeEvents.push(change);
        }
      }
    }
    const documents = parentTabDetails.documents.filter(x => frameIds.has(x.frameId));
    tabDetails.documents.push(...documents);
  }
}

function sortTicks(state: ISessionState): void {
  for (const tabDetails of Object.values(state.tabsById)) {
    const { ticks, focus, mouse, commands, tab } = tabDetails;
    ticks.sort((a, b) => {
      if (a.timestamp === b.timestamp) {
        if (a.eventType === b.eventType) return a.eventTypeIndex - b.eventTypeIndex;
        return a.eventType.localeCompare(b.eventType);
      }
      return a.timestamp - b.timestamp;
    });
    ticks.unshift({
      playbarOffsetPercent: 0,
      isMajor: true,
      eventType: 'init',
      timestamp: tab.createdTime,
      eventTypeIndex: -1,
      commandId: -1,
      label: 'Session Created',
    } as any);

    const startUrl = tab.startUrl;

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
      documentLoadPaintIndex: undefined,
      documentUrl: startUrl,
    };
    const commandHighlightsById = new Map<number, ICommandWithResult>();
    for (const command of commands) {
      if (command.resultNodeIds) {
        commandHighlightsById.set(command.id, command);
      }
    }

    const startTime = tabDetails.tab.createdTime;
    const tabActiveMillis = tabDetails.lastActivityTimestamp - startTime;

    for (const tick of ticks) {
      tick.playbarOffsetPercent = round((100 * (tick.timestamp - startTime)) / tabActiveMillis);
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
  }
}

function addTick(
  state: ISessionState,
  eventType: ITick['eventType'],
  eventTypeIndex: number,
  tick: { commandId?: number; timestamp: number; label?: string; tabId: number },
): ITick {
  const { commandId, timestamp, label, tabId } = tick;
  const tabDetails = state.tabsById[tabId];

  const newTick = {
    eventType,
    eventTypeIndex,
    commandId,
    timestamp,
    label,
    isMajor: eventType === 'command',
  } as ITick;

  if (timestamp > tabDetails.lastActivityTimestamp) {
    tabDetails.lastActivityTimestamp = timestamp;
  }

  tabDetails.ticks.push(newTick);
  return newTick;
}

function round(num: number): number {
  return Math.floor(1000 * num) / 1000;
}

export interface ISessionTicksApi extends ICoreApi {
  args: ISessionTicksArgs;
  result: ISessionTicksResult;
}

export interface ISessionTicksArgs {
  sessionId: string;
  includeInteractionEvents?: boolean;
  includeCommands?: boolean;
  includePaintEvents?: boolean;
}

export interface ISessionTicksResult {
  tabDetails: ITabDetails[];
}

export interface ITabDetails {
  tab: ISessionTab;
  lastActivityTimestamp: number;
  ticks: ITick[];
  mouse?: IMouseEventRecord[];
  focus?: IFocusRecord[];
  scroll?: IScrollRecord[];
  commands?: ICommandWithResult[];
  paintEvents?: IPaintEvent[];
  documents: IDocument[];
}

export interface IDocument {
  isMainframe: boolean;
  frameId: number;
  url: string;
  doctype: string;
}

export interface IPaintEvent {
  timestamp: number;
  commandId: number;
  changeEvents: Omit<IDomChangeRecord, 'timestamp' | 'commandId'>[];
}

export interface ITick {
  eventType: 'command' | 'paint' | 'focus' | 'mouse' | 'scroll' | 'init';
  eventTypeIndex: number;
  commandId: number;
  timestamp: number;
  playbarOffsetPercent: number;
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

export interface IDetachedTabState {
  parentTabId: number;
  url: string;
  domChangeRange: { indexRange: [number, number]; timestampRange: [number, number] };
}

interface ISessionState {
  tabsById: { [tabId: number]: ITabDetails };
}
