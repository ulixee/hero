"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
class SnippetsTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'Snippets', [
            ['name', 'TEXT'],
            ['value', 'TEXT'],
            ['timestamp', 'DATETIME'],
            ['commandId', 'INTEGER'],
        ]);
    }
    getByName(name) {
        return this.db
            .prepare(`select * from ${this.tableName} where name=:name`)
            .all({ name })
            .map((x) => {
            return {
                ...x,
                value: TypeSerializer_1.default.parse(x.value),
            };
        });
    }
    insert(name, value, timestamp, commandId) {
        this.queuePendingInsert([
            name,
            TypeSerializer_1.default.stringify(value),
            timestamp,
            commandId,
        ]);
        return { name, value, timestamp, commandId };
    }
}
exports.default = SnippetsTable;
//# sourceMappingURL=SnippetsTable.js.map