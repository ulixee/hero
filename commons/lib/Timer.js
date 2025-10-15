"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const TimeoutError_1 = require("../interfaces/TimeoutError");
const Resolvable_1 = require("./Resolvable");
class Timer {
    constructor(timeoutMillis, registry) {
        this.timeoutMillis = timeoutMillis;
        this.registry = registry;
        this[_a] = 'Timer';
        this.time = process.hrtime();
        this.timeoutMessage = 'Timeout waiting';
        this.expirePromise = new Resolvable_1.default();
        // NOTE: A zero value will NOT timeout. This is to give users an ability to not timeout certain requests
        this.timeout =
            timeoutMillis > 0 ? setTimeout(this.expire.bind(this), timeoutMillis).unref() : null;
        if (registry && this.timeout) {
            registry.push({ reject: this.expirePromise.reject, timeout: this.timeout });
        }
    }
    setMessage(message) {
        this.timeoutMessage = message;
    }
    clear() {
        if (this.registry) {
            const idx = this.registry.findIndex(x => x.timeout === this.timeout);
            if (idx >= 0)
                this.registry.splice(idx, 1);
        }
        clearTimeout(this.timeout);
    }
    throwIfExpired(message) {
        if (this.isExpired()) {
            this.clear();
            throw new TimeoutError_1.default(message ?? this.timeoutMessage);
        }
    }
    isExpired() {
        return this.elapsedMillis() >= this.timeoutMillis;
    }
    isResolved() {
        return this.expirePromise.isResolved;
    }
    elapsedMillis() {
        const time = process.hrtime(this.time);
        return time[0] * 1000 + time[1] / 1000000;
    }
    async waitForPromise(promise, message) {
        this.timeoutMessage = message;
        const timeout = new TimeoutError_1.default(this.timeoutMessage);
        const result = await Promise.race([promise, this.expirePromise.then(() => timeout)]);
        if (result instanceof TimeoutError_1.default)
            throw timeout;
        return result;
    }
    waitForTimeout() {
        // wait for promise to expire
        return this.expirePromise.promise;
    }
    expire() {
        this.expirePromise.resolve();
        this.clear();
    }
    static expireAll(registry, error) {
        // clear any pending timeouts
        while (registry.length) {
            const next = registry.shift();
            if (next) {
                const { timeout, reject } = next;
                clearTimeout(timeout);
                reject(error, true);
            }
        }
    }
}
_a = Symbol.toStringTag;
exports.default = Timer;
//# sourceMappingURL=Timer.js.map