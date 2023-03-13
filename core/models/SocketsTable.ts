import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';

export default class SocketsTable extends SqliteTable<ISocketRecord> {
  constructor(db: SqliteDatabase) {
    super(
      db,
      'Sockets',
      [
        ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
        ['alpn', 'TEXT'],
        ['serverName', 'TEXT'],
        ['localAddress', 'TEXT'],
        ['remoteAddress', 'TEXT'],
        ['dnsResolvedIp', 'TEXT'],
        ['createTime', 'DATETIME'],
        ['dnsLookupTime', 'DATETIME'],
        ['ipcConnectionTime', 'DATETIME'],
        ['connectTime', 'DATETIME'],
        ['bytesRead', 'INTEGER'],
        ['bytesWritten', 'INTEGER'],
        ['errorTime', 'DATETIME'],
        ['closeTime', 'DATETIME'],
        ['connectError', 'TEXT'],
      ],
      true,
    );
  }

  public insert(record: ISocketRecord): void {
    const {
      id,
      localAddress,
      remoteAddress,
      serverName,
      alpn,
      createTime,
      dnsLookupTime,
      ipcConnectionTime,
      dnsResolvedIp,
      connectTime,
      bytesRead,
      bytesWritten,
      errorTime,
      connectError,
      closeTime,
    } = record;
    return this.queuePendingInsert([
      id,
      alpn,
      serverName,
      localAddress,
      remoteAddress,
      dnsResolvedIp,
      createTime?.getTime(),
      dnsLookupTime?.getTime(),
      ipcConnectionTime?.getTime(),
      connectTime?.getTime(),
      bytesRead,
      bytesWritten,
      errorTime?.getTime(),
      closeTime?.getTime(),
      connectError,
    ]);
  }
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
