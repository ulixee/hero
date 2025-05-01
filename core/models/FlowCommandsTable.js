"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
class FlowCommandsTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'FlowCommands', [
            ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
            ['parentId', 'INTEGER'],
            ['tabId', 'INTEGER'],
            ['callsite', 'TEXT'],
        ]);
    }
    insert(handler) {
        this.queuePendingInsert([handler.id, handler.parentId, handler.tabId, handler.callsite]);
    }
}
exports.default = FlowCommandsTable;
//# sourceMappingURL=FlowCommandsTable.js.map