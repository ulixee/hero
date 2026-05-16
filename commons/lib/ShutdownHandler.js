"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("./Logger");
const IPendingWaitEvent_1 = require("../interfaces/IPendingWaitEvent");
const { log } = (0, Logger_1.default)(module);
class ShutdownHandler {
    static register(onShutdownFn, runWithDisabledSignals) {
        this.registerSignals();
        const callsite = new Error().stack.split(/\r?\n/).slice(2, 3).shift().trim();
        this.onShutdownFns.push({ fn: onShutdownFn, callsite, runWithDisabledSignals });
    }
    static unregister(onShutdownFn) {
        const match = this.onShutdownFns.findIndex(x => x.fn === onShutdownFn);
        if (match >= 0)
            this.onShutdownFns.splice(match, 1);
    }
    static run() {
        return this.onSignal('exit', null, true);
    }
    static registerSignals() {
        if (!this.isRegistered) {
            this.isRegistered = true;
            process.once('beforeExit', code => ShutdownHandler.onSignal('beforeExit', code));
            process.once('exit', code => ShutdownHandler.onSignal('exit', code));
            process.once('SIGTERM', ShutdownHandler.onSignal.bind(this));
            process.once('SIGINT', ShutdownHandler.onSignal.bind(this));
            process.once('SIGQUIT', ShutdownHandler.onSignal.bind(this));
        }
    }
    static async onSignal(signal, code, isManual = false) {
        if (this.hasRunHandlers)
            return;
        this.hasRunHandlers = true;
        const parentLogId = log.stats('ShutdownHandler.onSignal', {
            signal,
            sessionId: null,
        });
        const keepList = [];
        while (this.onShutdownFns.length) {
            const entry = this.onShutdownFns.shift();
            if (this.disableSignals && !isManual && !entry.runWithDisabledSignals) {
                keepList.push(entry);
                continue;
            }
            log.stats('ShutdownHandler.execute', {
                signal,
                fn: entry.fn.toString(),
                callsite: entry.callsite,
                sessionId: null,
            });
            try {
                await entry.fn(signal);
            }
            catch (error) {
                if (error instanceof IPendingWaitEvent_1.CanceledPromiseError)
                    continue;
                log.warn('ShutdownHandler.errorShuttingDown', {
                    error,
                    sessionId: null,
                });
            }
        }
        this.onShutdownFns.push(...keepList);
        log.stats('ShutdownHandler.shutdownComplete', {
            signal,
            exiting: this.exitOnSignal,
            sessionId: null,
            parentLogId,
        });
        if (this.exitOnSignal) {
            process.exit(code ?? 1);
        }
    }
}
ShutdownHandler.exitOnSignal = false;
ShutdownHandler.disableSignals = false;
ShutdownHandler.isRegistered = false;
ShutdownHandler.hasRunHandlers = false;
ShutdownHandler.onShutdownFns = [];
exports.default = ShutdownHandler;
//# sourceMappingURL=ShutdownHandler.js.map