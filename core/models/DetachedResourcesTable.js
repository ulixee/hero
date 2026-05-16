"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
class DetachedResourcesTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'DetachedResources', [
            ['name', 'TEXT'],
            ['resourceId', 'INTEGER'],
            ['tabId', 'INTEGER'],
            ['timestamp', 'DATETIME'],
            ['commandId', 'INTEGER'],
        ], true);
    }
    getByName(name) {
        return this.db.prepare(`select * from ${this.tableName} where name=:name`).all({ name });
    }
    insert(tabId, resourceId, name, timestamp, commandId) {
        return this.queuePendingInsert([
            name,
            resourceId,
            tabId,
            timestamp,
            commandId,
        ]);
    }
}
exports.default = DetachedResourcesTable;
//# sourceMappingURL=DetachedResourcesTable.js.map