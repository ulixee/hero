import { IDomChangeEvent } from '@secret-agent/injected-scripts/interfaces/IDomChangeEvent';
import BaseTable from '../lib/BaseTable';
import { Database as SqliteDatabase } from 'better-sqlite3';

export default class DomChangesTable extends BaseTable<IDomChangeRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'DomChanges', [
      ['commandId', 'INTEGER'],
      ['frameId', 'TEXT'],
      ['action', 'TEXT'],
      ['timestamp', 'TEXT'],
      ['nodeId', 'INTEGER'],
      ['nodeType', 'INTEGER'],
      ['tagName', 'TEXT'],
      ['textContent', 'TEXT'],
      ['previousSiblingId', 'INTEGER'],
      ['parentNodeId', 'INTEGER'],
      ['attributes', 'TEXT'],
      ['properties', 'TEXT'],
    ]);
  }

  public insert(frameId: string, change: IDomChangeEvent) {
    const [commandId, action, nodeData, timestamp] = change;
    const record = [
      commandId,
      frameId,
      action,
      timestamp,
      nodeData.id,
      nodeData.nodeType,
      nodeData.tagName,
      nodeData.textContent,
      nodeData.previousSiblingId,
      nodeData.parentNodeId,
      nodeData.attributes ? JSON.stringify(nodeData.attributes) : undefined,
      nodeData.properties ? JSON.stringify(nodeData.properties) : undefined,
    ];
    this.pendingInserts.push(record);
  }

  public getFrameChanges(frameIds: string[], sinceCommandId?: number) {
    const frameParams = frameIds.map(_ => '?').join(', ');
    const query = this.db.prepare(
      `select * from ${this.tableName} where frameId in (${frameParams}) and commandId > ?`,
    );

    const records: { [frameId: string]: IDomChangeEvent[] } = {};
    for (const frameid of frameIds) {
      records[frameid] = [];
    }

    for (const record of query.iterate(...frameIds, sinceCommandId ?? -2) as IterableIterator<
      IDomChangeRecord
    >) {
      records[record.frameId].push(DomChangesTable.toDomChangeEvent(record));
    }
    return records;
  }

  public all() {
    return this.db
      .prepare(`SELECT * FROM ${this.tableName} ORDER BY timestamp ASC`)
      .all() as IDomChangeRecord[];
  }

  public static toDomChangeEvent(record: IDomChangeRecord): IDomChangeEvent {
    return [
      record.commandId,
      record.action as any,
      {
        ...record,
        id: record.nodeId,
        attributes: record.attributes ? JSON.parse(record.attributes) : undefined,
        properties: record.properties ? JSON.parse(record.properties) : undefined,
      },
      record.timestamp,
    ];
  }
}

export interface IDomChangeRecord {
  commandId: number;
  frameId: string;
  nodeId: number;
  timestamp: string;
  action: string;
  nodeType: number;
  tagName: string;
  textContent: string;
  previousSiblingId: number;
  parentNodeId: number;
  attributes: string;
  properties: string;
}
