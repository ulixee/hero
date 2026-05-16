"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _DomStateHandler_coreTab, _DomStateHandler_callsite, _DomStateHandler_jsPath, _DomStateHandler_idBySerializedCommand, _DomStateHandler_rawCommandsById, _DomStateHandler_waitingForResult, _DomStateHandler_commandIdCounter, _DomStateHandler_onMatchFn, _DomStateHandler_isSubscribed, _DomStateHandler_onlyRunCallbackOnMatch, _DomStateHandler_retryNumber, _DomStateHandler_flowCommandId, _DomStateHandler_flowHandlerId;
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@ulixee/commons/lib/utils");
const Timer_1 = require("@ulixee/commons/lib/Timer");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const DisconnectedError_1 = require("@ulixee/net/errors/DisconnectedError");
let counter = 0;
const NullPropertyAccessRegex = /Cannot read property '.+' of (?:null|undefined)/;
const NullPropertyAccessRegexNode16 = /Cannot read properties of (?:null|undefined) \(reading '.+'\)/;
class DomStateHandler {
    constructor(domState, name, coreTab, callsitePath, scope) {
        this.domState = domState;
        this.name = name;
        _DomStateHandler_coreTab.set(this, void 0);
        _DomStateHandler_callsite.set(this, void 0);
        _DomStateHandler_jsPath.set(this, ['dom-state', (counter += 1)]);
        _DomStateHandler_idBySerializedCommand.set(this, new Map());
        _DomStateHandler_rawCommandsById.set(this, {});
        _DomStateHandler_waitingForResult.set(this, void 0);
        _DomStateHandler_commandIdCounter.set(this, 0);
        _DomStateHandler_onMatchFn.set(this, void 0);
        _DomStateHandler_isSubscribed.set(this, false);
        _DomStateHandler_onlyRunCallbackOnMatch.set(this, false);
        _DomStateHandler_retryNumber.set(this, 0);
        _DomStateHandler_flowCommandId.set(this, void 0);
        _DomStateHandler_flowHandlerId.set(this, void 0);
        __classPrivateFieldSet(this, _DomStateHandler_coreTab, coreTab, "f");
        __classPrivateFieldSet(this, _DomStateHandler_callsite, callsitePath, "f");
        (0, utils_1.bindFunctions)(this);
        if (scope?.flowCommand) {
            __classPrivateFieldSet(this, _DomStateHandler_flowCommandId, scope.flowCommand.id, "f");
            __classPrivateFieldSet(this, _DomStateHandler_retryNumber, scope.flowCommand.retryNumber, "f");
        }
        __classPrivateFieldSet(this, _DomStateHandler_flowHandlerId, scope?.flowHandlerId, "f");
    }
    async cancel(cancelPromise) {
        __classPrivateFieldGet(this, _DomStateHandler_waitingForResult, "f")?.reject(cancelPromise);
        await this.clear(false, cancelPromise);
    }
    async register(onMatchFn, onlyRunCallbackOnMatch = false) {
        // first do a dry run of the assertions to gather all our raw commands to subscribe to
        await this.collectAssertionCommands();
        const listenArgs = {
            commands: __classPrivateFieldGet(this, _DomStateHandler_rawCommandsById, "f"),
            callsite: JSON.stringify(__classPrivateFieldGet(this, _DomStateHandler_callsite, "f")),
            name: this.name,
            url: this.domState.url,
        };
        __classPrivateFieldSet(this, _DomStateHandler_onlyRunCallbackOnMatch, onlyRunCallbackOnMatch, "f");
        __classPrivateFieldSet(this, _DomStateHandler_onMatchFn, onMatchFn, "f");
        await __classPrivateFieldGet(this, _DomStateHandler_coreTab, "f").addEventListener(__classPrivateFieldGet(this, _DomStateHandler_jsPath, "f"), 'dom-state', this.onStateChanged, listenArgs, {
            retryNumber: __classPrivateFieldGet(this, _DomStateHandler_retryNumber, "f"),
            callsite: __classPrivateFieldGet(this, _DomStateHandler_callsite, "f"),
            flowCommandId: __classPrivateFieldGet(this, _DomStateHandler_flowCommandId, "f"),
            activeFlowHandlerId: __classPrivateFieldGet(this, _DomStateHandler_flowHandlerId, "f"),
        });
        __classPrivateFieldSet(this, _DomStateHandler_isSubscribed, true, "f");
    }
    async clear(result, error) {
        if (!__classPrivateFieldGet(this, _DomStateHandler_isSubscribed, "f"))
            return;
        __classPrivateFieldSet(this, _DomStateHandler_isSubscribed, false, "f");
        await __classPrivateFieldGet(this, _DomStateHandler_coreTab, "f").removeEventListener(__classPrivateFieldGet(this, _DomStateHandler_jsPath, "f"), 'dom-state', this.onStateChanged, {
            didMatch: result,
            error,
        }, {
            retryNumber: __classPrivateFieldGet(this, _DomStateHandler_retryNumber, "f"),
            callsite: __classPrivateFieldGet(this, _DomStateHandler_callsite, "f"),
            flowCommandId: __classPrivateFieldGet(this, _DomStateHandler_flowCommandId, "f"),
            activeFlowHandlerId: __classPrivateFieldGet(this, _DomStateHandler_flowHandlerId, "f"),
        });
    }
    async check(isRetry = false) {
        if (isRetry)
            __classPrivateFieldSet(this, _DomStateHandler_retryNumber, __classPrivateFieldGet(this, _DomStateHandler_retryNumber, "f") + 1, "f");
        return await this.waitFor(30e3, true);
    }
    async waitFor(timeoutMs = 30e3, once = false) {
        const timer = new Timer_1.default(timeoutMs ?? 30e3);
        let waitError;
        let success;
        try {
            __classPrivateFieldSet(this, _DomStateHandler_waitingForResult, new Resolvable_1.default(), "f");
            await this.register((error, result) => {
                if (error)
                    __classPrivateFieldGet(this, _DomStateHandler_waitingForResult, "f").reject(error);
                else if (result || once)
                    __classPrivateFieldGet(this, _DomStateHandler_waitingForResult, "f").resolve(result);
            });
            success = await timer.waitForPromise(__classPrivateFieldGet(this, _DomStateHandler_waitingForResult, "f").promise, 'Timeout waiting for DomState');
            return success;
        }
        catch (error) {
            timer.clear();
            if (!(error instanceof DisconnectedError_1.default)) {
                waitError = error;
                throw error;
            }
        }
        finally {
            __classPrivateFieldSet(this, _DomStateHandler_waitingForResult, null, "f");
            await this.clear(success, waitError);
        }
    }
    async onStateChanged(stateResult) {
        let didResolve;
        let error;
        try {
            // intercept commands with "pushed" state when commands "run"
            didResolve = await __classPrivateFieldGet(this, _DomStateHandler_coreTab, "f").commandQueue.intercept((meta, command, ...args) => {
                const id = this.getCommandId(meta.frameId, command, args);
                return stateResult[id];
            }, async () => {
                const assertionSets = await this.createAssertionSets();
                for (const [state, assertion] of assertionSets) {
                    if (!(await this.isAssertionValid(state, assertion))) {
                        return false;
                    }
                }
                return true;
            });
        }
        catch (err) {
            error = err;
        }
        if (didResolve === false && __classPrivateFieldGet(this, _DomStateHandler_onlyRunCallbackOnMatch, "f"))
            return;
        await __classPrivateFieldGet(this, _DomStateHandler_onMatchFn, "f").call(this, error, didResolve);
    }
    async isAssertionValid(state, assertion) {
        try {
            const stateResult = await state;
            if (stateResult instanceof Error)
                throw stateResult;
            if (assertion === undefined) {
                return !!stateResult;
            }
            if (typeof assertion === 'function') {
                const didPass = assertion(stateResult);
                if (isPromise(didPass)) {
                    throw new Error(`DomState Assertions can't return promises\n\n${assertion?.toString()}`);
                }
                return didPass === true;
            }
            return assertion === stateResult;
        }
        catch (err) {
            if (NullPropertyAccessRegex.test(err) || NullPropertyAccessRegexNode16.test(err)) {
                return false;
            }
            throw err;
        }
    }
    async createAssertionSets() {
        const assertionSets = [];
        this.domState.all((statePromise, assertion) => {
            assertionSets.push([Promise.resolve(statePromise).catch(err => err), assertion]);
        });
        // wait for all to complete
        for (const assertion of assertionSets) {
            await assertion[0];
        }
        return assertionSets;
    }
    async collectAssertionCommands() {
        // run first pass where we just collect all the commands
        // we're going to get periodic updates that we're going to intercept as mock results
        let result;
        await __classPrivateFieldGet(this, _DomStateHandler_coreTab, "f").commandQueue.intercept((meta, command, ...args) => {
            const record = [meta.frameId, command, args];
            // see if already logged
            const serialized = JSON.stringify(record);
            if (__classPrivateFieldGet(this, _DomStateHandler_idBySerializedCommand, "f").has(serialized))
                return;
            __classPrivateFieldSet(this, _DomStateHandler_commandIdCounter, __classPrivateFieldGet(this, _DomStateHandler_commandIdCounter, "f") + 1, "f");
            const id = `${__classPrivateFieldGet(this, _DomStateHandler_commandIdCounter, "f")}-${command}`;
            __classPrivateFieldGet(this, _DomStateHandler_rawCommandsById, "f")[id] = record;
            __classPrivateFieldGet(this, _DomStateHandler_idBySerializedCommand, "f").set(serialized, id);
        }, async () => {
            const runCommands = [];
            // trigger a run so we can see commands that get triggered
            result = this.domState.all((statePromise) => {
                runCommands.push(Promise.resolve(statePromise).catch(() => null));
            });
            await Promise.all(runCommands);
        });
        for (const [, command] of Object.values(__classPrivateFieldGet(this, _DomStateHandler_rawCommandsById, "f"))) {
            if (command.includes('.waitFor'))
                throw new Error(`"${command}" can't be used inside a State assertion block. Use an equivalent function that checks current state - eg, waitForState(PaintingStable) -> isPaintingStable`);
        }
        if (isPromise(result)) {
            throw new Error(`DomState (${this.name ?? 'no name'}) all(assert) returns a Promise. Each state function must have synchronous assertions.`);
        }
    }
    getCommandId(frameId, command, args) {
        const key = JSON.stringify([frameId ?? null, command, args]);
        return __classPrivateFieldGet(this, _DomStateHandler_idBySerializedCommand, "f").get(key);
    }
}
_DomStateHandler_coreTab = new WeakMap(), _DomStateHandler_callsite = new WeakMap(), _DomStateHandler_jsPath = new WeakMap(), _DomStateHandler_idBySerializedCommand = new WeakMap(), _DomStateHandler_rawCommandsById = new WeakMap(), _DomStateHandler_waitingForResult = new WeakMap(), _DomStateHandler_commandIdCounter = new WeakMap(), _DomStateHandler_onMatchFn = new WeakMap(), _DomStateHandler_isSubscribed = new WeakMap(), _DomStateHandler_onlyRunCallbackOnMatch = new WeakMap(), _DomStateHandler_retryNumber = new WeakMap(), _DomStateHandler_flowCommandId = new WeakMap(), _DomStateHandler_flowHandlerId = new WeakMap();
exports.default = DomStateHandler;
function isPromise(value) {
    return !!value && typeof value === 'object' && 'then' in value && typeof 'then' === 'function';
}
//# sourceMappingURL=DomStateHandler.js.map