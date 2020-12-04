import { Database as SqliteDatabase, Statement } from 'better-sqlite3';
import SqliteTable from '@secret-agent/commons/SqliteTable';

export default class PkiTable extends SqliteTable<IPkiRecord> {
  private readonly getQuery: Statement;
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'Pki',
      [
        ['host', 'TEXT', 'NOT NULL PRIMARY KEY'],
        ['privateKey', 'TEXT'],
        ['publicKey', 'TEXT'],
        ['beginDate', 'TEXT'],
        ['expireDate', 'TEXT'],
      ],
      true,
    );
    this.getQuery = db.prepare(`select * from ${this.tableName} where host = ? limit 1`);
  }

  public insert(record: IPkiRecord): void {
    const { host, privateKey, publicKey, beginDate, expireDate } = record;
    this.queuePendingInsert([
      host,
      privateKey,
      publicKey,
      beginDate.toISOString(),
      expireDate.toISOString(),
    ]);
  }

  public get(host: string): IPkiRecord {
    const record = this.getQuery.get(host) as IPkiRecord;
    if (!record) return record;
    record.beginDate = new Date(record.beginDate);
    record.expireDate = new Date(record.expireDate);
    return record;
  }
}

export interface IPkiRecord {
  host: string;
  privateKey: string;
  publicKey: string;
  beginDate: Date;
  expireDate: Date;
}
