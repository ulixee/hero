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
var _Resource_coreTabPromise, _Resource_resourceMeta;
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResource = createResource;
const TimeoutError_1 = require("@ulixee/commons/interfaces/TimeoutError");
const Timer_1 = require("@ulixee/commons/lib/Timer");
const DetachedResource_1 = require("./DetachedResource");
const internal_1 = require("./internal");
const ResourceRequest_1 = require("./ResourceRequest");
const ResourceResponse_1 = require("./ResourceResponse");
const Tab_1 = require("./Tab");
const WebsocketResource_1 = require("./WebsocketResource");
class Resource {
    get [(_Resource_coreTabPromise = new WeakMap(), _Resource_resourceMeta = new WeakMap(), internal_1.InternalPropertiesSymbol)]() {
        return {
            coreTabPromise: __classPrivateFieldGet(this, _Resource_coreTabPromise, "f"),
            resourceMeta: __classPrivateFieldGet(this, _Resource_resourceMeta, "f"),
        };
    }
    constructor(coreTabPromise, resourceMeta) {
        _Resource_coreTabPromise.set(this, void 0);
        _Resource_resourceMeta.set(this, void 0);
        __classPrivateFieldSet(this, _Resource_coreTabPromise, coreTabPromise, "f");
        __classPrivateFieldSet(this, _Resource_resourceMeta, resourceMeta, "f");
        this.id = resourceMeta.id;
        this.url = resourceMeta.url;
        this.documentUrl = resourceMeta.documentUrl;
        this.type = resourceMeta.type;
        this.isRedirect = resourceMeta.isRedirect ?? false;
        this.request = (0, ResourceRequest_1.createResourceRequest)(coreTabPromise, resourceMeta);
        this.response = (0, ResourceResponse_1.createResourceResponse)(coreTabPromise, resourceMeta);
    }
    get buffer() {
        return this.response.buffer;
    }
    get text() {
        return this.buffer.then(x => x.toString());
    }
    get json() {
        return this.text.then(JSON.parse);
    }
    async $detach() {
        const resource = await __classPrivateFieldGet(this, _Resource_coreTabPromise, "f").then(x => x.detachResource(undefined, __classPrivateFieldGet(this, _Resource_resourceMeta, "f").id));
        return new DetachedResource_1.default(resource);
    }
    async $addToDetachedResources(name) {
        await __classPrivateFieldGet(this, _Resource_coreTabPromise, "f").then(x => x.detachResource(name, __classPrivateFieldGet(this, _Resource_resourceMeta, "f").id));
        return undefined;
    }
    static async findLatest(tab, filter, options) {
        const coreTab = await (0, Tab_1.getCoreTab)(tab);
        const resourceMeta = await coreTab.findResource(filter, options);
        if (resourceMeta) {
            return createResource(Promise.resolve(coreTab), resourceMeta);
        }
        return null;
    }
    static async findAll(tab, filter, options) {
        const coreTab = await (0, Tab_1.getCoreTab)(tab);
        const resourceMetas = await coreTab.findResources(filter, options);
        if (resourceMetas) {
            return resourceMetas.map(resourceMeta => createResource(Promise.resolve(coreTab), resourceMeta));
        }
        return [];
    }
    static async waitForOne(tab, filter, options) {
        const allFilters = {
            ...filter,
            async filterFn(resource, done) {
                if (!filter.filterFn) {
                    done();
                    return true;
                }
                const response = await filter.filterFn(resource);
                if (response) {
                    done();
                    return true;
                }
                return false;
            },
        };
        const resources = await this.waitForMany(tab, allFilters, options);
        if (resources.length)
            return resources[0];
        return null;
    }
    static async waitForMany(tab, filter, options) {
        const coreTab = await (0, Tab_1.getCoreTab)(tab);
        const resources = [];
        const idsSeen = new Set();
        const timer = new Timer_1.default(options?.timeoutMs ?? 30e3);
        const startStack = new Error('').stack.slice(8); // "Error: \n" is 8 chars
        const resourceFilter = { url: filter.url, type: filter.type };
        const resourceOptions = {
            sinceCommandId: options?.sinceCommandId,
            timeoutMs: 2e3,
            throwIfTimeout: false,
        };
        let isComplete = false;
        const done = () => (isComplete = true);
        do {
            try {
                const waitForResourcePromise = coreTab.waitForResources(resourceFilter, resourceOptions);
                const foundResources = await timer.waitForPromise(waitForResourcePromise, 'Timeout waiting for Resource(s)');
                resourceOptions.sinceCommandId = coreTab.commandQueue.lastCommandId;
                for (const resourceMeta of foundResources) {
                    if (idsSeen.has(resourceMeta.id))
                        continue;
                    idsSeen.add(resourceMeta.id);
                    const resource = createResource(Promise.resolve(coreTab), resourceMeta);
                    let shouldInclude = true;
                    if (filter.filterFn) {
                        // resources can trigger commandQueue functions, so time them out
                        shouldInclude = await timer.waitForPromise(Promise.resolve(filter.filterFn(resource, done)), 'Timeout waiting for waitResource.filterFn');
                    }
                    if (shouldInclude)
                        resources.push(resource);
                    if (isComplete)
                        break;
                }
            }
            catch (err) {
                if (err instanceof TimeoutError_1.default) {
                    if (options?.throwIfTimeout === false) {
                        return resources;
                    }
                }
                coreTab.commandQueue.appendTrace(err, startStack);
                coreTab.commandQueue.decorateErrorStack(err);
                throw err;
            }
            // if no filter callback provided, break after 1 found
            if (!filter.filterFn && resources.length) {
                done();
            }
        } while (!isComplete);
        return resources;
    }
}
exports.default = Resource;
function createResource(coreTab, resourceMeta) {
    if (resourceMeta.type === 'Websocket') {
        return (0, WebsocketResource_1.createWebsocketResource)(resourceMeta, coreTab);
    }
    return new Resource(coreTab, resourceMeta);
}
//# sourceMappingURL=Resource.js.map