import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@secret-agent/commons/SqliteTable';
import { IFocusEvent } from '@secret-agent/core-interfaces/IFocusEvent';

export default class FocusEventsTable extends SqliteTable<IFocusRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'FocusEvents', [
      ['tabId', 'INTEGER'],
      ['event', 'INTEGER'],
      ['targetNodeId', 'INTEGER'],
      ['relatedTargetNodeId', 'INTEGER'],
      ['timestamp', 'INTEGER'],
    ]);
  }

  public insert(tabId: number, commandId: number, focusEvent: IFocusEvent) {
    const [type, targetNodeId, relatedTargetNodeId, timestamp] = focusEvent;
    const record = [
      tabId,
      type === 'in' ? FocusEventType.IN : FocusEventType.OUT,
      targetNodeId,
      relatedTargetNodeId,
      timestamp,
    ];
    this.queuePendingInsert(record);
  }
}

export interface IFocusRecord {
  tabId: number;
  event: FocusEventType;
  targetNodeId?: number;
  relatedTargetNodeId?: number;
  timestamp: number;
}

export enum FocusEventType {
  IN = 0,
  OUT = 1,
}
