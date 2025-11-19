"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = debounce;
exports.length = length;
exports.all = all;
exports.first = first;
exports.last = last;
function debounce(func, wait, maxWait) {
    let timeout;
    let lastRun;
    return function runLater(...args) {
        function later() {
            timeout = undefined;
            void func(...args);
        }
        clearTimeout(timeout);
        if (maxWait && Date.now() - lastRun > maxWait) {
            void func(...args);
        }
        else {
            timeout = setTimeout(later, wait).unref();
        }
        lastRun = Date.now();
    };
}
function length(source) {
    return (async () => {
        let count = 0;
        for await (const _ of source)
            count++;
        return count;
    })();
}
function all(source) {
    return (async () => {
        const results = [];
        for await (const x of source)
            results.push(x);
        return results;
    })();
}
function first(source) {
    return (async () => {
        // eslint-disable-next-line no-unreachable-loop
        for await (const entry of source)
            return entry;
    })();
}
function last(source) {
    return (async () => {
        let item;
        for await (const entry of source)
            item = entry;
        return item;
    })();
}
//# sourceMappingURL=asyncUtils.js.map