import * as Database from 'better-sqlite3';
import { Database as SqliteDatabase, Transaction } from 'better-sqlite3';
import Log from '@ulixee/commons/lib/Logger';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import ResourcesTable from '../models/ResourcesTable';
import DomChangesTable from '../models/DomChangesTable';
import CommandsTable from '../models/CommandsTable';
import WebsocketMessagesTable from '../models/WebsocketMessagesTable';
import FrameNavigationsTable from '../models/FrameNavigationsTable';
import FramesTable from '../models/FramesTable';
import PageLogsTable from '../models/PageLogsTable';
import SessionTable, { ISessionRecord } from '../models/SessionTable';
import MouseEventsTable from '../models/MouseEventsTable';
import FocusEventsTable from '../models/FocusEventsTable';
import ScrollEventsTable from '../models/ScrollEventsTable';
import SessionLogsTable from '../models/SessionLogsTable';
import SessionsDb from './SessionsDb';
import DevtoolsMessagesTable from '../models/DevtoolsMessagesTable';
import TabsTable from '../models/TabsTable';
import ResourceStatesTable from '../models/ResourceStatesTable';
import SocketsTable from '../models/SocketsTable';
import Core from '../index';

const { log } = Log(module);

interface IDbOptions {
  readonly?: boolean;
  fileMustExist?: boolean;
}

export default class SessionDb {
  private static byId = new Map<string, SessionDb>();

  public get readonly(): boolean {
    return this.db?.readonly;
  }

  public readonly commands: CommandsTable;
  public readonly frames: FramesTable;
  public readonly frameNavigations: FrameNavigationsTable;
  public readonly sockets: SocketsTable;
  public readonly resources: ResourcesTable;
  public readonly resourceStates: ResourceStatesTable;
  public readonly websocketMessages: WebsocketMessagesTable;
  public readonly domChanges: DomChangesTable;
  public readonly pageLogs: PageLogsTable;
  public readonly sessionLogs: SessionLogsTable;
  public readonly session: SessionTable;
  public readonly mouseEvents: MouseEventsTable;
  public readonly focusEvents: FocusEventsTable;
  public readonly scrollEvents: ScrollEventsTable;
  public readonly devtoolsMessages: DevtoolsMessagesTable;
  public readonly tabs: TabsTable;
  public readonly sessionId: string;

  private readonly batchInsert?: Transaction;
  private readonly saveInterval: NodeJS.Timeout;

  private db: SqliteDatabase;
  private readonly tables: SqliteTable<any>[] = [];

  constructor(sessionId: string, dbOptions: IDbOptions = {}) {
    const { readonly = false, fileMustExist = false } = dbOptions;
    this.sessionId = sessionId;
    this.db = new Database(`${SessionDb.databaseDir}/${sessionId}.db`, { readonly, fileMustExist });
    if (!readonly) {
      this.saveInterval = setInterval(this.flush.bind(this), 5e3).unref();
    }

    this.commands = new CommandsTable(this.db);
    this.tabs = new TabsTable(this.db);
    this.frames = new FramesTable(this.db);
    this.frameNavigations = new FrameNavigationsTable(this.db);
    this.sockets = new SocketsTable(this.db);
    this.resources = new ResourcesTable(this.db);
    this.resourceStates = new ResourceStatesTable(this.db);
    this.websocketMessages = new WebsocketMessagesTable(this.db);
    this.domChanges = new DomChangesTable(this.db);
    this.pageLogs = new PageLogsTable(this.db);
    this.session = new SessionTable(this.db);
    this.mouseEvents = new MouseEventsTable(this.db);
    this.focusEvents = new FocusEventsTable(this.db);
    this.scrollEvents = new ScrollEventsTable(this.db);
    this.sessionLogs = new SessionLogsTable(this.db);
    this.devtoolsMessages = new DevtoolsMessagesTable(this.db);

    this.tables.push(
      this.commands,
      this.tabs,
      this.frames,
      this.frameNavigations,
      this.sockets,
      this.resources,
      this.resourceStates,
      this.websocketMessages,
      this.domChanges,
      this.pageLogs,
      this.session,
      this.mouseEvents,
      this.focusEvents,
      this.scrollEvents,
      this.sessionLogs,
      this.devtoolsMessages,
    );

    if (!readonly) {
      this.batchInsert = this.db.transaction(() => {
        for (const table of this.tables) {
          try {
            table.runPendingInserts();
          } catch (error) {
            if (String(error).match('attempt to write a readonly database')) {
              clearInterval(this.saveInterval);
              this.db = null;
            }
            log.error('SessionDb.flushError', {
              sessionId: this.sessionId,
              error,
              table: table.tableName,
            });
          }
        }
      });
    }
  }

  public close(): void {
    clearInterval(this.saveInterval);
    if (this.db) {
      this.flush();
      this.db.close();
    }
    this.db = null;
  }

  public flush(): void {
    if (this.batchInsert) {
      try {
        this.batchInsert.immediate();
      } catch (error) {
        if (String(error).match(/attempt to write a readonly database/)) {
          clearInterval(this.saveInterval);
        }
        throw error;
      }
    }
  }

  public unsubscribeToChanges(): void {
    for (const table of this.tables) table.unsubscribe();
  }

  public static getCached(sessionId: string, fileMustExist = false): SessionDb {
    if (!this.byId.get(sessionId)?.db?.open) {
      this.byId.set(
        sessionId,
        new SessionDb(sessionId, {
          readonly: true,
          fileMustExist,
        }),
      );
    }
    return this.byId.get(sessionId);
  }

  public static find(scriptArgs: ISessionFindArgs): ISessionFindResult {
    let { sessionId } = scriptArgs;

    // NOTE: don't close db - it's from a shared cache
    const sessionsDb = SessionsDb.find();
    if (!sessionId) {
      sessionId = sessionsDb.findLatestSessionId(scriptArgs);
      if (!sessionId) return null;
    }

    const sessionDb = this.getCached(sessionId, true);

    const session = sessionDb.session.get();

    return {
      session,
    };
  }

  public static get databaseDir(): string {
    return `${Core.dataDir}/hero-sessions`;
  }
}

export interface ISessionFindResult {
  session: ISessionRecord;
}

export interface ISessionFindArgs {
  scriptInstanceId?: string;
  sessionName?: string;
  scriptEntrypoint?: string;
  sessionId?: string;
}
