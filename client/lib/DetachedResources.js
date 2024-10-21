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
var _DetachedResources_coreSessionPromise, _DetachedResources_sessionIdPromise;
Object.defineProperty(exports, "__esModule", { value: true });
const DetachedResource_1 = require("./DetachedResource");
class DetachedResources {
    constructor(coreSessionPromise, sessionIdPromise) {
        _DetachedResources_coreSessionPromise.set(this, void 0);
        _DetachedResources_sessionIdPromise.set(this, void 0);
        __classPrivateFieldSet(this, _DetachedResources_coreSessionPromise, coreSessionPromise, "f");
        __classPrivateFieldSet(this, _DetachedResources_sessionIdPromise, sessionIdPromise, "f");
    }
    get names() {
        return Promise.all([__classPrivateFieldGet(this, _DetachedResources_coreSessionPromise, "f"), __classPrivateFieldGet(this, _DetachedResources_sessionIdPromise, "f")]).then(async ([coreSession, sessionId]) => {
            const names = await coreSession.getCollectedAssetNames(sessionId);
            return names.resources;
        });
    }
    async get(name) {
        const [coreSession, sessionId] = await Promise.all([
            __classPrivateFieldGet(this, _DetachedResources_coreSessionPromise, "f"),
            __classPrivateFieldGet(this, _DetachedResources_sessionIdPromise, "f"),
        ]);
        const resources = await coreSession.getDetachedResources(sessionId, name);
        return resources.length ? new DetachedResource_1.default(resources[0]) : null;
    }
    async getAll(name) {
        const [coreSession, sessionId] = await Promise.all([
            __classPrivateFieldGet(this, _DetachedResources_coreSessionPromise, "f"),
            __classPrivateFieldGet(this, _DetachedResources_sessionIdPromise, "f"),
        ]);
        const resources = await coreSession.getDetachedResources(sessionId, name);
        return resources.map(x => new DetachedResource_1.default(x));
    }
}
_DetachedResources_coreSessionPromise = new WeakMap(), _DetachedResources_sessionIdPromise = new WeakMap();
exports.default = DetachedResources;
//# sourceMappingURL=DetachedResources.js.map