"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Signals {
    /**
     * Takes an array of AbortSignals and returns a single signal.
     * If any signals are aborted, the returned signal will be aborted.
     *
     *
     */
    static any(...signals) {
        const controller = new globalThis.AbortController();
        function onAbort() {
            controller.abort();
            for (const signal of signals) {
                if (signal?.removeEventListener !== null) {
                    signal.removeEventListener('abort', onAbort);
                }
            }
        }
        for (const signal of signals) {
            if (signal?.aborted === true) {
                onAbort();
                break;
            }
            if (signal?.addEventListener !== null) {
                signal.addEventListener('abort', onAbort);
            }
        }
        function clear() {
            for (const signal of signals) {
                if (signal?.removeEventListener !== null) {
                    signal.removeEventListener('abort', onAbort);
                }
            }
        }
        const signal = controller.signal;
        signal.clear = clear;
        return signal;
    }
    static timeout(timeoutMillis) {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), timeoutMillis).unref();
        return controller.signal;
    }
}
exports.default = Signals;
//# sourceMappingURL=Signals.js.map