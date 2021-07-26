import * as Database from 'better-sqlite3';
import { Database as SqliteDatabase, Transaction } from 'better-sqlite3';
import * as Path from 'path';
import Log from '@ulixee/commons/lib/Logger';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import ResourcesTable from '../models/ResourcesTable';
import DomChangesTable from '../models/DomChangesTable';
import CommandsTable from '../models/CommandsTable';
import WebsocketMessagesTable from '../models/WebsocketMessagesTable';
import FrameNavigationsTable from '../models/FrameNavigationsTable';
import FramesTable from '../models/FramesTable';
import PageLogsTable from '../models/PageLogsTable';
import SessionTable from '../models/SessionTable';
import MouseEventsTable from '../models/MouseEventsTable';
import FocusEventsTable from '../models/FocusEventsTable';
import ScrollEventsTable from '../models/ScrollEventsTable';
import SessionLogsTable from '../models/SessionLogsTable';
import SessionsDb from './SessionsDb';
import SessionState from '../lib/SessionState';
import DevtoolsMessagesTable from '../models/DevtoolsMessagesTable';
import TabsTable from '../models/TabsTable';
import ResourceStatesTable from '../models/ResourceStatesTable';
import SocketsTable from '../models/SocketsTable';

const { log } = Log(module);

interface IDbOptions {
  readonly?: boolean;
  fileMustExist?: boolean;
}

export default class SessionDb {
  private static byId = new Map<string, SessionDb>();

  public get readonly() {
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

  constructor(baseDir: string, id: string, dbOptions: IDbOptions = {}) {
    const { readonly = false, fileMustExist = false } = dbOptions;
    this.sessionId = id;
    this.db = new Database(`${baseDir}/${id}.db`, { readonly, fileMustExist });
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

  public close() {
    clearInterval(this.saveInterval);
    if (this.db) {
      this.flush();
      this.db.close();
    }
    this.db = null;
  }

  public flush() {
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

  public unsubscribeToChanges() {
    for (const table of this.tables) table.unsubscribe();
  }

  public static getCached(sessionId: string, basePath: string, fileMustExist = false) {
    if (!this.byId.get(sessionId)?.db?.open) {
      this.byId.set(
        sessionId,
        new SessionDb(basePath, sessionId, {
          readonly: true,
          fileMustExist,
        }),
      );
    }
    return this.byId.get(sessionId);
  }

  public static findWithRelated(scriptArgs: ISessionLookupArgs): ISessionLookup {
    let { dataLocation, sessionId } = scriptArgs;

    const ext = Path.extname(dataLocation);
    if (ext === '.db') {
      sessionId = Path.basename(dataLocation, ext);
      dataLocation = Path.dirname(dataLocation);
    }

    // NOTE: don't close db - it's from a shared cache
    const sessionsDb = SessionsDb.find(dataLocation);
    if (!sessionId) {
      sessionId = sessionsDb.findLatestSessionId(scriptArgs);
      if (!sessionId) return null;
    }

    const activeSession = SessionState.registry.get(sessionId);

    const sessionDb = activeSession?.db ?? this.getCached(sessionId, dataLocation, true);

    const session = sessionDb.session.get();
    const related = sessionsDb.findRelatedSessions(session);

    return {
      ...related,
      dataLocation,
      sessionDb,
      sessionState: activeSession,
    };
  }
}

export interface ISessionLookup {
  sessionDb: SessionDb;
  dataLocation: string;
  sessionState: SessionState;
  relatedSessions: { id: string; name: string }[];
  relatedScriptInstances: { id: string; startDate: number; defaultSessionId: string }[];
}

export interface ISessionLookupArgs {
  scriptInstanceId: string;
  sessionName: string;
  scriptEntrypoint: string;
  dataLocation: string;
  sessionId: string;
}
