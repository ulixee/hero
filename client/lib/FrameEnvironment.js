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
var _FrameEnvironment_hero, _FrameEnvironment_tab, _FrameEnvironment_coreFramePromise;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoreFrameEnvironmentForPosition = getCoreFrameEnvironmentForPosition;
exports.createFrame = createFrame;
const StateMachine_1 = require("@ulixee/awaited-dom/base/StateMachine");
const AwaitedPath_1 = require("@ulixee/awaited-dom/base/AwaitedPath");
const XPathResult_1 = require("@ulixee/awaited-dom/impl/official-klasses/XPathResult");
const create_1 = require("@ulixee/awaited-dom/impl/create");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
const Request_1 = require("./Request");
const CookieStorage_1 = require("./CookieStorage");
const SetupAwaitedHandler_1 = require("./SetupAwaitedHandler");
const Tab_1 = require("./Tab");
const Resource_1 = require("./Resource");
const internal_1 = require("./internal");
const awaitedPathState = (0, StateMachine_1.default)();
class FrameEnvironment {
    get [(_FrameEnvironment_hero = new WeakMap(), _FrameEnvironment_tab = new WeakMap(), _FrameEnvironment_coreFramePromise = new WeakMap(), internal_1.InternalPropertiesSymbol)]() {
        return {
            coreFramePromise: __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f"),
        };
    }
    constructor(hero, tab, coreFramePromise) {
        _FrameEnvironment_hero.set(this, void 0);
        _FrameEnvironment_tab.set(this, void 0);
        _FrameEnvironment_coreFramePromise.set(this, void 0);
        __classPrivateFieldSet(this, _FrameEnvironment_hero, hero, "f");
        __classPrivateFieldSet(this, _FrameEnvironment_tab, tab, "f");
        __classPrivateFieldSet(this, _FrameEnvironment_coreFramePromise, coreFramePromise, "f");
        async function sendToFrameEnvironment(pluginId, ...args) {
            return (await coreFramePromise).commandQueue.run('FrameEnvironment.runPluginCommand', pluginId, args);
        }
        for (const clientPlugin of hero[internal_1.InternalPropertiesSymbol].clientPlugins) {
            if (clientPlugin.onFrameEnvironment)
                clientPlugin.onFrameEnvironment(hero, this, sendToFrameEnvironment);
        }
    }
    get isMainFrame() {
        return this.parentFrameId.then(x => !x);
    }
    get frameId() {
        return __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f").then(x => x.frameId);
    }
    get children() {
        return __classPrivateFieldGet(this, _FrameEnvironment_tab, "f").frameEnvironments.then(async (frames) => {
            const frameId = await this.frameId;
            const childFrames = [];
            for (const frame of frames) {
                const parentFrameId = await frame.parentFrameId;
                if (parentFrameId === frameId) {
                    childFrames.push(frame);
                }
            }
            return childFrames;
        });
    }
    get url() {
        return __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f").then(x => x.getUrl());
    }
    get isPaintingStable() {
        return __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f").then(x => x.isPaintingStable());
    }
    get isDomContentLoaded() {
        return __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f").then(x => x.isDomContentLoaded());
    }
    get isAllContentLoaded() {
        return __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f").then(x => x.isAllContentLoaded());
    }
    get name() {
        return __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f").then(x => x.getFrameMeta()).then(x => x.name);
    }
    get parentFrameId() {
        return __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f").then(x => x.parentFrameId);
    }
    get cookieStorage() {
        return (0, CookieStorage_1.createCookieStorage)(__classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f"));
    }
    get document() {
        const awaitedPath = new AwaitedPath_1.default(null, 'document');
        const awaitedOptions = { coreFrame: __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f") };
        return (0, create_1.createSuperDocument)(awaitedPath, awaitedOptions);
    }
    get localStorage() {
        const awaitedPath = new AwaitedPath_1.default(null, 'localStorage');
        const awaitedOptions = { coreFrame: __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f") };
        return (0, create_1.createStorage)(awaitedPath, awaitedOptions);
    }
    get sessionStorage() {
        const awaitedPath = new AwaitedPath_1.default(null, 'sessionStorage');
        const awaitedOptions = { coreFrame: __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f") };
        return (0, create_1.createStorage)(awaitedPath, awaitedOptions);
    }
    get Request() {
        return (0, Request_1.default)(__classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f"));
    }
    // METHODS
    async fetch(request, init) {
        const requestInput = await (0, Request_1.getRequestIdOrUrl)(request);
        const coreFrame = await __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f");
        const nodePointer = await coreFrame.fetch(requestInput, init);
        const awaitedPath = new AwaitedPath_1.default(null).withNodeId(null, nodePointer.id);
        return (0, create_1.createResponse)(awaitedPath, { coreFrame: __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f") });
    }
    async getFrameEnvironment(element) {
        return await __classPrivateFieldGet(this, _FrameEnvironment_tab, "f").getFrameEnvironment(element);
    }
    getComputedStyle(element, pseudoElement) {
        const { awaitedPath: elementAwaitedPath, awaitedOptions } = awaitedPathState.getState(element);
        const awaitedPath = new AwaitedPath_1.default(null, 'window', [
            'getComputedStyle',
            (0, SetupAwaitedHandler_1.getAwaitedPathAsMethodArg)(elementAwaitedPath),
            pseudoElement,
        ]);
        return (0, create_1.createCSSStyleDeclaration)(awaitedPath, awaitedOptions);
    }
    async getComputedVisibility(node) {
        if (!node)
            return { isVisible: false, nodeExists: false, isClickable: false };
        const coreFrame = await __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f");
        return await coreFrame.getComputedVisibility(node);
    }
    // @deprecated 2021-04-30: Replaced with getComputedVisibility
    async isElementVisible(element) {
        return await this.getComputedVisibility(element).then(x => x.isVisible);
    }
    async getJsValue(path) {
        const coreFrame = await __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f");
        return coreFrame.getJsValue(path);
    }
    querySelector(selector) {
        const awaitedPath = new AwaitedPath_1.default(null, 'document', ['querySelector', selector]);
        const awaitedOptions = { coreFrame: __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f") };
        return (0, create_1.createSuperNode)(awaitedPath, awaitedOptions);
    }
    querySelectorAll(selector) {
        const awaitedPath = new AwaitedPath_1.default(null, 'document', ['querySelectorAll', selector]);
        const awaitedOptions = { coreFrame: __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f") };
        return (0, create_1.createSuperNodeList)(awaitedPath, awaitedOptions);
    }
    xpathSelector(xpath, orderedNodeResults = false) {
        return this.document.evaluate(xpath, this.document, null, orderedNodeResults
            ? XPathResult_1.default.FIRST_ORDERED_NODE_TYPE
            : XPathResult_1.default.ANY_UNORDERED_NODE_TYPE).singleNodeValue;
    }
    async xpathSelectorAll(xpath, orderedNodeResults = false) {
        const results = await this.document.evaluate(xpath, this.document, null, orderedNodeResults
            ? XPathResult_1.default.ORDERED_NODE_SNAPSHOT_TYPE
            : XPathResult_1.default.UNORDERED_NODE_SNAPSHOT_TYPE);
        const nodeLength = await results.snapshotLength;
        const nodes = [];
        for (let i = 0; i < nodeLength; i++) {
            nodes.push(results.snapshotItem(i));
        }
        return nodes;
    }
    async waitForPaintingStable(options) {
        const coreFrame = await __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f");
        await coreFrame.waitForLoad(Location_1.LocationStatus.PaintingStable, options);
    }
    async waitForLoad(status, options) {
        const coreFrame = await __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f");
        await coreFrame.waitForLoad(status, options);
    }
    async waitForElement(element, options) {
        const coreFrame = await __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f");
        return await coreFrame.waitForElement(element, options);
    }
    async waitForLocation(trigger, options) {
        const coreFrame = await __classPrivateFieldGet(this, _FrameEnvironment_coreFramePromise, "f");
        const resourceMeta = await coreFrame.waitForLocation(trigger, options);
        const coreTab = (0, Tab_1.getCoreTab)(__classPrivateFieldGet(this, _FrameEnvironment_tab, "f"));
        return (0, Resource_1.createResource)(coreTab, resourceMeta);
    }
    toJSON() {
        // return empty so we can avoid infinite "stringifying" in jest
        return {
            type: this.constructor.name,
        };
    }
}
exports.default = FrameEnvironment;
function getCoreFrameEnvironmentForPosition(mousePosition) {
    const state = awaitedPathState.getState(mousePosition);
    if (!state)
        return;
    return state?.awaitedOptions?.coreFrame;
}
// CREATE
function createFrame(hero, tab, coreFrame) {
    return new FrameEnvironment(hero, tab, coreFrame);
}
//# sourceMappingURL=FrameEnvironment.js.map