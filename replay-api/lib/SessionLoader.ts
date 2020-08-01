import SessionDb from '@secret-agent/session-state/lib/SessionDb';
import ICommandMeta from '@secret-agent/core-interfaces/ICommandMeta';
import DomChangesTable, {
  IDomChangeRecord,
} from '@secret-agent/session-state/models/DomChangesTable';
import { IPageRecord } from '@secret-agent/session-state/models/PagesTable';
import { ISessionRecord } from '@secret-agent/session-state/models/SessionTable';
import { IDomChangeEvent } from '@secret-agent/injected-scripts/interfaces/IDomChangeEvent';
import DomEnv from '@secret-agent/core/lib/DomEnv';
import {
  IMouseEventRecord,
  MouseEventType,
} from '@secret-agent/session-state/models/MouseEventsTable';
import { IScrollRecord } from '@secret-agent/session-state/models/ScrollEventsTable';
import { IFocusRecord } from '@secret-agent/session-state/models/FocusEventsTable';
import { IInteractionGroup } from '@secret-agent/core-interfaces/IInteractions';
import { getKeyboardChar } from '@secret-agent/core-interfaces/IKeyboardLayoutUS';
import moment from 'moment';
import { IFrameRecord } from '@secret-agent/session-state/models/FramesTable';

export default class SessionLoader {
  public ticks: IMajorTick[] = [];
  public readonly commandResults: ICommandResult[] = [];
  public readonly mouseEvents: IMouseEventRecord[];
  public readonly scrollEvents: IScrollRecord[];
  public readonly focusEvents: IFocusRecord[];
  public readonly frames: IFrameRecord[];
  public readonly durationMillis: number;
  public unresponsiveSeconds = 0;
  public hasRecentErrors: boolean;

  private readonly sessionDb: SessionDb;
  private readonly pageRecords: IPageRecord[];

  private readonly commands: ICommandMeta[];
  private readonly session: ISessionRecord;
  private readonly domChangeGroups: IDomChangeGroup[] = [];
  private readonly startTime: Date;
  private readonly closeTime?: Date;

  constructor(sessionDb: SessionDb) {
    this.sessionDb = sessionDb;
    this.pageRecords = this.sessionDb.pages.all();
    this.commands = this.sessionDb.commands.all();
    this.frames = this.sessionDb.frames.all();
    this.mouseEvents = this.sessionDb.mouseEvents.allEvents([
      MouseEventType.MOVE,
      MouseEventType.DOWN,
      MouseEventType.UP,
    ]);
    this.scrollEvents = this.sessionDb.scrollEvents.all();
    this.focusEvents = this.sessionDb.focusEvents.all();
    this.session = this.sessionDb.session.get();
    this.assembleDomChangeGroups();

    this.startTime = new Date(this.session.startDate);
    this.closeTime = this.session.closeDate ? new Date(this.session.closeDate) : null;
    if (this.closeTime) {
      this.durationMillis = this.closeTime.getTime() - this.startTime.getTime();
    } else {
      // add 10 seconds to end time
      this.durationMillis = (new Date().getTime() - this.startTime.getTime()) * 1.25;
    }

    this.assembleTicks();
    this.assembleCommandResults();
    this.checkForHungScript();
  }

  public getCommand(tickId: number) {
    return this.commands.find(x => x.id === tickId);
  }

  public get paintEvents() {
    const paintEvents: IPaintEvent[] = [];
    for (const domChangeGroup of this.domChangeGroups) {
      paintEvents.push({
        timestamp: domChangeGroup.timestamp,
        commandId: domChangeGroup.commandId,
        changeEvents: domChangeGroup.changes.map(x => DomChangesTable.toDomChangeEvent(x)),
      });
    }
    return paintEvents;
  }

  public get pages() {
    return this.pageRecords.map(x => ({
      id: x.id,
      commandId: x.startCommandId,
      url: x.finalUrl ?? x.requestedUrl,
    }));
  }

  private checkForHungScript() {
    if (!!this.closeTime) return;

    const lastCommand = last(this.commands);
    if (!lastCommand) return;

    const latestPage = last(this.pageRecords);

    let lastSuccessDate = latestPage.allContentLoadedTime ?? latestPage.initiatedTime;
    // check if second to last command worked
    if (this.commands.length > 2) {
      const secondToLastCommand = this.commands[this.commands.length - 2];
      if (
        latestPage.allContentLoadedTime &&
        secondToLastCommand.endDate > lastSuccessDate &&
        !secondToLastCommand.resultType?.includes('Error')
      ) {
        lastSuccessDate = secondToLastCommand.endDate;
      }
    }
    this.hasRecentErrors = this.sessionDb.sessionLogs
      .allErrors()
      .some(x => x.timestamp >= lastSuccessDate);

    this.unresponsiveSeconds = moment().diff(
      lastCommand.endDate ?? lastCommand.startDate,
      'seconds',
    );
  }

  private assembleCommandResults() {
    for (const meta of this.commands) {
      const duration = meta.endDate
        ? new Date(meta.endDate).getTime() - new Date(meta.startDate).getTime()
        : null;

      const command: ICommandResult = {
        commandId: meta.id,
        duration,
        isError: false,
        result: null,
      };
      this.commandResults.push(command);

      if (meta.result) {
        const result = JSON.parse(meta.result);

        command.result = result;
        if (meta.resultType === 'Object') {
          const resultType = typeof result.value;
          if (
            resultType === 'string' ||
            resultType === 'number' ||
            resultType === 'boolean' ||
            resultType === 'undefined'
          ) {
            command.result = result.value;
          }

          if (result.attachedState) {
            command.resultNodeIds = [result.attachedState.id];
            command.resultNodeType = result.attachedState.type;
            if (result.attachedState.iterableItems) {
              command.result = result.attachedState.iterableItems;
            }
            if (result.attachedState.iterableIds) {
              command.resultNodeIds = result.attachedState.iterableIds;
            }
          }
        }

        if (meta.resultType.toLowerCase().includes('error')) {
          command.isError = true;
          command.result = result.message;
          if (result.pathState) {
            const { step, index } = result.pathState;
            command.failedJsPathStepIndex = index;
            command.failedJsPathStep = Array.isArray(step)
              ? `${step[0]}(${step.slice(1).map(x => JSON.stringify(x))})`
              : step;
          }
        }
      }
      // we have shell objects occasionally coming back. hide from ui
      if (meta.args?.includes(DomEnv.getAttachedStateFnName)) {
        command.result = undefined;
      }
    }
  }

  private assembleDomChangeGroups() {
    const parentFrameIds = new Set(this.frames.filter(x => !x.parentId).map(x => x.id));
    const domChanges = this.sessionDb.domChanges.all();
    let domChangeGroup: IDomChangeGroup = null;
    for (const change of domChanges) {
      if (parentFrameIds.size && !parentFrameIds.has(change.frameId)) continue;
      if (
        domChangeGroup?.timestamp !== change.timestamp ||
        domChangeGroup?.commandId !== change.commandId
      ) {
        domChangeGroup = {
          timestamp: change.timestamp,
          commandId: change.commandId,
          changes: [],
        };
        this.domChangeGroups.push(domChangeGroup);
      }
      domChangeGroup.changes.push(change);
    }
  }

  private assembleTicks() {
    this.ticks.push({
      label: 'Load',
      commandId: -1,
      minorTicks: [],
      type: 'load',
      durationMs: 0,
      timestamp: new Date(this.session.startDate),
      playbarOffsetPercent: 0,
    });

    for (const command of this.commands) {
      const date = new Date(command.startDate);
      const majorTick = {
        type: 'command',
        commandId: command.id,
        label: formatCommand(command),
        timestamp: date,
        playbarOffsetPercent: this.getPlaybarOffset(date),
        minorTicks: [],
      } as IMajorTick;

      if (
        this.ticks.length &&
        this.ticks[this.ticks.length - 1].playbarOffsetPercent >= majorTick.playbarOffsetPercent
      ) {
        majorTick.playbarOffsetPercent =
          this.ticks[this.ticks.length - 1].playbarOffsetPercent + 0.01;
      }
      this.ticks.push(majorTick);

      for (let i = 0; i < this.domChangeGroups.length; i += 1) {
        const domChange = this.domChangeGroups[i];
        if (domChange.commandId === command.id) {
          const timestamp = new Date(domChange.timestamp);
          majorTick.minorTicks.push({
            type: 'paint',
            paintEventIdx: i,
            playbarOffsetPercent: this.getPlaybarOffset(timestamp),
            timestamp,
          });
        }
      }

      for (let i = 0; i < this.mouseEvents.length; i += 1) {
        const mouseEventRecord = this.mouseEvents[i];
        if (mouseEventRecord.commandId === command.id) {
          const timestamp = new Date(mouseEventRecord.timestamp);
          majorTick.minorTicks.push({
            type: 'mouse',
            mouseEventIdx: i,
            playbarOffsetPercent: this.getPlaybarOffset(timestamp),
            timestamp,
          });
        }
      }

      for (let i = 0; i < this.focusEvents.length; i += 1) {
        const record = this.focusEvents[i];
        if (record.commandId === command.id) {
          const timestamp = new Date(record.timestamp);
          majorTick.minorTicks.push({
            type: 'focus',
            focusEventIdx: i,
            playbarOffsetPercent: this.getPlaybarOffset(timestamp),
            timestamp,
          });
        }
      }

      for (let i = 0; i < this.scrollEvents.length; i += 1) {
        const record = this.scrollEvents[i];
        if (record.commandId === command.id) {
          const timestamp = new Date(record.timestamp);
          majorTick.minorTicks.push({
            type: 'scroll',
            scrollEventIdx: i,
            playbarOffsetPercent: this.getPlaybarOffset(timestamp),
            timestamp,
          });
        }
      }

      for (let i = 0; i < this.pageRecords.length; i += 1) {
        const page = this.pageRecords[i];
        if (page.startCommandId === command.id) {
          const timestamp = new Date(page.initiatedTime);
          majorTick.minorTicks.push({
            type: 'page',
            pageIdx: i,
            playbarOffsetPercent: this.getPlaybarOffset(timestamp),
            timestamp,
          });
        }
      }

      majorTick.minorTicks.sort((a, b) => {
        return a.playbarOffsetPercent - b.playbarOffsetPercent;
      });
    }
  }

  private getPlaybarOffset(timestamp: Date) {
    const millis = timestamp.getTime() - this.startTime.getTime();
    return Math.floor((1000 * millis) / this.durationMillis) / 10;
  }
}

function formatJsPath(path: any) {
  const jsPath = path
    .map((x, i) => {
      if (i === 0 && typeof x === 'number') {
        return 'prev';
      }
      if (Array.isArray(x)) {
        if (x[0] === DomEnv.getAttachedStateFnName) return;
        return `${x[0]}(${x.slice(1).map(y => JSON.stringify(y))})`;
      }
      return x;
    })
    .filter(Boolean);

  if (!jsPath.length) return `${path.map(JSON.stringify)}`;

  return `${jsPath.join('.')}`;
}

function formatCommand(command: ICommandMeta) {
  if (!command.args) {
    return `${command.name}()`;
  }
  const args = JSON.parse(command.args);
  if (command.name === 'execJsPath') {
    return formatJsPath(args[0]);
  }
  if (command.name === 'interact') {
    const interacts = args[0].map((x: IInteractionGroup) => {
      return x
        .map(y => {
          const extras: any = {};
          for (const [key, value] of Object.entries(y)) {
            if (
              key === 'mouseSteps' ||
              key === 'mouseButton' ||
              key === 'keyboardDelayBetween' ||
              key === 'delayMillis'
            ) {
              extras[key] = value;
            }
          }
          let pathString = '';
          const path = y.mousePosition ?? y.delayElement ?? y.delayNode;
          if (path) {
            // mouse path
            if (path.length === 2 && typeof path[0] === 'number' && typeof path[1] === 'number') {
              pathString = path.join(',');
            } else {
              pathString = formatJsPath(path);
            }
          } else if (y.keyboardCommands) {
            pathString = y.keyboardCommands
              .map(keys => {
                const [keyCommand] = Object.keys(keys);
                if (keyCommand === 'string') return `"${keys[keyCommand]}"`;

                const keyChar = getKeyboardChar(keys[keyCommand]);
                if (keyCommand === 'keyPress') return `press: '${keyChar}'`;
                if (keyCommand === 'up') return `up: '${keyChar}'`;
                if (keyCommand === 'down') return `down: '${keyChar}'`;
              })
              .join(', ');
          }

          const extrasString = Object.keys(extras).length
            ? `, ${JSON.stringify(extras, null, 2)}`
            : '';
          return `${y.command}( ${pathString}${extrasString} )`;
        })
        .join(', ');
    });
    return interacts.join(';\n');
  }
  if (command.name === 'waitForElement') {
    return `waitForElement( ${formatJsPath(args[0])} )`;
  }

  return `${command.name}(${args.map(JSON.stringify)})`;
}

function last<T>(arr: T[]): T {
  if (arr && arr.length) return arr[arr.length - 1];
  return null;
}

export interface IDomChangeGroup {
  timestamp: string;
  commandId: number;
  changes: IDomChangeRecord[];
}

export interface IPaintEvent {
  timestamp: string;
  commandId: number;
  changeEvents: IDomChangeEvent[];
}

export interface IMajorTick {
  type: 'command' | 'load';
  commandId: number;
  timestamp: Date;
  playbarOffsetPercent: number;
  durationMs: number;
  label: string;
  minorTicks: IMinorTick[];
}

export interface IMinorTick {
  type: 'paint' | 'mouse' | 'page' | 'scroll' | 'focus';
  paintEventIdx?: number;
  pageIdx?: number;
  mouseEventIdx?: number;
  focusEventIdx?: number;
  scrollEventIdx?: number;
  playbarOffsetPercent: number;
  timestamp: Date;
}

export interface ICommandResult {
  commandId: number;
  duration: number;
  isError: boolean;
  result: any;
  resultNodeIds?: number[];
  resultNodeType?: string;
  failedJsPathStepIndex?: number;
  failedJsPathStep?: string;
}
