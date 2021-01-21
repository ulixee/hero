import { Database as SqliteDatabase, Statement } from 'better-sqlite3';
import SqliteTable from '@secret-agent/commons/SqliteTable';

export default class CertificatesTable extends SqliteTable<ICertificateRecord> {
  private readonly getQuery: Statement;
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'Certificates',
      [
        ['host', 'TEXT', 'NOT NULL PRIMARY KEY'],
        ['pem', 'TEXT'],
        ['beginDate', 'TEXT'],
        ['expireDate', 'TEXT'],
      ],
      true,
    );
    this.getQuery = db.prepare(`select * from ${this.tableName} where host = ? limit 1`);
  }

  public insert(record: ICertificateRecord): void {
    const { host, pem, beginDate, expireDate } = record;
    this.queuePendingInsert([host, pem, beginDate.toISOString(), expireDate.toISOString()]);
  }

  public get(host: string): ICertificateRecord {
    const record = this.getQuery.get(host) as ICertificateRecord;
    if (!record) return record;
    record.beginDate = new Date(record.beginDate);
    record.expireDate = new Date(record.expireDate);
    return record;
  }
}

export interface ICertificateRecord {
  host: string;
  pem: string;
  beginDate: Date;
  expireDate: Date;
}
