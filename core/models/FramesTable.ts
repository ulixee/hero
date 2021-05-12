import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@secret-agent/commons/SqliteTable';

export default class FramesTable extends SqliteTable<IFrameRecord> {
  public frameDomNodePathsById = new Map<string, string>();

  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'Frames',
      [
        ['id', 'TEXT', 'NOT NULL PRIMARY KEY'],
        ['tabId', 'INTEGER'],
        ['domNodeId', 'INTEGER'],
        ['name', 'TEXT'],
        ['securityOrigin', 'TEXT'],
        ['startCommandId', 'INTEGER'],
        ['parentId', 'TEXT'],
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
      frame.name,
      frame.securityOrigin,
      frame.startCommandId,
      frame.parentId,
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
  id: string;
  tabId: number;
  domNodeId?: number;
  startCommandId: number;
  name?: string;
  securityOrigin?: string;
  parentId?: string; // if null, top level frame
  createdTimestamp: number;
}
