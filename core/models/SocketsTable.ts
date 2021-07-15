import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@secret-agent/commons/SqliteTable';

export default class SocketsTable extends SqliteTable<ISocketRecord> {
  constructor(readonly db: SqliteDatabase) {
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
        ['createTime', 'INTEGER'],
        ['dnsLookupTime', 'INTEGER'],
        ['ipcConnectionTime', 'INTEGER'],
        ['connectTime', 'INTEGER'],
        ['errorTime', 'INTEGER'],
        ['closeTime', 'INTEGER'],
        ['connectError', 'TEXT'],
      ],
      true,
    );
  }

  public insert(record: ISocketRecord) {
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
  errorTime: Date;
  closeTime: Date;
  connectError?: string;
}
