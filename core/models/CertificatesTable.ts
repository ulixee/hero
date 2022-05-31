import { Database as SqliteDatabase, Statement } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';

export default class CertificatesTable extends SqliteTable<ICertificateRecord> {
  private readonly getQuery: Statement;
  private pemByHost = new Map<string, ICertificateRecord>();
  constructor(db: SqliteDatabase) {
    super(
      db,
      'CertificatesV3',
      [
        ['host', 'TEXT', 'NOT NULL PRIMARY KEY'],
        ['key', 'BLOB'],
        ['pem', 'BLOB'],
        ['expireDate', 'INTEGER'],
      ],
      true,
    );
    this.getQuery = db.prepare(`select * from ${this.tableName} where host = ? limit 1`);
  }

  public save(record: ICertificateRecord): void {
    const { host, key, pem, expireDate } = record;
    this.pemByHost.set(host, record);
    this.queuePendingInsert([host, key, pem, expireDate]);
  }

  public get(host: string): ICertificateRecord {
    if (this.pemByHost.has(host)) return this.pemByHost.get(host);

    const record = this.getQuery.get(host) as ICertificateRecord;
    if (!record) {
      return null;
    }
    const millisUntilExpire = record.expireDate - Date.now();
    if (millisUntilExpire < 60 * 60e3) {
      return null;
    }

    this.pemByHost.set(host, record);
    return record;
  }
}

export interface ICertificateRecord {
  host: string;
  key: Buffer;
  pem: Buffer;
  expireDate: number;
}
