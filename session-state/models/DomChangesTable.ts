import { IDomChangeEvent } from '@secret-agent/injected-scripts/interfaces/IDomChangeEvent';
import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@secret-agent/commons/SqliteTable';

export default class DomChangesTable extends SqliteTable<IDomChangeRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'DomChanges', [
      ['commandId', 'INTEGER'],
      ['tabId', 'TEXT'],
      ['frameId', 'TEXT'],
      ['action', 'TEXT'],
      ['timestamp', 'TEXT'],
      ['nodeId', 'INTEGER'],
      ['nodeType', 'INTEGER'],
      ['tagName', 'TEXT'],
      ['namespaceUri', 'TEXT'],
      ['textContent', 'TEXT'],
      ['previousSiblingId', 'INTEGER'],
      ['parentNodeId', 'INTEGER'],
      ['attributes', 'TEXT'],
      ['attributeNamespaces', 'TEXT'],
      ['properties', 'TEXT'],
    ]);
    this.defaultSortOrder = 'timestamp ASC';
  }

  public insert(tabId: string, frameId: string, change: IDomChangeEvent) {
    const [commandId, action, nodeData, timestamp] = change;
    const record = [
      commandId,
      tabId,
      frameId,
      action,
      timestamp,
      nodeData.id,
      nodeData.nodeType,
      nodeData.tagName,
      nodeData.namespaceUri,
      nodeData.textContent,
      nodeData.previousSiblingId,
      nodeData.parentNodeId,
      nodeData.attributes ? JSON.stringify(nodeData.attributes) : undefined,
      nodeData.attributeNamespaces ? JSON.stringify(nodeData.attributeNamespaces) : undefined,
      nodeData.properties ? JSON.stringify(nodeData.properties) : undefined,
    ];
    this.queuePendingInsert(record);
  }

  public getFrameChanges(frameIds: string[], sinceCommandId?: number) {
    const frameParams = frameIds.map(() => '?').join(', ');
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

  public static toDomChangeEvent(record: IDomChangeRecord): IDomChangeEvent {
    return [
      record.commandId,
      record.action as any,
      {
        ...record,
        id: record.nodeId,
        attributes: record.attributes ? JSON.parse(record.attributes) : undefined,
        attributeNamespaces: record.attributeNamespaces
          ? JSON.parse(record.attributeNamespaces)
          : undefined,
        properties: record.properties ? JSON.parse(record.properties) : undefined,
      },
      record.timestamp,
    ];
  }

  public static toRecord(event: IDomChangeEvent) {
    return {
      commandId: event[0],
      action: event[1],
      ...event[2],
      nodeId: event[2].id,
      timestamp: event[3],
    };
  }
}

export interface IDomChangeRecord {
  commandId: number;
  tabId: string;
  frameId: string;
  nodeId: number;
  timestamp: string;
  action: string;
  nodeType: number;
  tagName: string;
  namespaceUri: string;
  textContent: string;
  previousSiblingId: number;
  parentNodeId: number;
  attributes: string;
  attributeNamespaces: string;
  properties: string;
}
