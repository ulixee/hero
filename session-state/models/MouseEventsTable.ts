import { Database as SqliteDatabase } from 'better-sqlite3';
import BaseTable from '../lib/BaseTable';
import { IMouseEvent } from '@secret-agent/injected-scripts/interfaces/IMouseEvent';

export default class MouseEventsTable extends BaseTable<IMouseEventRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'MouseEvents',
      [
        ['event', 'INTEGER'],
        ['commandId', 'INTEGER'],
        ['pageX', 'INTEGER'],
        ['pageY', 'INTEGER'],
        ['buttons', 'INTEGER'],
        ['targetNodeId', 'INTEGER'],
        ['relatedTargetNodeId', 'INTEGER'],
        ['timestamp', 'TEXT'],
      ],
      true,
    );
  }

  public insert(mouseEvent: IMouseEvent) {
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
      event,
      commandId,
      pageX,
      pageY,
      buttons,
      targetNodeId,
      relatedTargetNodeId,
      isoTimestamp,
    ];
    this.pendingInserts.push(record);
  }

  public all() {
    return this.db.prepare(`select * from ${this.tableName}`).all() as IMouseEventRecord[];
  }

  public allEvents(events: MouseEventType[]) {
    return this.db
      .prepare(`select * from ${this.tableName} where event in (${events.map(x => '?').join(',')})`)
      .all(events) as IMouseEventRecord[];
  }
}

export interface IMouseEventRecord {
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
