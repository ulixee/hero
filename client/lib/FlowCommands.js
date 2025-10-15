"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FlowCommand_1 = require("./FlowCommand");
class FlowCommands {
    get runningFlowCommand() {
        return this.flowCommands.find(x => x.isRunning);
    }
    get isRunning() {
        return this.flowCommands.some(x => x.isRunning);
    }
    constructor(coreTab) {
        this.coreTab = coreTab;
        this.flowCommands = [];
    }
    async create(commandFn, exitState, callsitePath, options) {
        const id = this.flowCommands.length + 1;
        const parentFlow = this.runningFlowCommand;
        let flowCommand;
        if (parentFlow && parentFlow.retryNumber > 0) {
            const callsiteJson = JSON.stringify(callsitePath);
            flowCommand = this.flowCommands.find(x => x.parentId === parentFlow.id && callsiteJson === JSON.stringify(x.callsitePath));
        }
        if (flowCommand) {
            flowCommand.retryNumber += 1;
            return flowCommand;
        }
        flowCommand = new FlowCommand_1.default(this.coreTab, commandFn, exitState, id, parentFlow, callsitePath, options);
        this.flowCommands.push(flowCommand);
        await this.coreTab.commandQueue.runOutOfBand('Tab.registerFlowCommand', flowCommand.id, flowCommand.parentId, callsitePath);
        return flowCommand;
    }
    didRunFlowHandlers() {
        for (const flowCommand of this.flowCommands) {
            if (flowCommand.isRunning)
                flowCommand.isFlowStateChanged = true;
        }
    }
}
exports.default = FlowCommands;
//# sourceMappingURL=FlowCommands.js.map