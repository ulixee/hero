"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TimeoutError_1 = require("../interfaces/TimeoutError");
let idCounter = 0;
class Resolvable {
    constructor(timeoutMillis, timeoutMessage) {
        // eslint-disable-next-line no-multi-assign
        this.id = (idCounter += 1);
        this.isResolved = false;
        // get parent stack
        this.stack = new Error('').stack.slice(8);
        this.promise = new Promise((resolve, reject) => {
            this.resolveFn = resolve;
            this.rejectFn = reject;
        });
        if (timeoutMillis !== undefined && timeoutMillis !== null) {
            this.timeout = setTimeout(this.rejectWithTimeout.bind(this, timeoutMessage), timeoutMillis).unref();
        }
        this.resolve = this.resolve.bind(this);
        this.reject = this.reject.bind(this);
    }
    resolve(value) {
        if (this.isResolved)
            return;
        clearTimeout(this.timeout);
        this.resolveFn(value);
        this.isResolved = true;
        this.clean();
        if (value && typeof value === 'object' && 'then' in value && typeof value.then === 'function') {
            void Promise.resolve(value)
                // eslint-disable-next-line promise/always-return
                .then(x => {
                this.resolved = x;
            })
                .catch(this.reject);
        }
        else {
            this.resolved = value;
        }
    }
    reject(error, noUnhandledRejections = false) {
        if (this.isResolved)
            return;
        this.isResolved = true;
        if (noUnhandledRejections) {
            // eslint-disable-next-line promise/no-promise-in-callback
            this.promise.catch(() => null);
        }
        this.rejectFn(error);
        this.clean();
    }
    toJSON() {
        return {
            isResolved: this.isResolved,
            resolved: this.resolved,
        };
    }
    then(onfulfilled, onrejected) {
        return this.promise.then(onfulfilled, onrejected);
    }
    catch(onrejected) {
        return this.promise.catch(onrejected);
    }
    finally(onfinally) {
        return this.promise.finally(onfinally);
    }
    clean() {
        clearTimeout(this.timeout);
        this.resolveFn = null;
        this.rejectFn = null;
    }
    rejectWithTimeout(message) {
        const error = new TimeoutError_1.default(message);
        error.stack = `TimeoutError: ${message}\n${this.stack}`;
        this.reject(error, true);
    }
}
exports.default = Resolvable;
//# sourceMappingURL=Resolvable.js.map