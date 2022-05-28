import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import { DomActionType, IDomChangeEvent } from '@ulixee/hero-interfaces/IDomChangeEvent';

export default class DomChangesTable extends SqliteTable<IDomChangeRecord> {
  public countByTimestamp = new Map<number, number>();

  constructor(db: SqliteDatabase) {
    super(db, 'DomChanges', [
      ['frameId', 'INTEGER'],
      ['documentNavigationId', 'INTEGER'],
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
      ['timestamp', 'DATETIME'],
    ]);
    this.defaultSortOrder = 'timestamp ASC,eventIndex ASC';
  }

  public insert(
    tabId: number,
    frameId: number,
    documentNavigationId: number,
    commandId: number,
    change: IDomChangeEvent,
  ): IDomChangeRecord {
    const [action, nodeData, timestamp, eventIndex] = change;

    const count = this.countByTimestamp.get(timestamp) ?? 0;
    this.countByTimestamp.set(timestamp, count + 1);

    const record = [
      frameId,
      documentNavigationId,
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
    return {
      frameId,
      documentNavigationId,
      eventIndex,
      action,
      nodeId: nodeData.id,
      nodeType: nodeData.nodeType,
      tagName: nodeData.tagName,
      previousSiblingId: nodeData.previousSiblingId,
      parentNodeId: nodeData.parentNodeId,
      textContent: nodeData.textContent,
      attributes: nodeData.attributes,
      attributeNamespaces: nodeData.attributeNamespaces,
      properties: nodeData.properties,
      namespaceUri: nodeData.namespaceUri,
      commandId,
      tabId,
      timestamp,
    };
  }

  public override all(): IDomChangeRecord[] {
    this.countByTimestamp.clear();
    const records: IDomChangeRecord[] = [];
    const pending = this.findPendingRecords(Boolean);
    for (const record of super.all().concat(pending)) {
      const count = this.countByTimestamp.get(record.timestamp) ?? 0;
      this.countByTimestamp.set(record.timestamp, count + 1);
      records.push(DomChangesTable.inflateRecord(record));
    }
    return records;
  }

  public getFrameChanges(frameId: number, afterCommandId?: number): IDomChangeRecord[] {
    const query = this.db.prepare(
      `select * from ${this.tableName} where frameId =? and commandId > ?`,
    );

    return query.all(frameId, afterCommandId ?? 0).map(DomChangesTable.inflateRecord);
  }

  public getChangesSinceNavigation(navigationId: number): IDomChangeRecord[] {
    const query = this.db.prepare(
      `select * from ${this.tableName} where documentNavigationId >= ?`,
    );

    return query.all(navigationId).map(DomChangesTable.inflateRecord);
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

  public static toDomRecording(
    domChangeRecords: IDomChangeRecord[],
    mainFrameIds: Set<number>,
    domNodePathByFrameId?: Record<number, string>,
    onlyLatestNavigation = false,
  ): IDomRecording {
    const paintEvents: IPaintEvent[] = [];
    const documents: IDocument[] = [];
    let paintEventsByTimestamp: { [timestamp: number]: IPaintEvent } = {};

    for (let i = 0; i < domChangeRecords.length; i += 1) {
      const change = domChangeRecords[i];
      const { timestamp, commandId, ...event } = change;
      const { frameId } = change;

      if (change.action === DomActionType.newDocument) {
        const isMainframe = mainFrameIds.has(frameId);
        let doctype = null;
        for (let x = 1; x <= 2; x += 1) {
          const next = domChangeRecords[i + x];
          if (next?.nodeType === 10) {
            doctype = next.textContent;
            break;
          }
        }

        if (isMainframe && onlyLatestNavigation) {
          documents.length = 0;
          paintEvents.length = 0;
          paintEventsByTimestamp = {};
        }
        documents.push({
          url: change.textContent,
          paintEventIndex: paintEventsByTimestamp[timestamp]
            ? paintEvents.indexOf(paintEventsByTimestamp[timestamp])
            : paintEvents.length,
          paintStartTimestamp: timestamp,
          doctype,
          isMainframe,
          frameId,
        });
      }

      if (!paintEventsByTimestamp[timestamp]) {
        paintEventsByTimestamp[timestamp] = {
          timestamp,
          commandId,
          changeEvents: [],
        };
        paintEvents.push(paintEventsByTimestamp[timestamp]);
      }

      const changeEvents = paintEventsByTimestamp[timestamp].changeEvents;
      changeEvents.push(event as any);
      if (
        changeEvents.length > 1 &&
        event.eventIndex < changeEvents[changeEvents.length - 2].eventIndex
      ) {
        changeEvents.sort((a, b) => {
          if (a.frameId === b.frameId) return a.eventIndex - b.eventIndex;
          return a.frameId - b.frameId;
        });
      }
    }
    paintEvents.sort((a, b) => {
      return a.timestamp - b.timestamp;
    });

    return { documents, paintEvents, mainFrameIds, domNodePathByFrameId };
  }
}

export interface IPaintEvent {
  timestamp: number;
  commandId: number;
  changeEvents: IDomChangeRecord[];
}

export interface IDomRecording {
  paintEvents: IPaintEvent[];
  domNodePathByFrameId: Record<number, string>;
  mainFrameIds: Set<number>;
  documents: IDocument[];
}

export interface IDocument {
  isMainframe: boolean;
  paintStartTimestamp: number;
  paintEventIndex: number;
  frameId: number;
  url: string;
  doctype: string;
}

export interface IDomChangeRecord {
  commandId: number;
  tabId: number;
  frameId: number;
  documentNavigationId: number;
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
