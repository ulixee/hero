import * as Database from 'better-sqlite3';
import { Database as SqliteDatabase } from 'better-sqlite3';
import * as fs from 'fs';
import SessionsTable from '../models/SessionsTable';
import Core from '../index';
import Session from '../lib/Session';

interface IDbOptions {
  readonly?: boolean;
  fileMustExist?: boolean;
}

export default class SessionsDb {
  private static instance: SessionsDb;
  private static hasInitialized = false;
  public readonly sessions: SessionsTable;
  public readonly readonly: boolean;
  private db: SqliteDatabase;

  constructor(dbOptions: IDbOptions = {}) {
    SessionsDb.createDir();
    const { readonly = false, fileMustExist = false } = dbOptions;
    this.db = new Database(SessionsDb.databasePath, { readonly, fileMustExist });
    this.readonly = readonly;
    this.sessions = new SessionsTable(this.db);
  }

  public findLatestSessionId(script: {
    sessionName?: string;
    scriptInstanceId?: string;
    scriptEntrypoint?: string;
  }): string {
    const { sessionName, scriptEntrypoint, scriptInstanceId } = script;
    if (sessionName && scriptInstanceId) {
      // find default session if current not available
      const sessionRecord =
        this.sessions.findByName(sessionName, scriptInstanceId) ??
        this.sessions.findByName('default-session', scriptInstanceId);
      return sessionRecord?.id;
    }
    if (scriptEntrypoint) {
      const sessionRecords = this.sessions.findByScriptEntrypoint(scriptEntrypoint);
      if (!sessionRecords.length) return undefined;
      return sessionRecords[0].id;
    }
  }

  public findRelatedSessions(session: {
    scriptEntrypoint: string;
    scriptInstanceId: string;
  }): ISessionsFindRelatedResult {
    const otherSessions = this.sessions.findByScriptEntrypoint(session.scriptEntrypoint);
    const relatedScriptInstances: {
      id: string;
      startDate: number;
      defaultSessionId: string;
    }[] = [];
    const relatedSessions: { id: string; name: string }[] = [];
    const scriptDates = new Set<string>();
    for (const otherSession of otherSessions) {
      const key = `${otherSession.scriptInstanceId}_${otherSession.scriptStartDate}`;
      if (!scriptDates.has(key)) {
        relatedScriptInstances.push({
          id: otherSession.scriptInstanceId,
          startDate: new Date(otherSession.scriptStartDate).getTime(),
          defaultSessionId: otherSession.id,
        });
      }
      if (otherSession.scriptInstanceId === session.scriptInstanceId) {
        relatedSessions.unshift({ id: otherSession.id, name: otherSession.name });
      }
      scriptDates.add(key);
    }
    return {
      relatedSessions,
      relatedScriptInstances,
    };
  }

  public recordSession(session: Session): void {
    if (!session.options?.scriptInstanceMeta) return;
    this.sessions.insert(session);
  }

  public close(): void {
    if (this.db) {
      this.db.close();
    }
    this.db = null;
    SessionsDb.instance = undefined;
  }

  public static shutdown(): void {
    this.instance?.close();
    this.instance = undefined;
  }

  public static find(): SessionsDb {
    this.instance = this.instance || new SessionsDb();
    return this.instance;
  }

  public static createDir(): void {
    if (!this.hasInitialized) {
      fs.mkdirSync(this.databaseDir, { recursive: true });
      this.hasInitialized = true;
    }
  }

  public static get databaseDir(): string {
    return `${Core.dataDir}`;
  }

  public static get databasePath(): string {
    return `${this.databaseDir}/hero-sessions.db`;
  }
}

export interface ISessionsFindRelatedResult {
  relatedSessions: { id: string; name: string }[];
  relatedScriptInstances: { id: string; startDate: number; defaultSessionId: string }[];
}
