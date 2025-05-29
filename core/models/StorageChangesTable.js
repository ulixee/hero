"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
class StorageChangesTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'StorageChanges', [
            ['tabId', 'INTEGER'],
            ['securityOrigin', 'TEXT'],
            ['type', 'TEXT'],
            ['action', 'TEXT'],
            ['key', 'TEXT'],
            ['value', 'TEXT'],
            ['meta', 'TEXT'],
            ['timestamp', 'INTEGER'],
        ]);
        this.changesByTabIdAndTime = {};
        this.hasLoadedCounts = false;
        this.defaultSortOrder = 'id ASC';
    }
    insert(tabId, frameId, entry) {
        this.queuePendingInsert([
            tabId,
            entry.securityOrigin,
            entry.type,
            entry.action,
            entry.key,
            entry.value,
            TypeSerializer_1.default.stringify(entry.meta),
            entry.timestamp,
        ]);
        this.trackChangeTime(tabId, entry.timestamp);
    }
    findChange(tabId, filter) {
        return this.db
            .prepare(`select * from ${this.tableName}
                where tabId = ? and securityOrigin = :securityOrigin
                    and type = :type and action = :action and key = :key
                limit 1`)
            .get(tabId, filter);
    }
    withTimeInRange(tabId, startTime, endTime) {
        return this.db
            .prepare(`select * from ${this.tableName} where tabId = ? and timestamp >= ? and timestamp <= ?`)
            .all(tabId, startTime, endTime);
    }
    getChangesByTabIdAndTime() {
        if (!this.hasLoadedCounts) {
            this.hasLoadedCounts = true;
            const timestamps = this.db.prepare(`select timestamp, tabId from ${this.tableName}`).all();
            for (const { timestamp, tabId } of timestamps) {
                this.trackChangeTime(tabId, timestamp);
            }
        }
        const times = Object.values(this.changesByTabIdAndTime);
        times.sort((a, b) => a.timestamp - b.timestamp);
        return times;
    }
    trackChangeTime(tabId, timestamp) {
        this.hasLoadedCounts = true;
        const key = `${tabId}_${timestamp}`;
        this.changesByTabIdAndTime[key] ??= { tabId, timestamp, count: 0 };
        this.changesByTabIdAndTime[key].count += 1;
    }
}
exports.default = StorageChangesTable;
//# sourceMappingURL=StorageChangesTable.js.map