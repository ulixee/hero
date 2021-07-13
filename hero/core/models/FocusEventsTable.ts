import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@secret-agent/commons/SqliteTable';
import { FocusEventType, IFocusEvent } from '@secret-agent/interfaces/IFocusEvent';

export default class FocusEventsTable extends SqliteTable<IFocusRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'FocusEvents', [
      ['tabId', 'INTEGER'],
      ['frameId', 'INTEGER'],
      ['event', 'INTEGER'],
      ['targetNodeId', 'INTEGER'],
      ['relatedTargetNodeId', 'INTEGER'],
      ['timestamp', 'INTEGER'],
    ]);
  }

  public insert(tabId: number, frameId: number, commandId: number, focusEvent: IFocusEvent) {
    const [type, targetNodeId, relatedTargetNodeId, timestamp] = focusEvent;
    const record = [tabId, frameId, type, targetNodeId, relatedTargetNodeId, timestamp];
    this.queuePendingInsert(record);
  }
}

export interface IFocusRecord {
  tabId: number;
  frameId: number;
  event: FocusEventType;
  targetNodeId?: number;
  relatedTargetNodeId?: number;
  timestamp: number;
}
