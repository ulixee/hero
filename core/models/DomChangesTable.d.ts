import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import { DomActionType, IDomChangeEvent } from '@ulixee/hero-interfaces/IDomChangeEvent';
export default class DomChangesTable extends SqliteTable<IDomChangeRecord> {
    countByTimestamp: Map<number, number>;
    constructor(db: SqliteDatabase);
    insert(tabId: number, frameId: number, documentNavigationId: number, commandId: number, change: IDomChangeEvent): IDomChangeRecord;
    all(): IDomChangeRecord[];
    getFrameChanges(frameId: number, afterCommandId?: number): IDomChangeRecord[];
    getChangesSinceNavigation(navigationId: number): IDomChangeRecord[];
    static inflateRecord(record: IDomChangeRecord): IDomChangeRecord;
    static toDomRecording(domChangeRecords: IDomChangeRecord[], mainFrameIds: Set<number>, domNodePathByFrameId?: Record<number, string>, onlyLatestNavigation?: boolean): IDomRecording;
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
