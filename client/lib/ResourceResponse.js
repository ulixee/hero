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
var _ResourceResponse_coreTab, _ResourceResponse_resourceId, _ResourceResponse_response;
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResourceResponse = createResourceResponse;
class ResourceResponse {
    constructor(coreTab, response, resourceId) {
        _ResourceResponse_coreTab.set(this, void 0);
        _ResourceResponse_resourceId.set(this, void 0);
        _ResourceResponse_response.set(this, void 0);
        __classPrivateFieldSet(this, _ResourceResponse_coreTab, coreTab, "f");
        __classPrivateFieldSet(this, _ResourceResponse_response, response, "f");
        __classPrivateFieldSet(this, _ResourceResponse_resourceId, resourceId, "f");
        if (response) {
            this.url = response.url;
            this.timestamp = response.timestamp ? new Date(response.timestamp) : null;
            this.headers = response.headers;
            this.trailers = response.trailers;
            this.browserServedFromCache = response.browserServedFromCache;
            this.browserLoadedTime = response.browserLoadedTime
                ? new Date(response.browserLoadedTime)
                : null;
            this.browserLoadFailure = response.browserLoadFailure;
            this.statusCode = response.statusCode;
            this.statusMessage = response.statusMessage;
            this.remoteAddress = response.remoteAddress;
            this.bodyBytes = response.bodyBytes;
        }
    }
    get buffer() {
        if (__classPrivateFieldGet(this, _ResourceResponse_response, "f")?.buffer)
            return Promise.resolve(__classPrivateFieldGet(this, _ResourceResponse_response, "f").buffer);
        const id = __classPrivateFieldGet(this, _ResourceResponse_resourceId, "f");
        return __classPrivateFieldGet(this, _ResourceResponse_coreTab, "f").then(x => x.getResourceProperty(id, `response.buffer`));
    }
    get text() {
        return this.buffer.then(x => x?.toString());
    }
    get json() {
        return this.text.then(JSON.parse);
    }
}
_ResourceResponse_coreTab = new WeakMap(), _ResourceResponse_resourceId = new WeakMap(), _ResourceResponse_response = new WeakMap();
exports.default = ResourceResponse;
function createResourceResponse(coreTab, resourceMeta) {
    return new ResourceResponse(coreTab, resourceMeta.response, resourceMeta.id);
}
//# sourceMappingURL=ResourceResponse.js.map