"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
class TabsTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'Tabs', [
            ['id', 'INTEGER'],
            ['parentId', 'INTEGER'],
            ['pageTargetId', 'TEXT'],
            ['devtoolsSessionId', 'TEXT'],
            ['viewportWidth', 'INTEGER'],
            ['viewportHeight', 'INTEGER'],
            ['browserPositionX', 'INTEGER'],
            ['browserPositionY', 'INTEGER'],
            ['createdTime', 'DATETIME'],
        ]);
    }
    insert(tabId, pageId, devtoolsSessionId, viewPort, parentTabId) {
        return this.queuePendingInsert([
            tabId,
            parentTabId,
            pageId,
            devtoolsSessionId,
            viewPort.width,
            viewPort.height,
            viewPort.positionX,
            viewPort.positionY,
            Date.now(),
        ]);
    }
}
exports.default = TabsTable;
//# sourceMappingURL=TabsTable.js.map