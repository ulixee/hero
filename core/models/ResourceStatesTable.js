"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
const ResourceState_1 = require("@ulixee/unblocked-agent-mitm/interfaces/ResourceState");
const resourceStates = Object.keys(ResourceState_1.default).filter(x => ResourceState_1.default[x] === x);
class ResourceStatesTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'ResourceStates', [
            // @ts-ignore
            ['resourceId', 'INTEGER', 'NOT NULL PRIMARY KEY'],
            // @ts-ignore
            ...resourceStates.map(x => [x, 'INTEGER']),
        ], true);
    }
    insert(resourceId, stateChanges) {
        const states = resourceStates.map(x => stateChanges.get(ResourceState_1.default[x])?.getTime());
        return this.queuePendingInsert([resourceId, ...states]);
    }
}
exports.default = ResourceStatesTable;
//# sourceMappingURL=ResourceStatesTable.js.map