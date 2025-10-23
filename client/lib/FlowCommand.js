"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const DomStateHandler_1 = require("./DomStateHandler");
const CoreCommandQueue_1 = require("./CoreCommandQueue");
class FlowCommand {
    get isComplete() {
        if (this.exitHandler) {
            return this.exitHandler.check();
        }
        return Promise.resolve(true);
    }
    get commandQueue() {
        return this.coreTab.commandQueue;
    }
    get parentId() {
        return this.parent?.id;
    }
    constructor(coreTab, runCommandsFn, exitState, id, parent, callsitePath, options) {
        this.coreTab = coreTab;
        this.runCommandsFn = runCommandsFn;
        this.id = id;
        this.parent = parent;
        this.callsitePath = callsitePath;
        this.options = options;
        this.retryNumber = 0;
        this.isRunning = false;
        this.isFlowStateChanged = false;
        this.options ??= { maxRetries: CoreCommandQueue_1.default.maxCommandRetries };
        if (exitState) {
            this.exitHandler = new DomStateHandler_1.default(exitState, null, coreTab, this.callsitePath, {
                flowCommand: this,
            });
        }
    }
    async run() {
        // if we have previously tried this and it's still valid, break out
        if (this.retryNumber > 0 && !!this.exitHandler && (await this.isComplete)) {
            return this.lastResult;
        }
        // Retry until isComplete is satisfied, or we have retried a max number of times
        for (let count = 0; count < this.options.maxRetries; count += 1) {
            try {
                this.isRunning = true;
                this.isFlowStateChanged = false; // clear out any flow state changes
                this.retryNumber += count; // add to retry count because we might be nested
                this.setCommandState();
                this.lastResult = await this.runCommandsFn();
                if (await this.isComplete)
                    return this.lastResult;
                if (this.isFlowStateChanged)
                    continue;
                // if not complete, trigger flow handlers to retry (catch will trigger on its own)
                const { triggeredFlowHandler } = await this.coreTab.triggerFlowHandlers();
                const shouldRetry = triggeredFlowHandler !== undefined;
                if (!shouldRetry) {
                    throw new Error('The FlowCommand cannot be completed. The Exit State is not satisfied and no FlowHandlers were triggered.');
                }
            }
            catch (error) {
                if (error instanceof IPendingWaitEvent_1.CanceledPromiseError)
                    throw error;
                const shouldRetry = await this.coreTab.shouldRetryFlowHandlers(this.commandQueue.retryingCommand, error);
                if (!shouldRetry && !this.isFlowStateChanged)
                    throw error;
            }
            finally {
                this.clearCommandState();
                this.isRunning = false;
            }
        }
    }
    clearCommandState() {
        if (this.parent) {
            this.parent.setCommandState();
            return;
        }
        this.commandQueue.shouldRetryCommands = true;
        this.commandQueue.setCommandMetadata({ flowCommandId: undefined, retryNumber: undefined });
    }
    setCommandState() {
        this.commandQueue.shouldRetryCommands = false;
        this.commandQueue.setCommandMetadata({ flowCommandId: this.id, retryNumber: this.retryNumber });
    }
}
exports.default = FlowCommand;
//# sourceMappingURL=FlowCommand.js.map