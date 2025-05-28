"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
const IDomChangeEvent_1 = require("@ulixee/hero-interfaces/IDomChangeEvent");
class DomChangesTable extends SqliteTable_1.default {
    constructor(db) {
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
        this.countByTimestamp = new Map();
        this.defaultSortOrder = 'timestamp ASC,eventIndex ASC';
    }
    insert(tabId, frameId, documentNavigationId, commandId, change) {
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
    all() {
        this.countByTimestamp.clear();
        const records = [];
        const pending = this.findPendingRecords(Boolean);
        for (const record of super.all().concat(pending)) {
            const count = this.countByTimestamp.get(record.timestamp) ?? 0;
            this.countByTimestamp.set(record.timestamp, count + 1);
            records.push(DomChangesTable.inflateRecord(record));
        }
        return records;
    }
    getFrameChanges(frameId, afterCommandId) {
        const query = this.db.prepare(`select * from ${this.tableName} where frameId =? and commandId > ?`);
        return query.all(frameId, afterCommandId ?? 0).map(DomChangesTable.inflateRecord);
    }
    getChangesSinceNavigation(navigationId) {
        const query = this.db.prepare(`select * from ${this.tableName} where documentNavigationId >= ?`);
        return query.all(navigationId).map(DomChangesTable.inflateRecord);
    }
    static inflateRecord(record) {
        for (const [key, value] of Object.entries(record)) {
            if (value === null)
                record[key] = undefined;
        }
        record.attributes = record.attributes ? JSON.parse(record.attributes) : undefined;
        record.attributeNamespaces = record.attributeNamespaces
            ? JSON.parse(record.attributeNamespaces)
            : undefined;
        record.properties = record.properties ? JSON.parse(record.properties) : undefined;
        return record;
    }
    static toDomRecording(domChangeRecords, mainFrameIds, domNodePathByFrameId, onlyLatestNavigation = false) {
        const paintEvents = [];
        const documents = [];
        let paintEventsByTimestamp = {};
        for (let i = 0; i < domChangeRecords.length; i += 1) {
            const change = domChangeRecords[i];
            const { timestamp, commandId, ...event } = change;
            const { frameId } = change;
            if (change.action === IDomChangeEvent_1.DomActionType.newDocument) {
                const isMainframe = mainFrameIds.has(frameId);
                let doctype = null;
                // can get iframes and other things before the doctype comes through
                for (let x = 1; x <= 100; x += 1) {
                    const next = domChangeRecords[i + x];
                    if (!next)
                        break;
                    if (next.nodeType === 10 && next.frameId === frameId) {
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
            changeEvents.push(event);
            if (changeEvents.length > 1 &&
                event.eventIndex < changeEvents[changeEvents.length - 2].eventIndex) {
                changeEvents.sort((a, b) => {
                    if (a.frameId === b.frameId)
                        return a.eventIndex - b.eventIndex;
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
exports.default = DomChangesTable;
//# sourceMappingURL=DomChangesTable.js.map