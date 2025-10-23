import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
export default class CertificatesTable extends SqliteTable<ICertificateRecord> {
    private readonly getQuery;
    private pemByHost;
    constructor(db: SqliteDatabase);
    save(record: ICertificateRecord): void;
    get(host: string): ICertificateRecord;
}
export interface ICertificateRecord {
    host: string;
    key: Buffer;
    pem: Buffer;
    expireDate: number;
}
