import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@secret-agent/commons/SqliteTable';
import { IDomChangeEvent } from '@secret-agent/core-interfaces/IDomChangeEvent';

export default class DomChangesTable extends SqliteTable<IDomChangeRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'DomChanges', [
      ['frameId', 'TEXT'],
      ['eventIndex', 'INTEGER'],
      ['action', 'TEXT'],
      ['nodeId', 'INTEGER'],
      ['nodeType', 'INTEGER'],
      ['tagName', 'TEXT'],
      ['previousSiblingId', 'INTEGER'],
      ['parentNodeId', 'INTEGER'],
      ['textContent', 'TEXT'],
      ['attributes', 'TEXT'],
      ['attributeNamespaces', 'TEXT'],
      ['properties', 'TEXT'],
      ['namespaceUri', 'TEXT'],
      ['commandId', 'INTEGER'],
      ['tabId', 'INTEGER'],
      ['timestamp', 'TEXT'],
    ]);
    this.defaultSortOrder = 'timestamp ASC';
  }

  public insert(tabId: number, frameId: string, change: IDomChangeEvent) {
    const [commandId, action, nodeData, timestamp, eventIndex] = change;
    const record = [
      frameId,
      eventIndex,
      action,
      nodeData.id,
      nodeData.nodeType,
      nodeData.tagName,
      nodeData.previousSiblingId,
      nodeData.parentNodeId,
      nodeData.textContent,
      nodeData.attributes ? JSON.stringify(nodeData.attributes) : undefined,
      nodeData.attributeNamespaces ? JSON.stringify(nodeData.attributeNamespaces) : undefined,
      nodeData.properties ? JSON.stringify(nodeData.properties) : undefined,
      nodeData.namespaceUri,
      commandId,
      tabId,
      timestamp,
    ];
    this.queuePendingInsert(record);
  }

  public getFrameChanges(frameId: string, sinceCommandId?: number): IDomChangeRecord[] {
    const query = this.db.prepare(
      `select * from ${this.tableName} where frameId =? and commandId > ?`,
    );

    return query.all(frameId, sinceCommandId ?? -2);
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
      record.eventIndex,
    ];
  }

  public static toRecord(event: IDomChangeEvent): Omit<IDomChangeRecord, 'frameId' | 'tabId'> {
    const [commandId, action, nodeData, timestamp, eventIndex] = event;
    return {
      commandId,
      action,
      nodeId: nodeData.id,
      ...nodeData,
      timestamp,
      eventIndex,
    } as any;
  }
}

export interface IDomChangeRecord {
  commandId: number;
  tabId: number;
  frameId: string;
  nodeId: number;
  timestamp: string;
  eventIndex: number;
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
