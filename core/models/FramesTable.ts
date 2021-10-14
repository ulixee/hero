import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';

export default class FramesTable extends SqliteTable<IFrameRecord> {
  public frameDomNodePathsById: { [frameId: number]: string } = {};

  public get nextId(): number {
    this.#idCounter += 1;
    return this.#idCounter;
  }

  #idCounter = 0;

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

  public insert(frame: IFrameRecord): void {
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

  public mainFrameIds(tabId?: number): Set<number> {
    const all = super.all();
    const mainFrameIds = new Set<number>();
    for (const frame of all) {
      if (!frame.parentId && frame.tabId === tabId) {
        mainFrameIds.add(frame.id);
      }

      this.recordDomNodePath(frame);
    }
    return mainFrameIds;
  }

  public all(): IFrameRecord[] {
    const all = super.all();
    for (const frame of all) {
      this.recordDomNodePath(frame);
    }
    return all;
  }

  private recordDomNodePath(frame: IFrameRecord): void {
    if (!frame.parentId) {
      this.frameDomNodePathsById[frame.id] = 'main';
    }
    if (frame.domNodeId) {
      const parentPath = this.frameDomNodePathsById[frame.parentId];
      this.frameDomNodePathsById[frame.id] = `${parentPath ?? ''}_${frame.domNodeId}`;
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
