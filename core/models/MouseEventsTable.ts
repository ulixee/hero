import { Database as SqliteDatabase } from 'better-sqlite3';
import { IMouseEvent } from '@secret-agent/injected-scripts/interfaces/IMouseEvent';
import SqliteTable from '@secret-agent/commons/SqliteTable';

export default class MouseEventsTable extends SqliteTable<IMouseEventRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'MouseEvents', [
      ['tabId', 'TEXT'],
      ['event', 'INTEGER'],
      ['commandId', 'INTEGER'],
      ['pageX', 'INTEGER'],
      ['pageY', 'INTEGER'],
      ['offsetX', 'INTEGER'],
      ['offsetY', 'INTEGER'],
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
      offsetX,
      offsetY,
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
      offsetX,
      offsetY,
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
  offsetX: number;
  offsetY: number;
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
