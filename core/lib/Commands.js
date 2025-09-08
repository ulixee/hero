"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
class Commands extends eventUtils_1.TypedEventEmitter {
    get history() {
        return this.db.commands.history;
    }
    get last() {
        return this.db.commands.last;
    }
    get lastId() {
        return this.last?.id;
    }
    get length() {
        return this.history.length;
    }
    constructor(db) {
        super();
        this.db = db;
        this.requiresScriptRestart = false;
        this.listenersById = new Map();
        this.listenerIdCounter = 0;
        this.defaultWaitForLocationCommandId = 0;
    }
    getStartingCommandIdFor(marker) {
        if (marker === 'waitForLocation') {
            return this.defaultWaitForLocationCommandId;
        }
    }
    waitForCommandLock() {
        return this.commandLockPromise?.promise;
    }
    pause() {
        if (!this.commandLockPromise || this.commandLockPromise.isResolved) {
            this.commandLockPromise = new Resolvable_1.default();
        }
        this.emit('pause');
    }
    resume() {
        this.commandLockPromise.resolve();
        this.commandLockPromise = null;
        this.emit('resume');
    }
    create(tabId, frameId, startNavigationId, commandName, args, presetCommandMeta) {
        const commandMeta = {
            id: this.history.length + 1,
            tabId,
            frameId,
            name: commandName,
            retryNumber: 0,
            args,
            startNavigationId,
        };
        if (presetCommandMeta) {
            const { commandId, startTime, sendTime, callsite, retryNumber, activeFlowHandlerId, flowCommandId, } = presetCommandMeta;
            if (commandId)
                commandMeta.id = commandId;
            commandMeta.clientSendDate = sendTime;
            commandMeta.clientStartDate = startTime;
            commandMeta.callsite = callsite;
            commandMeta.retryNumber = retryNumber;
            commandMeta.activeFlowHandlerId = activeFlowHandlerId;
            commandMeta.flowCommandId = flowCommandId;
        }
        return commandMeta;
    }
    onStart(commandMeta, startDate) {
        commandMeta.runStartDate = startDate;
        this.db.commands.insert(commandMeta);
        this.emit('start', commandMeta);
    }
    willRunCommand(newCommand) {
        // if this is a goto, set this to the "waitForLocation(change/reload)" command marker
        if (newCommand.name === 'goto') {
            this.defaultWaitForLocationCommandId = newCommand.id;
        }
        // handle cases like waitForLocation two times in a row
        if (!newCommand.name.startsWith('waitFor') || newCommand.name === 'waitForLocation') {
            // find the last "waitFor" command that is not followed by another waitFor
            const last = this.last;
            if (last && last.name.startsWith('waitFor') && last.name !== 'waitForMillis') {
                this.defaultWaitForLocationCommandId = newCommand.id;
            }
        }
    }
    onFinished(commandMeta, result, endNavigationId) {
        commandMeta.endDate = Date.now();
        commandMeta.result = result;
        commandMeta.endNavigationId = endNavigationId;
        this.db.commands.insert(commandMeta);
        this.emit('finish', commandMeta);
    }
    getCommandForTimestamp(lastCommand, timestamp) {
        let command = lastCommand;
        if (command.runStartDate <= timestamp && command.endDate > timestamp) {
            return command;
        }
        for (let i = this.history.length - 1; i >= 0; i -= 1) {
            command = this.history[i];
            if (command.runStartDate <= timestamp)
                break;
        }
        return command;
    }
    observeRemoteEvents(type, emitFn, jsPath, tabId, frameId) {
        const id = String((this.listenerIdCounter += 1));
        const details = {
            id,
            listenFn: this.onRemoteEvent.bind(this, id, emitFn, tabId, frameId),
            type,
            jsPath,
        };
        this.listenersById.set(id, details);
        return details;
    }
    getRemoteEventListener(listenerId) {
        return this.listenersById.get(listenerId);
    }
    onRemoteEvent(listenerId, listenFn, tabId, frameId, ...eventArgs) {
        listenFn(listenerId, ...eventArgs);
        const event = {
            timestamp: Date.now(),
            publishedAtCommandId: this.lastId,
            tabId,
            frameId,
            listenerId,
            eventArgs,
        };
        this.db.awaitedEvents.insert(event);
    }
}
exports.default = Commands;
//# sourceMappingURL=Commands.js.map