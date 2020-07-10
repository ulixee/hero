import { URL } from 'url';
import SessionDb from '@secret-agent/session-state/lib/SessionDb';
import ICommandMeta from '@secret-agent/core-interfaces/ICommandMeta';
import DomChangesTable, {
  IDomChangeRecord,
} from '@secret-agent/session-state/models/DomChangesTable';
import { IPageRecord } from '@secret-agent/session-state/models/PagesTable';
import { ISessionRecord } from '@secret-agent/session-state/models/SessionTable';
import { IDomChangeEvent } from '@secret-agent/injected-scripts/interfaces/IDomChangeEvent';
import { IJsPath } from '@secret-agent/injected-scripts/scripts/jsPath';
import DomEnv from '@secret-agent/core/lib/DomEnv';

export default class SessionLoader {
  public ticks: IMajorTick[] = [];
  public readonly commandResults: ICommandResult[] = [];
  private readonly sessionDb: SessionDb;

  private readonly pageRecords: IPageRecord[];
  private readonly commands: ICommandMeta[];
  private readonly session: ISessionRecord;

  private readonly domChangeGroups: IDomChangeGroup[] = [];
  private originTime: Date;
  private closeTime: Date;

  private readonly playbarMillis: number;

  constructor(sessionDb: SessionDb) {
    this.sessionDb = sessionDb;
    this.pageRecords = this.sessionDb.pages.all();
    this.commands = this.sessionDb.commands.all();
    this.session = this.sessionDb.session.get();

    this.originTime = new Date(this.session.startDate);
    this.closeTime = new Date(this.session.closeDate);
    this.playbarMillis = this.closeTime.getTime() - this.originTime.getTime();

    this.assembleDomChangeGroups();
    this.assembleTicks();
    this.assembleCommandResults();
  }

  public fetchPaintEventsSlice(fromPaintEventIdx: number, toPaintEventIdx?: number) {
    const domChangeGroups = this.domChangeGroups.slice(fromPaintEventIdx, toPaintEventIdx);
    const paintEvents: IPaintEvent[] = [];
    for (const domChangeGroup of domChangeGroups) {
      paintEvents.push({
        timestamp: domChangeGroup.timestamp,
        commandId: domChangeGroup.commandId,
        urlOrigin: domChangeGroup.urlOrigin,
        changeEvents: domChangeGroup.changes.map(x => DomChangesTable.toDomChangeEvent(x)),
      });
    }
    return paintEvents;
  }

  public fetchCommands() {
    return this.commands;
  }

  public async fetchResource(url: string, commandId: string) {
    return await this.sessionDb.resources.getResourceByUrl(url);
  }

  public getCommand(tickId: number) {
    return this.commands.find(x => x.id === tickId);
  }

  public get pages() {
    return this.pageRecords.map(x => ({
      id: x.id,
      url: x.finalUrl ?? x.requestedUrl,
    }));
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
    const domChanges = this.sessionDb.domChanges.all();
    const pagesByFrameId: { [k: string]: IPageRecord } = {};
    this.pageRecords.forEach(page => {
      pagesByFrameId[page.frameId] = page;
    });

    let domChangeGroup: IDomChangeGroup = null;
    for (const change of domChanges) {
      if (
        domChangeGroup?.timestamp !== change.timestamp ||
        domChangeGroup?.commandId !== change.commandId
      ) {
        const page = pagesByFrameId[change.frameId];
        const url = new URL(page.finalUrl ?? page.requestedUrl);
        domChangeGroup = {
          timestamp: change.timestamp,
          commandId: change.commandId,
          urlOrigin: url.origin,
          changes: [],
        };
        this.domChangeGroups.push(domChangeGroup);
      }
      domChangeGroup.changes.push(change);
    }
  }

  private assembleTicks() {
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
      for (let i = 0; i < this.pageRecords.length; i += 1) {
        const page = this.pageRecords[i];
        if (page.startCommandId === command.id) {
          majorTick.minorTicks.push();
          const timestamp = new Date(page.initiatedTime);
          majorTick.minorTicks.push({
            type: 'page',
            pageIdx: i,
            playbarOffsetPercent: this.getPlaybarOffset(timestamp),
            timestamp,
          });
        }

        majorTick.minorTicks.sort((a, b) => {
          return a.playbarOffsetPercent - b.playbarOffsetPercent;
        });
      }
    }
  }

  private getPlaybarOffset(timestamp: Date) {
    const millis = timestamp.getTime() - this.originTime.getTime();
    return Math.floor((1000 * millis) / this.playbarMillis) / 10;
  }
}

function formatCommand(command: ICommandMeta) {
  if (!command.args) {
    return `${command.name}()`;
  }
  const args = JSON.parse(command.args);
  if (command.name === 'execJsPath') {
    const jsPath = (args[0] as IJsPath)
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

    if (!jsPath.length) return `${args.map(JSON.stringify)}`;

    return `${jsPath.join('.')}`;
  }
  return `${command.name}(${args.map(JSON.stringify)})`;
}

export interface IDomChangeGroup {
  timestamp: string;
  commandId: number;
  urlOrigin: string;
  changes: IDomChangeRecord[];
}

export interface IPaintEvent {
  timestamp: string;
  commandId: number;
  urlOrigin: string;
  changeEvents: IDomChangeEvent[];
}

export interface IMajorTick {
  type: 'command';
  commandId: number;
  timestamp: Date;
  playbarOffsetPercent: number;
  durationMs: number;
  label: string;
  minorTicks: IMinorTick[];
}

export interface IMinorTick {
  type: 'paint' | 'mouse' | 'page';
  paintEventIdx?: number;
  pageIdx?: number;
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
