"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
const CommandFormatter_1 = require("../lib/CommandFormatter");
class DetachedElementsTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'DetachedElements', [
            ['id', 'INTEGER', 'PRIMARY KEY'],
            ['name', 'TEXT'],
            ['timestamp', 'DATETIME'],
            ['tabId', 'INTEGER'],
            ['frameId', 'INTEGER'],
            ['frameNavigationId', 'INTEGER'],
            ['commandId', 'INTEGER'],
            ['nodePath', 'TEXT'],
            ['documentUrl', 'TEXT'],
            ['domChangesTimestamp', 'DATETIME'],
            ['nodePointerId', 'INTEGER'],
            ['nodeType', 'TEXT'],
            ['nodePreview', 'TEXT'],
            ['outerHTML', 'TEXT'],
        ], true);
        this.idCounter = 0;
        this.defaultSortOrder = 'id';
    }
    insert(detachedElement) {
        this.idCounter += 1;
        detachedElement.id = this.idCounter;
        this.queuePendingInsert([
            detachedElement.id,
            detachedElement.name,
            detachedElement.timestamp,
            detachedElement.tabId,
            detachedElement.frameId,
            detachedElement.frameNavigationId,
            detachedElement.commandId,
            detachedElement.nodePath ? (0, CommandFormatter_1.formatJsPath)(detachedElement.nodePath) : null,
            detachedElement.documentUrl,
            detachedElement.domChangesTimestamp,
            detachedElement.nodePointerId,
            detachedElement.nodeType,
            detachedElement.nodePreview,
            null,
        ]);
    }
    getByName(name) {
        return (this.db
            .prepare(`select * from ${this.tableName} where name=:name order by id asc`)
            .all({ name }));
    }
    allNames() {
        return this.db.prepare(`select distinct name from ${this.tableName}`).pluck().all();
    }
    updateHtml(element) {
        const pending = this.pendingInserts.find(x => x[0] === element.id);
        if (pending) {
            pending[7] = element.outerHTML;
            return;
        }
        this.db
            .prepare(`update ${this.tableName} set outerHTML=:outerHTML, documentUrl=:documentUrl where id=:id`)
            .run(element);
    }
}
exports.default = DetachedElementsTable;
//# sourceMappingURL=DetachedElementsTable.js.map