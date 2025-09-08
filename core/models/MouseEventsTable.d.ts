import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import { IMouseEvent } from '@ulixee/hero-interfaces/IMouseEvent';
export default class MouseEventsTable extends SqliteTable<IMouseEventRecord> {
    constructor(db: SqliteDatabase);
    insert(tabId: number, frameId: number, commandId: number, mouseEvent: IMouseEvent): IMouseEventRecord;
}
export interface IMouseEventRecord {
    tabId: number;
    frameId: number;
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
export declare enum MouseEventType {
    MOVE = 0,
    DOWN = 1,
    UP = 2,
    OVER = 3,
    OUT = 4
}
