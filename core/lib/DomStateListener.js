"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@ulixee/commons/lib/utils");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const crypto_1 = require("crypto");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const CommandRunner_1 = require("./CommandRunner");
const { log } = (0, Logger_1.default)(module);
class DomStateListener extends eventUtils_1.TypedEventEmitter {
    get hasCommands() {
        return this.commandFnsById.size > 0;
    }
    constructor(jsPathId, options, tab) {
        super();
        this.jsPathId = jsPathId;
        this.options = options;
        this.tab = tab;
        this.id = 'default';
        this.rawBatchAssertionsById = new Map();
        this.batchAssertionsById = new Map();
        this.commandFnsById = new Map();
        this.isStopping = false;
        this.isCheckingState = false;
        this.runAgainTime = 0;
        this.watchedFrameIds = new Set();
        this.events = new EventSubscriber_1.default();
        (0, utils_1.bindFunctions)(this);
        const key = [options.name, options.url].filter(Boolean);
        if (options.callsite) {
            key.push((0, crypto_1.createHash)('md5').update(`${options.callsite}`).digest('hex'));
        }
        this.id = key.join('-');
        this.name = options.name;
        this.url = options.url;
        this.logger = log.createChild(module, {
            sessionId: tab.sessionId,
        });
        const commands = tab.session.commands;
        // make sure to clear out any meta
        commands.presetMeta = null;
        this.startingCommandId = commands.lastId;
        this.commandStartTime = commands.last.runStartDate;
        const previousCommand = commands.history[commands.history.length - 2];
        // go one ms after the previous command
        this.startTime = previousCommand ? previousCommand.runStartDate + 1 : Date.now();
        this.events.once(tab, 'close', this.stop);
        this.bindFrameEvents();
        this.checkInterval = setInterval(this.validateState, 2e3).unref();
    }
    stop(result) {
        clearTimeout(this.checkInterval);
        if (this.isStopping)
            return;
        this.isStopping = true;
        this.removeAllListeners('state');
        this.emit('resolved', {
            didMatch: result?.didMatch ?? false,
            error: result?.error,
        });
        this.events.close();
    }
    async runBatchAssert(batchId) {
        const failCounts = {
            url: 0,
            resource: [],
            dom: 0,
            storage: 0,
        };
        const { domAssertionsByFrameId, assertions, totalAssertions, minValidAssertions } = this.batchAssertionsById.get(batchId);
        for (const assertion of assertions) {
            const [frameId, assertType, args, comparison, result] = assertion;
            if (assertType === 'url') {
                const frame = this.tab.frameEnvironmentsById.get(frameId) ?? this.tab.mainFrameEnvironment;
                const url = frame.url;
                if (url !== result)
                    failCounts.url += 1;
            }
            if (assertType === 'resource') {
                const filter = args[0];
                const resource = this.tab.findResource(filter);
                if (comparison === '!!' && !resource)
                    failCounts.resource.push(filter);
            }
            if (assertType === 'storage') {
                const [filter, prop] = args;
                const storage = this.tab.findStorageChange(filter);
                if (comparison === '!!' && !storage)
                    failCounts.storage += 1;
                if (comparison === '===' && prop) {
                    if (!storage || storage[prop] !== result)
                        failCounts.storage += 1;
                }
            }
        }
        for (const [frameId, frameAssertions] of domAssertionsByFrameId) {
            const frame = this.tab.frameEnvironmentsById.get(frameId);
            const failedDomAssertions = await frame.runDomAssertions(batchId, frameAssertions);
            failCounts.dom += failedDomAssertions;
        }
        const failedCount = failCounts.url + failCounts.resource.length + failCounts.dom + failCounts.storage;
        const validAssertions = totalAssertions - failedCount;
        this.logger.stats('BatchAssert results', {
            batchId,
            validAssertions,
            minValidAssertions,
            failCounts,
        });
        return validAssertions >= minValidAssertions;
    }
    addAssertionBatch(batch) {
        let batchId = batch.id;
        for (const id of this.batchAssertionsById.keys()) {
            if (id.endsWith(`${batch.id}.json`)) {
                batchId = id;
                break;
            }
        }
        const args = [
            batchId,
            JSON.parse(this.jsPathId),
            batch.assertions,
            batch.minValidAssertions,
            this.name,
        ];
        this.trackCommand(batchId, this.tab.mainFrameId, 'Tab.assert', args);
        this.batchAssertionsById.set(batchId, {
            assertions: [],
            domAssertionsByFrameId: new Map(),
            totalAssertions: batch.assertions.length,
            minValidAssertions: batch.minValidAssertions ?? batch.assertions.length,
        });
        const entry = this.batchAssertionsById.get(batchId);
        const { domAssertionsByFrameId } = entry;
        let domAssertionCount = 0;
        for (const assertion of batch.assertions) {
            const [frameId, type] = assertion;
            if (type === 'xpath' || type === 'jspath') {
                if (!domAssertionsByFrameId.has(frameId))
                    domAssertionsByFrameId.set(frameId, []);
                domAssertionsByFrameId.get(frameId).push(assertion);
                domAssertionCount += 1;
            }
            else {
                // make a copy
                const record = [...assertion];
                if (record[2])
                    record[2] = [...record[2]].map(x => {
                        if (typeof x === 'object')
                            return { ...x };
                        return x;
                    });
                entry.assertions.push(record);
            }
        }
        this.logger.stats('Loading BatchAssert', {
            batchId,
            minValidAssertions: batch.minValidAssertions,
            domAssertionCount,
            otherAssertions: entry.assertions,
        });
        return batchId;
    }
    bindFrameEvents() {
        for (const [id, rawCommand] of Object.entries(this.options.commands)) {
            const [frameId, command, args] = rawCommand;
            this.trackCommand(id, frameId, command, args);
        }
        setImmediate(this.validateState);
    }
    trackCommand(id, frameId, command, args) {
        const frame = this.tab.getFrameEnvironment(frameId);
        const commandRunner = new CommandRunner_1.default(command, args, {
            FrameEnvironment: frame,
            Tab: this.tab,
            Session: this.tab.session,
        });
        commandRunner.shouldRecord = false;
        this.commandFnsById.set(id, commandRunner.runFn);
        if (!this.watchedFrameIds.has(frame.id)) {
            this.watchedFrameIds.add(frame.id);
            this.events.on(frame, 'paint', this.validateState);
            this.events.on(frame.navigations, 'status-change', this.validateState);
        }
    }
    publishResult(results) {
        if (this.shouldStop())
            return;
        const stringifiedResults = JSON.stringify(results);
        if (this.lastResults !== stringifiedResults) {
            this.emit('updated', results);
        }
        this.lastResults = stringifiedResults;
    }
    async validateState() {
        if (this.shouldStop())
            return;
        if (this.isCheckingState) {
            this.runAgainTime = Date.now();
            return;
        }
        try {
            this.isCheckingState = true;
            this.runAgainTime = 0;
            const results = {};
            const promises = [...this.commandFnsById].map(async ([id, runCommandFn]) => {
                results[id] = await runCommandFn().catch(err => err);
            });
            await Promise.all(promises);
            this.publishResult(results);
        }
        finally {
            this.isCheckingState = false;
            if (this.runAgainTime > 0)
                setTimeout(this.validateState, Date.now() - this.runAgainTime).unref();
        }
    }
    shouldStop() {
        return this.tab.isClosing || this.isStopping === true;
    }
}
exports.default = DomStateListener;
//# sourceMappingURL=DomStateListener.js.map