import { Database as SqliteDatabase, Statement } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/SqliteTable';

export default class CertificatesTable extends SqliteTable<ICertificateRecord> {
  private readonly getQuery: Statement;
  private pemByHost = new Map<string, ICertificateRecord>();
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'CertificatesV2',
      [
        ['host', 'TEXT', 'NOT NULL PRIMARY KEY'],
        ['pem', 'TEXT'],
        ['expireDate', 'INTEGER'],
      ],
      true,
    );
    this.getQuery = db.prepare(`select * from ${this.tableName} where host = ? limit 1`);
  }

  public insert(record: ICertificateRecord): void {
    const { host, pem, expireDate } = record;
    this.pemByHost.set(host, record);
    this.queuePendingInsert([host, pem, expireDate.getTime()]);
  }

  public get(host: string): ICertificateRecord {
    if (this.pemByHost.has(host)) return this.pemByHost.get(host);

    const record = this.getQuery.get(host) as ICertificateRecord;
    if (!record) {
      return null;
    }
    const millisUntilExpire = (record.expireDate as any) - new Date().getTime();
    if (millisUntilExpire < 60 * 60e3) {
      return null;
    }

    record.expireDate = new Date(record.expireDate);
    this.pemByHost.set(host, record);
    return record;
  }
}

export interface ICertificateRecord {
  host: string;
  pem: string;
  expireDate: Date;
}
