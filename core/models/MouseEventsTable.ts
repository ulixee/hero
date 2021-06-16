import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@secret-agent/commons/SqliteTable';
import { IMouseEvent } from '@secret-agent/interfaces/IMouseEvent';

export default class MouseEventsTable extends SqliteTable<IMouseEventRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'MouseEvents', [
      ['tabId', 'INTEGER'],
      ['event', 'INTEGER'],
      ['commandId', 'INTEGER'],
      ['pageX', 'INTEGER'],
      ['pageY', 'INTEGER'],
      ['offsetX', 'INTEGER'],
      ['offsetY', 'INTEGER'],
      ['buttons', 'INTEGER'],
      ['targetNodeId', 'INTEGER'],
      ['relatedTargetNodeId', 'INTEGER'],
      ['timestamp', 'INTEGER'],
    ]);
  }

  public insert(tabId: number, commandId: number, mouseEvent: IMouseEvent) {
    const [
      event,
      pageX,
      pageY,
      offsetX,
      offsetY,
      buttons,
      targetNodeId,
      relatedTargetNodeId,
      timestamp,
    ] = mouseEvent;
    const record = [
      tabId,
      event,
      commandId,
      pageX,
      pageY,
      offsetX,
      offsetY,
      buttons,
      targetNodeId,
      relatedTargetNodeId,
      timestamp,
    ];
    this.queuePendingInsert(record);
  }
}

export interface IMouseEventRecord {
  tabId: number;
  event: MouseEventType;
  commandId: number;
  pageX: number;
  pageY: number;
  offsetX: number;
  offsetY: number;
  buttons: number;
  targetNodeId?: number;
  relatedTargetNodeId?: number;
  timestamp: number;
}

export enum MouseEventType {
  MOVE = 0,
  DOWN = 1,
  UP = 2,
  OVER = 3,
  OUT = 4,
}
