"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MouseEventType = void 0;
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
class MouseEventsTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'MouseEvents', [
            ['tabId', 'INTEGER'],
            ['frameId', 'INTEGER'],
            ['event', 'INTEGER'],
            ['commandId', 'INTEGER'],
            ['pageX', 'INTEGER'],
            ['pageY', 'INTEGER'],
            ['offsetX', 'INTEGER'],
            ['offsetY', 'INTEGER'],
            ['buttons', 'INTEGER'],
            ['targetNodeId', 'INTEGER'],
            ['relatedTargetNodeId', 'INTEGER'],
            ['timestamp', 'DATETIME'],
        ]);
    }
    insert(tabId, frameId, commandId, mouseEvent) {
        const [event, pageX, pageY, offsetX, offsetY, buttons, targetNodeId, relatedTargetNodeId, timestamp,] = mouseEvent;
        const record = [
            tabId,
            frameId,
            event,
            commandId,
            pageX,
            pageY,
            offsetX,
            offsetY,
            buttons,
            targetNodeId,
            relatedTargetNodeId,
            timestamp,
        ];
        this.queuePendingInsert(record);
        return {
            tabId,
            frameId,
            event,
            commandId,
            pageX,
            pageY,
            offsetX,
            offsetY,
            buttons,
            targetNodeId,
            relatedTargetNodeId,
            timestamp,
        };
    }
}
exports.default = MouseEventsTable;
var MouseEventType;
(function (MouseEventType) {
    MouseEventType[MouseEventType["MOVE"] = 0] = "MOVE";
    MouseEventType[MouseEventType["DOWN"] = 1] = "DOWN";
    MouseEventType[MouseEventType["UP"] = 2] = "UP";
    MouseEventType[MouseEventType["OVER"] = 3] = "OVER";
    MouseEventType[MouseEventType["OUT"] = 4] = "OUT";
})(MouseEventType || (exports.MouseEventType = MouseEventType = {}));
//# sourceMappingURL=MouseEventsTable.js.map