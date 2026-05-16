"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
class ScrollEventsTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'ScrollEvents', [
            ['tabId', 'INTEGER'],
            ['frameId', 'INTEGER'],
            ['scrollX', 'INTEGER'],
            ['scrollY', 'INTEGER'],
            ['commandId', 'INTEGER'],
            ['timestamp', 'DATETIME'],
        ]);
    }
    insert(tabId, frameId, commandId, scrollEvent) {
        const [scrollX, scrollY, timestamp] = scrollEvent;
        const record = [tabId, frameId, scrollX, scrollY, commandId, timestamp];
        this.queuePendingInsert(record);
        return { tabId, frameId, scrollX, scrollY, commandId, timestamp };
    }
}
exports.default = ScrollEventsTable;
//# sourceMappingURL=ScrollEventsTable.js.map