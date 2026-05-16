"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
class PageLogsTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'PageLogs', [
            ['tabId', 'INTEGER'],
            ['frameId', 'INTEGER'],
            ['type', 'TEXT'],
            ['message', 'TEXT'],
            ['timestamp', 'INTEGER'],
            ['location', 'TEXT'],
        ]);
    }
    insert(tabId, frameId, type, message, date, location) {
        return this.queuePendingInsert([tabId, frameId, type, message, date.getTime(), location]);
    }
}
exports.default = PageLogsTable;
//# sourceMappingURL=PageLogsTable.js.map