"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const INavigation_1 = require("@ulixee/unblocked-specification/agent/browser/INavigation");
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
class FrameNavigationsTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'FrameNavigations', [
            ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
            ['documentNavigationId', 'INTEGER'],
            ['frameId', 'INTEGER'],
            ['tabId', 'INTEGER'],
            ['resourceId', 'INTEGER'],
            ['startCommandId', 'INTEGER'],
            ['requestedUrl', 'TEXT'],
            ['finalUrl', 'TEXT'],
            ['doctype', 'TEXT'],
            ['navigationReason', 'TEXT'],
            ['loaderId', 'TEXT'],
            ['initiatedTime', 'DATETIME'],
            ['httpRequestedTime', 'DATETIME'],
            ['httpRespondedTime', 'DATETIME'],
            ['httpRedirectedTime', 'DATETIME'],
            ['javascriptReadyTime', 'DATETIME'],
            ['domContentLoadedTime', 'DATETIME'],
            ['loadTime', 'DATETIME'],
            ['contentPaintedTime', 'DATETIME'],
        ], true);
        this.idCounter = 0;
        this.allNavigationsById = new Map();
        this.defaultSortOrder = 'initiatedTime ASC';
    }
    getAllNavigations() {
        if (!this.allNavigationsById.size) {
            for (const record of this.all()) {
                this.allNavigationsById.set(record.id, FrameNavigationsTable.toNavigation(record));
            }
        }
        return [...this.allNavigationsById.values()];
    }
    get(id) {
        return this.allNavigationsById.get(id) ?? FrameNavigationsTable.toNavigation(this.getById(id));
    }
    insert(navigation) {
        this.allNavigationsById.set(navigation.id, navigation);
        const record = [
            navigation.id,
            navigation.documentNavigationId,
            navigation.frameId,
            navigation.tabId,
            navigation.resourceId,
            navigation.startCommandId,
            navigation.requestedUrl,
            navigation.finalUrl,
            navigation.doctype,
            navigation.navigationReason,
            navigation.loaderId,
            navigation.initiatedTime,
            navigation.statusChanges.get(Location_1.LoadStatus.HttpRequested),
            navigation.statusChanges.get(Location_1.LoadStatus.HttpResponded),
            navigation.statusChanges.get(Location_1.LoadStatus.HttpRedirected),
            navigation.statusChanges.get(Location_1.LoadStatus.JavascriptReady),
            navigation.statusChanges.get(Location_1.LoadStatus.DomContentLoaded),
            navigation.statusChanges.get(Location_1.LoadStatus.AllContentLoaded),
            navigation.statusChanges.get(INavigation_1.ContentPaint),
        ];
        this.queuePendingInsert(record);
    }
    last() {
        return this.db
            .prepare(`select * from ${this.tableName} order by initiatedTime desc limit 1`)
            .get();
    }
    getById(id) {
        return this.db
            .prepare(`select * from ${this.tableName} where id=?`)
            .get(id);
    }
    getMostRecentTabNavigations(tabId, frameIds) {
        const navigations = this.db
            .prepare(`select * from ${this.tableName} where tabId=? order by initiatedTime desc`)
            .all(tabId);
        if (frameIds) {
            return navigations.filter(x => frameIds.has(x.frameId));
        }
        return navigations;
    }
    static toNavigation(record, recreateResolvable = false) {
        const entry = record;
        const entries = [
            [Location_1.LoadStatus.HttpRequested, record.httpRequestedTime],
            [Location_1.LoadStatus.HttpResponded, record.httpRespondedTime],
            [Location_1.LoadStatus.HttpRedirected, record.httpRedirectedTime],
            [Location_1.LoadStatus.JavascriptReady, record.javascriptReadyTime],
            [Location_1.LoadStatus.DomContentLoaded, record.domContentLoadedTime],
            [Location_1.LoadStatus.AllContentLoaded, record.loadTime],
            [INavigation_1.ContentPaint, record.contentPaintedTime],
        ].filter(x => !!x[1]);
        entry.statusChanges = new Map(entries);
        if (recreateResolvable) {
            entry.resourceIdResolvable = new Resolvable_1.default();
            if (entry.resourceId)
                entry.resourceIdResolvable.resolve(entry.resourceId);
        }
        return entry;
    }
}
exports.default = FrameNavigationsTable;
//# sourceMappingURL=FrameNavigationsTable.js.map