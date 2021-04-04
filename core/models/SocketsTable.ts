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
        ['pid', 'INTEGER'],
        ['dialTime', 'INTEGER'],
        ['connectTime', 'INTEGER'],
        ['closeTime', 'INTEGER'],
      ],
      true,
    );
  }

  public insert(
    record: Omit<ISocketRecord, 'dialTime' | 'connectTime' | 'closeTime'> & {
      closeTime: Date;
      connectTime: Date;
      dialTime: Date;
    },
  ) {
    const {
      id,
      localAddress,
      remoteAddress,
      serverName,
      pid,
      alpn,
      dialTime,
      connectTime,
      closeTime,
    } = record;
    return this.queuePendingInsert([
      id,
      alpn,
      serverName,
      localAddress,
      remoteAddress,
      pid,
      dialTime?.getTime(),
      connectTime?.getTime(),
      closeTime?.getTime(),
    ]);
  }
}

export interface ISocketRecord {
  id: number;
  localAddress: string;
  remoteAddress: string;
  pid: number;
  alpn: string;
  serverName: string;
  dialTime: number;
  connectTime: number;
  closeTime: number;
}
