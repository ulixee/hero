"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
class FocusEventsTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'FocusEvents', [
            ['tabId', 'INTEGER'],
            ['frameId', 'INTEGER'],
            ['event', 'INTEGER'],
            ['targetNodeId', 'INTEGER'],
            ['relatedTargetNodeId', 'INTEGER'],
            ['timestamp', 'DATETIME'],
        ]);
    }
    insert(tabId, frameId, commandId, focusEvent) {
        const [event, targetNodeId, relatedTargetNodeId, timestamp] = focusEvent;
        const record = [tabId, frameId, event, targetNodeId, relatedTargetNodeId, timestamp];
        this.queuePendingInsert(record);
        return { tabId, frameId, event, targetNodeId, relatedTargetNodeId, timestamp };
    }
}
exports.default = FocusEventsTable;
//# sourceMappingURL=FocusEventsTable.js.map