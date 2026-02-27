"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
class AwaitedEventsTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'AwaitedEvents', [
            ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
            ['tabId', 'INTEGER'],
            ['frameId', 'INTEGER'],
            ['listenerId', 'INTEGER'],
            ['eventArgs', 'TEXT'],
            ['timestamp', 'DATETIME'],
            ['publishedAtCommandId', 'INTEGER'],
        ], true);
        this.idCounter = 0;
        this.defaultSortOrder = 'id ASC';
    }
    insert(eventRecord) {
        this.idCounter += 1;
        const id = this.idCounter;
        eventRecord.id = id;
        this.queuePendingInsert([
            id,
            eventRecord.tabId,
            eventRecord.frameId,
            eventRecord.listenerId,
            TypeSerializer_1.default.stringify(eventRecord.eventArgs),
            eventRecord.timestamp,
            eventRecord.publishedAtCommandId,
        ]);
    }
}
exports.default = AwaitedEventsTable;
//# sourceMappingURL=AwaitedEventsTable.js.map