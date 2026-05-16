import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
export default class SocketsTable extends SqliteTable<ISocketRecord> {
    constructor(db: SqliteDatabase);
    insert(record: ISocketRecord): void;
}
export interface ISocketRecord {
    id: number;
    localAddress: string;
    remoteAddress: string;
    dnsResolvedIp: string;
    alpn: string;
    serverName: string;
    createTime: Date;
    dnsLookupTime: Date;
    ipcConnectionTime: Date;
    connectTime: Date;
    bytesRead: number;
    bytesWritten: number;
    errorTime: Date;
    closeTime: Date;
    connectError?: string;
}
