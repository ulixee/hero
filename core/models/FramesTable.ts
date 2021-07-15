import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/SqliteTable';

export default class FramesTable extends SqliteTable<IFrameRecord> {
  public frameDomNodePathsById = new Map<number, string>();

  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'Frames',
      [
        ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
        ['tabId', 'INTEGER'],
        ['domNodeId', 'INTEGER'],
        ['parentId', 'INTEGER'],
        ['name', 'TEXT'],
        ['securityOrigin', 'TEXT'],
        ['startCommandId', 'INTEGER'],
        ['devtoolsFrameId', 'TEXT'],
        ['createdTimestamp', 'INTEGER'],
      ],
      true,
    );
  }

  public insert(frame: IFrameRecord) {
    this.recordDomNodePath(frame);
    return this.queuePendingInsert([
      frame.id,
      frame.tabId,
      frame.domNodeId,
      frame.parentId,
      frame.name,
      frame.securityOrigin,
      frame.startCommandId,
      frame.devtoolsFrameId,
      frame.createdTimestamp,
    ]);
  }

  public all(): IFrameRecord[] {
    const all = super.all();
    for (const frame of all) {
      this.recordDomNodePath(frame);
    }
    return all;
  }

  private recordDomNodePath(frame: IFrameRecord) {
    if (!frame.parentId) {
      this.frameDomNodePathsById.set(frame.id, 'main');
    }
    if (frame.domNodeId) {
      const parentPath = this.frameDomNodePathsById.get(frame.parentId);
      this.frameDomNodePathsById.set(frame.id, `${parentPath ?? ''}_${frame.domNodeId}`);
    }
  }
}

export interface IFrameRecord {
  id: number;
  tabId: number;
  parentId?: number; // if null, top level frame
  domNodeId?: number;
  startCommandId: number;
  name?: string;
  securityOrigin?: string;
  devtoolsFrameId: string;
  createdTimestamp: number;
}
