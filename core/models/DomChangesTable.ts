import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@secret-agent/commons/SqliteTable';
import { DomActionType, IDomChangeEvent } from '@secret-agent/interfaces/IDomChangeEvent';

export declare type IFrontendDomChangeEvent = Omit<
  IDomChangeRecord,
  'frameId' | 'tabId' | 'commandId' | 'timestamp'
> & {
  frameIdPath?: string;
};

export default class DomChangesTable extends SqliteTable<IDomChangeRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'DomChanges', [
      ['frameId', 'INTEGER'],
      ['eventIndex', 'INTEGER'],
      ['action', 'INTEGER'],
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

  public insert(tabId: number, frameId: number, commandId: number, change: IDomChangeEvent) {
    const [action, nodeData, timestamp, eventIndex] = change;
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

  public getFrameChanges(frameId: number, sinceCommandId?: number): IDomChangeRecord[] {
    const query = this.db.prepare(
      `select * from ${this.tableName} where frameId =? and commandId > ?`,
    );

    return query.all(frameId, sinceCommandId ?? 0).map(DomChangesTable.inflateRecord);
  }

  public static inflateRecord(record: IDomChangeRecord): IDomChangeRecord {
    for (const [key, value] of Object.entries(record)) {
      if (value === null) record[key] = undefined;
    }
    record.attributes = record.attributes ? JSON.parse(record.attributes as any) : undefined;
    record.attributeNamespaces = record.attributeNamespaces
      ? JSON.parse(record.attributeNamespaces as any)
      : undefined;
    record.properties = record.properties ? JSON.parse(record.properties as any) : undefined;
    return record;
  }

  public static toFrontendRecord(
    record: IDomChangeRecord,
    frameIdToNodePath: Map<number, string>,
  ): IFrontendDomChangeEvent {
    return {
      action: record.action,
      eventIndex: record.eventIndex,
      nodeId: record.nodeId,
      parentNodeId: record.parentNodeId,
      previousSiblingId: record.previousSiblingId,
      properties: record.properties,
      nodeType: record.nodeType,
      tagName: record.tagName,
      attributeNamespaces: record.attributeNamespaces,
      attributes: record.attributes,
      frameIdPath: frameIdToNodePath.get(record.frameId),
      textContent: record.textContent,
      namespaceUri: record.namespaceUri,
    };
  }
}

export interface IDomChangeRecord {
  commandId: number;
  tabId: number;
  frameId: number;
  nodeId: number;
  timestamp: number;
  eventIndex: number;
  action: DomActionType;
  nodeType: number;
  tagName: string;
  namespaceUri: string;
  textContent: string;
  previousSiblingId: number;
  parentNodeId: number;
  attributes: Record<string, string> | undefined;
  attributeNamespaces: Record<string, string> | undefined;
  properties: Record<string, any> | undefined;
}
