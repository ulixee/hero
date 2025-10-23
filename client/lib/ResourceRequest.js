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
var _ResourceRequest_request, _ResourceRequest_resourceId, _ResourceRequest_coreTab;
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResourceRequest = createResourceRequest;
class ResourceRequest {
    constructor(coreTab, request, resourceId) {
        _ResourceRequest_request.set(this, void 0);
        _ResourceRequest_resourceId.set(this, void 0);
        _ResourceRequest_coreTab.set(this, void 0);
        __classPrivateFieldSet(this, _ResourceRequest_resourceId, resourceId, "f");
        __classPrivateFieldSet(this, _ResourceRequest_request, request, "f");
        __classPrivateFieldSet(this, _ResourceRequest_coreTab, coreTab, "f");
        if (request) {
            this.headers = request.headers;
            this.url = request.url;
            this.timestamp = request.timestamp ? new Date(request.timestamp) : null;
            this.method = request.method;
        }
    }
    get postData() {
        if (__classPrivateFieldGet(this, _ResourceRequest_request, "f")?.postData)
            return Promise.resolve(__classPrivateFieldGet(this, _ResourceRequest_request, "f").postData);
        const id = __classPrivateFieldGet(this, _ResourceRequest_resourceId, "f");
        return __classPrivateFieldGet(this, _ResourceRequest_coreTab, "f").then(x => x.getResourceProperty(id, `request.postData`));
    }
}
_ResourceRequest_request = new WeakMap(), _ResourceRequest_resourceId = new WeakMap(), _ResourceRequest_coreTab = new WeakMap();
exports.default = ResourceRequest;
function createResourceRequest(coreTab, resourceMeta) {
    return new ResourceRequest(coreTab, resourceMeta.request, resourceMeta.id);
}
//# sourceMappingURL=ResourceRequest.js.map