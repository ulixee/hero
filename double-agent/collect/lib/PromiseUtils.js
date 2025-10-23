"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPromise = createPromise;
function createPromise(timeoutMillis, timeoutMessage) {
    const response = {
        isResolved: false,
    };
    // get parent stack
    const error = new Error(timeoutMessage || 'Timeout waiting for promise');
    response.promise = new Promise((resolve, reject) => {
        response.resolve = (...args) => {
            if (response.isResolved)
                return;
            response.isResolved = true;
            clearTimeout(response.timeout);
            resolve(...args);
        };
        response.reject = err => {
            if (response.isResolved)
                return;
            response.isResolved = true;
            clearTimeout(response.timeout);
            reject(err);
        };
        if (timeoutMillis !== undefined && timeoutMillis !== null) {
            response.timeout = setTimeout(() => response.reject(error), timeoutMillis).unref();
        }
    });
    // bind `then` and `catch` to implement the same interface as Promise
    response.then = response.promise.then.bind(response.promise);
    response.catch = response.promise.catch.bind(response.promise);
    return response;
}
//# sourceMappingURL=PromiseUtils.js.map