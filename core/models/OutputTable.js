"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
class OutputTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'Output', [
            ['type', 'TEXT'],
            ['path', 'TEXT'],
            ['value', 'TEXT'],
            ['lastCommandId', 'INTEGER'],
            ['timestamp', 'INTEGER'],
        ], true);
    }
    insert(record) {
        record.value = TypeSerializer_1.default.stringify(record.value);
        const { type, path, value, lastCommandId, timestamp } = record;
        this.queuePendingInsert([type, path, value, lastCommandId, timestamp]);
    }
    all() {
        return super.all().map(x => ({
            ...x,
            value: TypeSerializer_1.default.parse(x.value),
        }));
    }
}
exports.default = OutputTable;
//# sourceMappingURL=OutputTable.js.map