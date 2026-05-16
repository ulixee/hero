"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _DetachedResource_detachedResource;
Object.defineProperty(exports, "__esModule", { value: true });
class DetachedResource {
    get buffer() {
        return this.response.buffer;
    }
    get json() {
        if (this.buffer)
            return JSON.parse(this.buffer.toString());
        return null;
    }
    get text() {
        return this.buffer?.toString();
    }
    constructor(detachedResource) {
        _DetachedResource_detachedResource.set(this, void 0);
        __classPrivateFieldSet(this, _DetachedResource_detachedResource, detachedResource, "f");
        const resource = detachedResource.resource;
        this.messages = detachedResource.websocketMessages;
        Object.assign(this, resource);
        this.response = resource.response ?? {};
        Object.defineProperties(resource.response, {
            json: { get: () => this.json, enumerable: true },
            text: { get: () => this.text, enumerable: true },
        });
        this.request = resource.request;
    }
}
_DetachedResource_detachedResource = new WeakMap();
exports.default = DetachedResource;
//# sourceMappingURL=DetachedResource.js.map