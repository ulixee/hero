"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _FramesTable_mainFrameIds, _FramesTable_tabIdByFrameId, _FramesTable_mainFrameIdByTabId;
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
class FramesTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'Frames', [
            ['id', 'INTEGER', 'NOT NULL PRIMARY KEY'],
            ['tabId', 'INTEGER'],
            ['domNodeId', 'INTEGER'],
            ['parentId', 'INTEGER'],
            ['name', 'TEXT'],
            ['securityOrigin', 'TEXT'],
            ['startCommandId', 'INTEGER'],
            ['devtoolsFrameId', 'TEXT'],
            ['createdTimestamp', 'INTEGER'],
        ], true);
        this.frameDomNodePathsById = {};
        this.framesById = {};
        _FramesTable_mainFrameIds.set(this, new Set());
        _FramesTable_tabIdByFrameId.set(this, new Map());
        _FramesTable_mainFrameIdByTabId.set(this, new Map());
    }
    insert(frame) {
        this.recordDomNodePath(frame);
        return this.queuePendingInsert([
            frame.id,
            frame.tabId,
            frame.domNodeId,
            frame.parentId,
            frame.name,
            frame.securityOrigin,
            frame.startCommandId,
            frame.devtoolsFrameId,
            frame.createdTimestamp,
        ]);
    }
    mainFrameIds(tabId) {
        if (!__classPrivateFieldGet(this, _FramesTable_mainFrameIds, "f").size) {
            // load all frames up
            this.all();
        }
        if (tabId) {
            return __classPrivateFieldGet(this, _FramesTable_mainFrameIdByTabId, "f").get(tabId);
        }
        return __classPrivateFieldGet(this, _FramesTable_mainFrameIds, "f");
    }
    all() {
        const all = super.all();
        for (const frame of all) {
            this.recordDomNodePath(frame);
        }
        return all;
    }
    recordDomNodePath(frame) {
        if (!frame.parentId) {
            this.frameDomNodePathsById[frame.id] = 'main';
            __classPrivateFieldGet(this, _FramesTable_mainFrameIds, "f").add(frame.id);
            if (!__classPrivateFieldGet(this, _FramesTable_mainFrameIdByTabId, "f").has(frame.tabId)) {
                __classPrivateFieldGet(this, _FramesTable_mainFrameIdByTabId, "f").set(frame.tabId, new Set());
            }
            __classPrivateFieldGet(this, _FramesTable_mainFrameIdByTabId, "f").get(frame.tabId).add(frame.id);
        }
        __classPrivateFieldGet(this, _FramesTable_tabIdByFrameId, "f").set(frame.id, frame.tabId);
        if (frame.domNodeId) {
            const parentPath = this.frameDomNodePathsById[frame.parentId];
            this.frameDomNodePathsById[frame.id] = `${parentPath ?? ''}_${frame.domNodeId}`;
        }
        this.framesById[frame.id] = { parentId: frame.parentId, domNodeId: frame.domNodeId };
    }
}
_FramesTable_mainFrameIds = new WeakMap(), _FramesTable_tabIdByFrameId = new WeakMap(), _FramesTable_mainFrameIdByTabId = new WeakMap();
exports.default = FramesTable;
//# sourceMappingURL=FramesTable.js.map