"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
class FlowHandlersTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'FlowHandlers', [
            ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
            ['tabId', 'INTEGER'],
            ['name', 'TEXT'],
            ['callsite', 'TEXT'],
        ]);
    }
    insert(handler) {
        this.queuePendingInsert([handler.id, handler.tabId, handler.name, handler.callsite]);
    }
}
exports.default = FlowHandlersTable;
//# sourceMappingURL=FlowHandlersTable.js.map