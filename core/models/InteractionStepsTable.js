"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SqliteTable_1 = require("@ulixee/commons/lib/SqliteTable");
const IInteractions_1 = require("@ulixee/unblocked-specification/agent/interact/IInteractions");
class InteractionStepsTable extends SqliteTable_1.default {
    constructor(db) {
        super(db, 'InteractionSteps', [
            ['tabId', 'INTEGER'],
            ['frameId', 'INTEGER'],
            ['commandId', 'INTEGER'],
            ['command', 'TEXT'],
            ['mousePositionX', 'INTEGER'],
            ['mousePositionY', 'INTEGER'],
            ['mousePositionJsPath', 'TEXT'],
            ['mouseButton', 'TEXT'],
            ['simulateOptionClickOnNodeId', 'INTEGER'],
            ['keyboardCommands', 'TEXT'],
            ['keyboardDelayBetween', 'INTEGER'],
            ['keyboardKeyupDelay', 'INTEGER'],
            ['delayMillis', 'INTEGER'],
            ['verification', 'TEXT'],
            ['relativeToScrollOffsetX', 'INTEGER'],
            ['relativeToScrollOffsetY', 'INTEGER'],
            ['startTimestamp', 'DATETIME'],
            ['endTimestamp', 'DATETIME'],
        ]);
    }
    insert(tabId, frameId, commandId, step, startTimestamp, endTimestamp) {
        const isMouseXY = step.mousePosition && (0, IInteractions_1.isMousePositionXY)(step.mousePosition);
        super.queuePendingInsert([
            tabId,
            frameId,
            commandId,
            step.command,
            isMouseXY ? step.mousePosition[0] : null,
            isMouseXY ? step.mousePosition[1] : null,
            !isMouseXY ? JSON.stringify(step.mousePosition) : null,
            step.mouseButton,
            step.simulateOptionClickOnNodeId,
            step.keyboardCommands ? JSON.stringify(step.keyboardCommands) : null,
            step.keyboardDelayBetween,
            step.keyboardKeyupDelay,
            step.delayMillis,
            step.verification,
            step.relativeToScrollOffset?.x,
            step.relativeToScrollOffset?.y,
            startTimestamp,
            endTimestamp,
        ]);
    }
}
exports.default = InteractionStepsTable;
//# sourceMappingURL=InteractionStepsTable.js.map