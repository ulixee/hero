"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _WebsocketResource_awaitedPath, _WebsocketResource_coreTabPromise, _WebsocketResource_resourceMeta;
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebsocketResource = createWebsocketResource;
const AwaitedPath_1 = require("@ulixee/awaited-dom/base/AwaitedPath");
const DetachedResource_1 = require("./DetachedResource");
const ResourceRequest_1 = require("./ResourceRequest");
const ResourceResponse_1 = require("./ResourceResponse");
const AwaitedEventTarget_1 = require("./AwaitedEventTarget");
const internal_1 = require("./internal");
const subscribeErrorMessage = `Websocket responses do not have a body. To retrieve messages, subscribe to events: on('message', ...)`;
class WebsocketResource extends AwaitedEventTarget_1.default {
    get [(_WebsocketResource_awaitedPath = new WeakMap(), _WebsocketResource_coreTabPromise = new WeakMap(), _WebsocketResource_resourceMeta = new WeakMap(), internal_1.InternalPropertiesSymbol)]() {
        return {
            coreTabPromise: __classPrivateFieldGet(this, _WebsocketResource_coreTabPromise, "f"),
            resourceMeta: __classPrivateFieldGet(this, _WebsocketResource_resourceMeta, "f"),
        };
    }
    constructor(coreTabPromise, resourceMeta) {
        super(() => {
            return {
                target: __classPrivateFieldGet(this, _WebsocketResource_coreTabPromise, "f"),
                jsPath: __classPrivateFieldGet(this, _WebsocketResource_awaitedPath, "f").toJSON(),
            };
        });
        this.type = 'Websocket';
        _WebsocketResource_awaitedPath.set(this, void 0);
        _WebsocketResource_coreTabPromise.set(this, void 0);
        _WebsocketResource_resourceMeta.set(this, void 0);
        this.request = (0, ResourceRequest_1.createResourceRequest)(coreTabPromise, resourceMeta);
        this.response = (0, ResourceResponse_1.createResourceResponse)(coreTabPromise, resourceMeta);
        __classPrivateFieldSet(this, _WebsocketResource_awaitedPath, new AwaitedPath_1.default(null, 'resources', String(resourceMeta.id)), "f");
        __classPrivateFieldSet(this, _WebsocketResource_coreTabPromise, coreTabPromise, "f");
        __classPrivateFieldSet(this, _WebsocketResource_resourceMeta, resourceMeta, "f");
        this.url = resourceMeta.url;
        this.documentUrl = resourceMeta.documentUrl;
        this.isRedirect = resourceMeta.isRedirect ?? false;
    }
    get messages() {
        const resource = __classPrivateFieldGet(this, _WebsocketResource_resourceMeta, "f");
        if ('messages' in resource) {
            return Promise.resolve(resource.messages);
        }
        return __classPrivateFieldGet(this, _WebsocketResource_coreTabPromise, "f").then(x => x.getResourceProperty(resource.id, 'messages'));
    }
    get buffer() {
        throw new Error(subscribeErrorMessage);
    }
    get text() {
        throw new Error(subscribeErrorMessage);
    }
    get json() {
        throw new Error(subscribeErrorMessage);
    }
    async $detach() {
        const resource = await __classPrivateFieldGet(this, _WebsocketResource_coreTabPromise, "f").then(x => x.detachResource(undefined, __classPrivateFieldGet(this, _WebsocketResource_resourceMeta, "f").id));
        return new DetachedResource_1.default(resource);
    }
    async $addToDetachedResources(name) {
        await __classPrivateFieldGet(this, _WebsocketResource_coreTabPromise, "f").then(x => x.detachResource(name, __classPrivateFieldGet(this, _WebsocketResource_resourceMeta, "f").id));
        return undefined;
    }
}
exports.default = WebsocketResource;
function createWebsocketResource(resourceMeta, coreTab) {
    return new WebsocketResource(coreTab, resourceMeta);
}
//# sourceMappingURL=WebsocketResource.js.map