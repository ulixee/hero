import * as Database from 'better-sqlite3';
import { Database as SqliteDatabase, Transaction } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import Log from '@ulixee/commons/lib/Logger';
import * as fs from 'fs';
import CertificatesTable from '../models/CertificatesTable';
import Core from '../index';

const { log } = Log(module);

export default class NetworkDb {
  private static hasInitialized = false;
  public readonly certificates: CertificatesTable;
  private db: SqliteDatabase;
  private readonly batchInsert: Transaction;
  private readonly saveInterval: NodeJS.Timeout;
  private readonly tables: SqliteTable<any>[] = [];

  constructor() {
    NetworkDb.createDir();
    this.db = new Database(NetworkDb.databasePath);
    this.certificates = new CertificatesTable(this.db);
    this.saveInterval = setInterval(this.flush.bind(this), 5e3).unref();

    this.tables = [this.certificates];

    this.batchInsert = this.db.transaction(() => {
      for (const table of this.tables) {
        try {
          table.runPendingInserts();
        } catch (error) {
          if (
            String(error).match(/attempt to write a readonly database/) ||
            String(error).match(/database is locked/)
          ) {
            clearInterval(this.saveInterval);
            this.db = null;
          }
          log.error('NetworkDb.flushError', {
            sessionId: null,
            error,
            table: table.tableName,
          });
        }
      }
    });
  }

  public close(): void {
    if (this.db) {
      clearInterval(this.saveInterval);
      this.flush();
      this.db.close();
    }
    this.db = null;
  }

  public flush(): void {
    if (!this.db || this.db.readonly) return;
    this.batchInsert.immediate();
  }

  public static createDir(): void {
    if (!this.hasInitialized) {
      fs.mkdirSync(this.databaseDir, { recursive: true });
      this.hasInitialized = true;
    }
  }

  public static get databaseDir(): string {
    return Core.dataDir;
  }

  public static get databasePath(): string {
    return `${this.databaseDir}/network.db`;
  }
}
