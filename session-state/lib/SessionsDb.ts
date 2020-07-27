import Database, { Database as SqliteDatabase, Transaction } from 'better-sqlite3';
import BaseTable from './BaseTable';
import SessionsTable from '../models/SessionsTable';

interface IDbOptions {
  readonly?: boolean;
  fileMustExist?: boolean;
}

export default class SessionsDb {
  private static dbByBaseDir: { [dir: string]: SessionsDb } = {};
  public readonly sessions: SessionsTable;
  public readonly readonly: boolean;
  private db: SqliteDatabase;

  constructor(baseDir: string, dbOptions: IDbOptions = {}) {
    const { readonly = false, fileMustExist = false } = dbOptions;

    this.db = new Database(`${baseDir}/sessions.db`, { readonly, fileMustExist });
    this.readonly = readonly;
    this.sessions = new SessionsTable(this.db);
  }

  public close() {
    if (this.db) {
      this.db.close();
    }
    this.db = null;
  }

  public static shutdown() {
    for (const [key, db] of Object.entries(SessionsDb.dbByBaseDir)) {
      db.close();
      delete SessionsDb.dbByBaseDir[key];
    }
  }

  public static find(baseDir: string) {
    if (!this.dbByBaseDir[baseDir]) {
      this.dbByBaseDir[baseDir] = new SessionsDb(baseDir);
    }
    return this.dbByBaseDir[baseDir];
  }
}
