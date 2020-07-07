import Database, { Database as SqliteDatabase, Transaction } from 'better-sqlite3';
import ResourcesTable from '../models/ResourcesTable';
import DomChangesTable from '../models/DomChangesTable';
import CommandsTable from '../models/CommandsTable';
import WebsocketMessagesTable from '../models/WebsocketMessagesTable';
import PagesTable from '../models/PagesTable';
import FramesTable from '../models/FramesTable';
import LogsTable from '../models/LogsTable';
import BaseTable from './BaseTable';
import SessionTable from '../models/SessionTable';
import MouseEventsTable from '../models/MouseEventsTable';
import FocusEventsTable from '../models/FocusEventsTable';
import ScrollEventsTable from '../models/ScrollEventsTable';

interface IDbOptions {
  readonly?: boolean;
  fileMustExist?: boolean;
}

export default class SessionDb {
  public readonly readonly: boolean;
  public readonly commands: CommandsTable;
  public readonly frames: FramesTable;
  public readonly pages: PagesTable;
  public readonly resources: ResourcesTable;
  public readonly websocketMessages: WebsocketMessagesTable;
  public readonly domChanges: DomChangesTable;
  public readonly logs: LogsTable;
  public readonly session: SessionTable;
  public readonly mouseEvents: MouseEventsTable;
  public readonly focusEvents: FocusEventsTable;
  public readonly scrollEvents: ScrollEventsTable;

  private readonly batchInsert?: Transaction;
  private readonly saveInterval: NodeJS.Timeout;

  private db: SqliteDatabase;
  private readonly tables: BaseTable<any>[] = [];

  constructor(baseDir: string, id: string, dbOptions: IDbOptions = {}) {
    const { readonly = false, fileMustExist = false } = dbOptions;

    this.db = new Database(`${baseDir}/${id}.db`, { readonly, fileMustExist });
    this.saveInterval = setInterval(this.flush.bind(this), 5e3).unref();
    this.readonly = readonly;

    this.commands = new CommandsTable(this.db);
    this.frames = new FramesTable(this.db);
    this.pages = new PagesTable(this.db);
    this.resources = new ResourcesTable(this.db);
    this.websocketMessages = new WebsocketMessagesTable(this.db);
    this.domChanges = new DomChangesTable(this.db);
    this.logs = new LogsTable(this.db);
    this.session = new SessionTable(this.db);
    this.mouseEvents = new MouseEventsTable(this.db);
    this.focusEvents = new FocusEventsTable(this.db);
    this.scrollEvents = new ScrollEventsTable(this.db);

    this.tables.push(
      this.commands,
      this.frames,
      this.pages,
      this.resources,
      this.websocketMessages,
      this.domChanges,
      this.logs,
      this.session,
      this.mouseEvents,
      this.focusEvents,
      this.scrollEvents,
    );

    if (!readonly) {
      this.batchInsert = this.db.transaction(() => {
        for (const table of this.tables) {
          table.flush();
        }
      });
    }
  }

  public getDomChanges(frameIds: string[], sinceCommandId: number) {
    this.flush();

    return this.domChanges.getFrameChanges(frameIds, sinceCommandId);
  }

  public getResourceData(resourceId: number) {
    if (this.resources.hasPending()) {
      this.flush();
    }

    return this.resources.getResourceBodyById(resourceId);
  }

  public close() {
    if (this.db) {
      clearInterval(this.saveInterval);
      this.flush();
      this.db.close();
    }
    this.db = null;
  }

  public flush() {
    if (this.batchInsert) this.batchInsert.immediate();
  }
}
