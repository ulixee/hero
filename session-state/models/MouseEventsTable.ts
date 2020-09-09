import { Database as SqliteDatabase } from 'better-sqlite3';
import { IMouseEvent } from '@secret-agent/injected-scripts/interfaces/IMouseEvent';
import BaseTable from '../lib/BaseTable';

export default class MouseEventsTable extends BaseTable<IMouseEventRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'MouseEvents', [
      ['tabId', 'TEXT'],
      ['event', 'INTEGER'],
      ['commandId', 'INTEGER'],
      ['pageX', 'INTEGER'],
      ['pageY', 'INTEGER'],
      ['buttons', 'INTEGER'],
      ['targetNodeId', 'INTEGER'],
      ['relatedTargetNodeId', 'INTEGER'],
      ['timestamp', 'TEXT'],
    ]);
  }

  public insert(tabId: string, mouseEvent: IMouseEvent) {
    const [
      commandId,
      event,
      pageX,
      pageY,
      buttons,
      targetNodeId,
      relatedTargetNodeId,
      isoTimestamp,
    ] = mouseEvent;
    const record = [
      tabId,
      event,
      commandId,
      pageX,
      pageY,
      buttons,
      targetNodeId,
      relatedTargetNodeId,
      isoTimestamp,
    ];
    this.queuePendingInsert(record);
  }
}

export interface IMouseEventRecord {
  tabId: string;
  event: MouseEventType;
  commandId: number;
  pageX: number;
  pageY: number;
  buttons: number;
  targetNodeId?: number;
  relatedTargetNodeId?: number;
  timestamp: string;
}

export enum MouseEventType {
  MOVE = 0,
  DOWN = 1,
  UP = 2,
  OVER = 3,
  OUT = 4,
}
