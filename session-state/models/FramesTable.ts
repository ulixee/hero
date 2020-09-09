import { Database as SqliteDatabase } from 'better-sqlite3';
import BaseTable from '../lib/BaseTable';

export default class FramesTable extends BaseTable<IFrameRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'Frames', [
      ['id', 'TEXT', 'NOT NULL PRIMARY KEY'],
      ['tabId', 'TEXT'],
      ['startCommandId', 'INTEGER'],
      ['parentId', 'TEXT'],
      ['createdTime', 'TEXT'],
    ]);
  }

  public insert(frame: IFrameRecord) {
    return this.queuePendingInsert([
      frame.id,
      frame.tabId,
      frame.startCommandId,
      frame.parentId,
      frame.createdTime,
    ]);
  }
}

export interface IFrameRecord {
  id: string;
  tabId: string;
  startCommandId: number;
  parentId?: string; // if null, top level frame
  createdTime: string;
}
