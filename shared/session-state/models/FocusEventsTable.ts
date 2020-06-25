import { Database as SqliteDatabase } from 'better-sqlite3';
import BaseTable from '../lib/BaseTable';
import { IFocusEvent } from '../page-scripts/interfaces/IFocusEvent';

export default class FocusEventsTable extends BaseTable<IFocusRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'FocusEvents',
      [
        ['event', 'INTEGER'],
        ['commandId', 'INTEGER'],
        ['targetNodeId', 'INTEGER'],
        ['relatedTargetNodeId', 'INTEGER'],
        ['timestamp', 'TEXT'],
      ],
      true,
    );
  }

  public insert(focusEvent: IFocusEvent) {
    const [commandId, type, targetNodeId, relatedTargetNodeId, timestamp] = focusEvent;
    const record = [
      type === 'in' ? FocusEventType.IN : FocusEventType.OUT,
      commandId,
      targetNodeId,
      relatedTargetNodeId,
      timestamp,
    ];
    this.pendingInserts.push(record);
  }

  public all() {
    return this.db.prepare(`select * from ${this.tableName}`).all() as IFocusRecord[];
  }
}

export interface IFocusRecord {
  event: FocusEventType;
  commandId: number;
  targetNodeId?: number;
  relatedTargetNodeId?: number;
  timestamp: string;
}

export enum FocusEventType {
  IN = 0,
  OUT = 1,
}
