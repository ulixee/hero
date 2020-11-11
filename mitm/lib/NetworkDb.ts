import Database, { Database as SqliteDatabase, Transaction } from 'better-sqlite3';
import SqliteTable from '@secret-agent/commons/SqliteTable';
import Log from '@secret-agent/commons/Logger';
import CertificatesTable from '../models/CommandsTable';
import PkiTable from '../models/PkiTable';

const { log } = Log(module);

export default class NetworkDb {
  public readonly certificates: CertificatesTable;
  public readonly pki: PkiTable;
  private db: SqliteDatabase;
  private readonly batchInsert: Transaction;
  private readonly saveInterval: NodeJS.Timeout;
  private readonly tables: SqliteTable<any>[] = [];

  constructor(baseDir: string) {
    this.db = new Database(`${baseDir}/network.db`);
    this.certificates = new CertificatesTable(this.db);
    this.pki = new PkiTable(this.db);
    this.saveInterval = setInterval(this.flush.bind(this), 5e3).unref();

    this.tables = [this.certificates, this.pki];

    this.batchInsert = this.db.transaction(() => {
      for (const table of this.tables) {
        try {
          table.flush();
        } catch (error) {
          log.error('NetworkDb.flushError', {
            sessionId: null,
            error,
            table: table.tableName,
          });
        }
      }
    });
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
    this.batchInsert.immediate();
  }
}
