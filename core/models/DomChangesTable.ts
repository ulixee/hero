import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@secret-agent/commons/SqliteTable';
import { DomActionType, IDomChangeEvent } from '@secret-agent/core-interfaces/IDomChangeEvent';

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
      ['timestamp', 'INTEGER'],
    ]);
    this.defaultSortOrder = 'timestamp ASC';
  }

  public insert(tabId: number, frameId: string, commandId: number, change: IDomChangeEvent) {
    const [action, nodeData, timestamp, eventIndex] = change;
    const record = [
      frameId,
      eventIndex,
      DomActionType[action],
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

    return query.all(frameId, sinceCommandId ?? 0);
  }
}

export interface IDomChangeRecord {
  commandId: number;
  tabId: number;
  frameId: string;
  nodeId: number;
  timestamp: number;
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
