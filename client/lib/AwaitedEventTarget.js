"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AwaitedEventTarget {
    constructor(getEventTarget) {
        this.getEventTarget = getEventTarget;
    }
    async addEventListener(eventType, listenerFn, options) {
        const { target, jsPath } = await this.getEventTarget();
        const awaitedTarget = await target;
        if (!awaitedTarget)
            return;
        return awaitedTarget.addEventListener(jsPath, eventType, listenerFn, options);
    }
    async removeEventListener(eventType, listenerFn) {
        const { target, jsPath } = await this.getEventTarget();
        const awaitedTarget = await target;
        if (!awaitedTarget)
            return;
        return awaitedTarget.removeEventListener(jsPath, eventType, listenerFn);
    }
    // aliases
    on(eventType, listenerFn, options) {
        return this.addEventListener(eventType, listenerFn, options);
    }
    off(eventType, listenerFn) {
        return this.removeEventListener(eventType, listenerFn);
    }
    once(eventType, listenerFn, options) {
        const wrappedListener = (...args) => {
            listenerFn.call(this, ...args);
            return this.removeEventListener(eventType, listenerFn);
        };
        return this.addEventListener(eventType, wrappedListener, options);
    }
}
exports.default = AwaitedEventTarget;
//# sourceMappingURL=AwaitedEventTarget.js.map