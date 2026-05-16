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
var _TimedCache_value, _TimedCache_expireTime;
Object.defineProperty(exports, "__esModule", { value: true });
class TimedCache {
    set value(value) {
        __classPrivateFieldSet(this, _TimedCache_value, value, "f");
        if (value !== null) {
            __classPrivateFieldSet(this, _TimedCache_expireTime, Date.now() + this.cacheSeconds * 1e3, "f");
        }
    }
    get value() {
        if (__classPrivateFieldGet(this, _TimedCache_expireTime, "f") && __classPrivateFieldGet(this, _TimedCache_expireTime, "f") < Date.now())
            __classPrivateFieldSet(this, _TimedCache_value, null, "f");
        return __classPrivateFieldGet(this, _TimedCache_value, "f");
    }
    constructor(cacheSeconds) {
        this.cacheSeconds = cacheSeconds;
        _TimedCache_value.set(this, void 0);
        _TimedCache_expireTime.set(this, void 0);
    }
}
_TimedCache_value = new WeakMap(), _TimedCache_expireTime = new WeakMap();
exports.default = TimedCache;
//# sourceMappingURL=TimedCache.js.map