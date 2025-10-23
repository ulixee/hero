"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
class ScreenshotsTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'Screenshots', [
            // need text for full precision (will be rounded to two decimals otherwise)
            ['timestamp', 'TEXT', 'NOT NULL PRIMARY KEY'],
            ['tabId', 'INTEGER', 'NOT NULL PRIMARY KEY'],
            ['image', 'BLOB'],
        ], true);
        this.storeDuplicates = false;
        this.includeWhiteScreens = false;
        this.screenshotTimesByTabId = new Map();
        this.hasLoadedCounts = false;
        this.lastImageByTab = {};
    }
    getImage(tabId, timestamp) {
        const lookupTimestamp = String(timestamp);
        if (this.pendingInserts.length) {
            for (const record of this.pendingInserts) {
                if (record[0] === lookupTimestamp && record[1] === tabId)
                    return record[2];
            }
        }
        return (this.db
            .prepare(`select image from ${this.tableName} where tabId=? and timestamp=?`)
            .pluck()
            .get(tabId, lookupTimestamp));
    }
    getScreenshotTimesByTabId() {
        if (this.hasLoadedCounts)
            return this.screenshotTimesByTabId;
        this.hasLoadedCounts = true;
        const timestamps = (this.db.prepare(`select timestamp, tabId from ${this.tableName}`).all());
        for (const { timestamp, tabId } of timestamps) {
            this.trackScreenshotTime(tabId, timestamp);
        }
        return this.screenshotTimesByTabId;
    }
    insert(screenshot) {
        const { tabId, timestamp, image } = screenshot;
        if (!this.storeDuplicates &&
            this.lastImageByTab[tabId] &&
            image.equals(this.lastImageByTab[tabId])) {
            return;
        }
        this.lastImageByTab[tabId] = image;
        this.trackScreenshotTime(tabId, timestamp);
        this.queuePendingInsert([String(timestamp), tabId, image]);
    }
    trackScreenshotTime(tabId, timestamp) {
        this.hasLoadedCounts = true;
        if (!this.screenshotTimesByTabId.has(tabId)) {
            this.screenshotTimesByTabId.set(tabId, []);
        }
        this.screenshotTimesByTabId.get(tabId).push(timestamp);
    }
    static isBlankImage(imageBase64) {
        const nonBlankCharsNeeded = imageBase64.length * 0.05;
        let nonBlankChars = 0;
        for (const char of imageBase64) {
            if (char !== 'A') {
                nonBlankChars += 1;
                if (nonBlankChars >= nonBlankCharsNeeded) {
                    return false;
                }
            }
        }
        return true;
    }
}
exports.default = ScreenshotsTable;
//# sourceMappingURL=ScreenshotsTable.js.map