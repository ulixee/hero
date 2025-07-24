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
var _DetachedElements_detachedElementsByName, _DetachedElements_coreSessionPromise, _DetachedElements_sessionIdPromise, _DetachedElements_rawDetailsByElement;
Object.defineProperty(exports, "__esModule", { value: true });
const DetachedElement_1 = require("./DetachedElement");
class DetachedElements {
    constructor(coreSessionPromise, sessionIdPromise) {
        _DetachedElements_detachedElementsByName.set(this, new Map());
        _DetachedElements_coreSessionPromise.set(this, void 0);
        _DetachedElements_sessionIdPromise.set(this, void 0);
        _DetachedElements_rawDetailsByElement.set(this, new Map());
        __classPrivateFieldSet(this, _DetachedElements_coreSessionPromise, coreSessionPromise, "f");
        __classPrivateFieldSet(this, _DetachedElements_sessionIdPromise, sessionIdPromise, "f");
    }
    get names() {
        return Promise.all([__classPrivateFieldGet(this, _DetachedElements_coreSessionPromise, "f"), __classPrivateFieldGet(this, _DetachedElements_sessionIdPromise, "f")]).then(async ([coreSession, sessionId]) => {
            const names = await coreSession.getCollectedAssetNames(sessionId);
            return names.elements;
        });
    }
    async getRawDetails(name) {
        if (__classPrivateFieldGet(this, _DetachedElements_detachedElementsByName, "f").has(name))
            return __classPrivateFieldGet(this, _DetachedElements_detachedElementsByName, "f").get(name);
        const [coreSession, sessionId] = await Promise.all([
            __classPrivateFieldGet(this, _DetachedElements_coreSessionPromise, "f"),
            __classPrivateFieldGet(this, _DetachedElements_sessionIdPromise, "f"),
        ]);
        const elements = await coreSession.getDetachedElements(sessionId, name);
        __classPrivateFieldGet(this, _DetachedElements_detachedElementsByName, "f").set(name, elements);
        return elements;
    }
    getRawDetailsByElement(element) {
        return __classPrivateFieldGet(this, _DetachedElements_rawDetailsByElement, "f").get(element);
    }
    async get(name) {
        const detachedElements = await this.getRawDetails(name);
        if (detachedElements.length === 0)
            return null;
        const element = DetachedElement_1.default.load(detachedElements[0].outerHTML);
        __classPrivateFieldGet(this, _DetachedElements_rawDetailsByElement, "f").set(element, detachedElements[0]);
        return element;
    }
    async getAll(name) {
        const detachedElements = await this.getRawDetails(name);
        return detachedElements.map(x => {
            const element = DetachedElement_1.default.load(x.outerHTML);
            __classPrivateFieldGet(this, _DetachedElements_rawDetailsByElement, "f").set(element, detachedElements[0]);
            return element;
        });
    }
}
_DetachedElements_detachedElementsByName = new WeakMap(), _DetachedElements_coreSessionPromise = new WeakMap(), _DetachedElements_sessionIdPromise = new WeakMap(), _DetachedElements_rawDetailsByElement = new WeakMap();
exports.default = DetachedElements;
//# sourceMappingURL=DetachedElements.js.map