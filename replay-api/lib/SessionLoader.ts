import { URL } from 'url';
import SessionDb from '@secret-agent/shared-session-state/lib/SessionDb';
import ICommandMeta from '@secret-agent/core-interfaces/ICommandMeta';
import DomChangesTable, {
  IDomChangeRecord,
} from '@secret-agent/shared-session-state/models/DomChangesTable';
import { IPageRecord } from '@secret-agent/shared-session-state/models/PagesTable';
import { ISessionRecord } from '@secret-agent/shared-session-state/models/SessionTable';
import { IDomChangeEvent } from '@secret-agent/injected-scripts/interfaces/IDomChangeEvent';

export default class SessionLoader {
  public ticks: IMajorTick[] = [];
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
        label: command.name,
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
