import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import { DomActionType, IDomChangeEvent } from '@ulixee/hero-interfaces/IDomChangeEvent';

export default class DomChangesTable extends SqliteTable<IDomChangeRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'DomChanges', [
      ['frameId', 'INTEGER'],
      ['frameNavigationId', 'INTEGER'],
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
    this.defaultSortOrder = 'timestamp ASC,eventIndex ASC';
  }

  public insert(
    tabId: number,
    frameId: number,
    navigationId: number,
    commandId: number,
    change: IDomChangeEvent,
  ): void {
    const [action, nodeData, timestamp, eventIndex] = change;
    const record = [
      frameId,
      navigationId,
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

  public getChangesSinceNavigation(navigationId: number): IDomChangeRecord[] {
    const query = this.db.prepare(`select * from ${this.tableName} where frameNavigationId >= ?`);

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
  paintEventIndex: number;
  frameId: number;
  url: string;
  doctype: string;
}

export interface IDomChangeRecord {
  commandId: number;
  tabId: number;
  frameId: number;
  frameNavigationId: number;
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
