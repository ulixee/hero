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
var _Tab_instances, _Tab_hero, _Tab_mainFrameEnvironment, _Tab_frameEnvironments, _Tab_coreTabPromise, _Tab_callsiteLocator, _Tab_coreTabOrReject_get, _Tab_getOrCreateFrameEnvironment, _Tab_getRefreshedFrameEnvironments;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoreTab = getCoreTab;
exports.createTab = createTab;
const StateMachine_1 = require("@ulixee/awaited-dom/base/StateMachine");
const addGlobalInstance_1 = require("@ulixee/commons/lib/addGlobalInstance");
const Resource_1 = require("./Resource");
const AwaitedEventTarget_1 = require("./AwaitedEventTarget");
const FrameEnvironment_1 = require("./FrameEnvironment");
const FileChooser_1 = require("./FileChooser");
const internal_1 = require("./internal");
const awaitedPathState = (0, StateMachine_1.default)();
class Tab extends AwaitedEventTarget_1.default {
    get [(_Tab_hero = new WeakMap(), _Tab_mainFrameEnvironment = new WeakMap(), _Tab_frameEnvironments = new WeakMap(), _Tab_coreTabPromise = new WeakMap(), _Tab_callsiteLocator = new WeakMap(), _Tab_instances = new WeakSet(), _Tab_coreTabOrReject_get = function _Tab_coreTabOrReject_get() {
        return __classPrivateFieldGet(this, _Tab_coreTabPromise, "f").then(x => {
            if (x instanceof Error)
                throw x;
            return x;
        });
    }, internal_1.InternalPropertiesSymbol)]() {
        return {
            coreTabPromise: __classPrivateFieldGet(this, _Tab_coreTabPromise, "f"),
        };
    }
    constructor(hero, coreTabPromise, callsiteLocator) {
        super(() => {
            return { target: coreTabPromise };
        });
        _Tab_instances.add(this);
        _Tab_hero.set(this, void 0);
        _Tab_mainFrameEnvironment.set(this, void 0);
        _Tab_frameEnvironments.set(this, void 0);
        _Tab_coreTabPromise.set(this, void 0);
        _Tab_callsiteLocator.set(this, void 0);
        __classPrivateFieldSet(this, _Tab_hero, hero, "f");
        __classPrivateFieldSet(this, _Tab_mainFrameEnvironment, new FrameEnvironment_1.default(hero, this, coreTabPromise.then(x => x.mainFrameEnvironment)), "f");
        __classPrivateFieldSet(this, _Tab_frameEnvironments, [__classPrivateFieldGet(this, _Tab_mainFrameEnvironment, "f")], "f");
        __classPrivateFieldSet(this, _Tab_coreTabPromise, coreTabPromise, "f");
        __classPrivateFieldSet(this, _Tab_callsiteLocator, callsiteLocator, "f");
        async function sendToTab(pluginId, ...args) {
            return (await coreTabPromise).commandQueue.run('Tab.runPluginCommand', pluginId, args);
        }
        for (const clientPlugin of hero[internal_1.InternalPropertiesSymbol].clientPlugins) {
            if (clientPlugin.onTab)
                clientPlugin.onTab(hero, this, sendToTab);
        }
    }
    get tabId() {
        return __classPrivateFieldGet(this, _Tab_instances, "a", _Tab_coreTabOrReject_get).then(x => x.tabId);
    }
    get lastCommandId() {
        return __classPrivateFieldGet(this, _Tab_instances, "a", _Tab_coreTabOrReject_get).then(x => x.commandQueue.lastCommandId);
    }
    get url() {
        return this.mainFrameEnvironment.url;
    }
    get isPaintingStable() {
        return this.mainFrameEnvironment.isPaintingStable;
    }
    get isDomContentLoaded() {
        return this.mainFrameEnvironment.isDomContentLoaded;
    }
    get isAllContentLoaded() {
        return this.mainFrameEnvironment.isAllContentLoaded;
    }
    get mainFrameEnvironment() {
        return __classPrivateFieldGet(this, _Tab_mainFrameEnvironment, "f");
    }
    get cookieStorage() {
        return this.mainFrameEnvironment.cookieStorage;
    }
    get frameEnvironments() {
        return __classPrivateFieldGet(this, _Tab_instances, "m", _Tab_getRefreshedFrameEnvironments).call(this);
    }
    get document() {
        return this.mainFrameEnvironment.document;
    }
    get localStorage() {
        return this.mainFrameEnvironment.localStorage;
    }
    get sessionStorage() {
        return this.mainFrameEnvironment.sessionStorage;
    }
    get Request() {
        return this.mainFrameEnvironment.Request;
    }
    // METHODS
    findResource(filter, options) {
        return Resource_1.default.findLatest(this, filter, options);
    }
    findResources(filter, options) {
        return Resource_1.default.findAll(this, filter, options);
    }
    async fetch(request, init) {
        return await this.mainFrameEnvironment.fetch(request, init);
    }
    async getFrameEnvironment(element) {
        const { awaitedPath, awaitedOptions } = awaitedPathState.getState(element);
        const elementCoreFrame = await awaitedOptions.coreFrame;
        const frameMeta = await elementCoreFrame.getChildFrameEnvironment(awaitedPath.toJSON());
        if (!frameMeta)
            return null;
        const coreTab = await __classPrivateFieldGet(this, _Tab_coreTabPromise, "f");
        return await __classPrivateFieldGet(this, _Tab_instances, "m", _Tab_getOrCreateFrameEnvironment).call(this, coreTab.getCoreFrameForMeta(frameMeta));
    }
    getComputedStyle(element, pseudoElement) {
        return this.mainFrameEnvironment.getComputedStyle(element, pseudoElement);
    }
    async goto(href, options) {
        const coreTab = await __classPrivateFieldGet(this, _Tab_instances, "a", _Tab_coreTabOrReject_get);
        const resource = await coreTab.goto(href, options);
        return (0, Resource_1.createResource)(Promise.resolve(coreTab), resource);
    }
    async goBack(options) {
        const coreTab = await __classPrivateFieldGet(this, _Tab_coreTabPromise, "f");
        return coreTab.goBack(options);
    }
    async goForward(options) {
        const coreTab = await __classPrivateFieldGet(this, _Tab_coreTabPromise, "f");
        return coreTab.goForward(options);
    }
    async reload(options) {
        const coreTab = await __classPrivateFieldGet(this, _Tab_coreTabPromise, "f");
        const resource = await coreTab.reload(options);
        return (0, Resource_1.createResource)(Promise.resolve(coreTab), resource);
    }
    async getJsValue(path) {
        return await this.mainFrameEnvironment.getJsValue(path);
    }
    // @deprecated 2021-04-30: Replaced with getComputedVisibility
    async isElementVisible(element) {
        return await this.getComputedVisibility(element).then(x => x.isVisible);
    }
    async getComputedVisibility(node) {
        return await this.mainFrameEnvironment.getComputedVisibility(node);
    }
    querySelector(selector) {
        return this.mainFrameEnvironment.querySelector(selector);
    }
    querySelectorAll(selector) {
        return this.mainFrameEnvironment.querySelectorAll(selector);
    }
    xpathSelector(xpath, orderedNodeResults = false) {
        return this.mainFrameEnvironment.xpathSelector(xpath, orderedNodeResults);
    }
    xpathSelectorAll(xpath, orderedNodeResults = false) {
        return this.mainFrameEnvironment.xpathSelectorAll(xpath, orderedNodeResults);
    }
    async takeScreenshot(options) {
        const coreTab = await __classPrivateFieldGet(this, _Tab_coreTabPromise, "f");
        return coreTab.takeScreenshot(options);
    }
    async waitForFileChooser(options) {
        const coreTab = await __classPrivateFieldGet(this, _Tab_coreTabPromise, "f");
        const prompt = await coreTab.waitForFileChooser(options);
        const coreFrame = coreTab.frameEnvironmentsById.get(prompt.frameId);
        return new FileChooser_1.default(Promise.resolve(coreFrame), prompt);
    }
    async waitForPaintingStable(options) {
        return await this.mainFrameEnvironment.waitForPaintingStable(options);
    }
    async waitForLoad(status, options) {
        return await this.mainFrameEnvironment.waitForLoad(status, options);
    }
    async waitForState(state, options = { timeoutMs: 30e3 }) {
        const callstack = new Error().stack.slice(8);
        const callsitePath = __classPrivateFieldGet(this, _Tab_callsiteLocator, "f").getCurrent();
        const coreTab = await __classPrivateFieldGet(this, _Tab_coreTabPromise, "f");
        return await coreTab.waitForState(state, options, { callstack, callsitePath });
    }
    async validateState(state) {
        const callsitePath = __classPrivateFieldGet(this, _Tab_callsiteLocator, "f").getCurrent();
        const coreTab = await __classPrivateFieldGet(this, _Tab_coreTabPromise, "f");
        return coreTab.validateState(state, callsitePath);
    }
    async registerFlowHandler(name, state, handlerFn) {
        const callsitePath = __classPrivateFieldGet(this, _Tab_callsiteLocator, "f").getCurrent();
        const coreTab = await __classPrivateFieldGet(this, _Tab_coreTabPromise, "f");
        await coreTab.registerFlowHandler(name, state, handlerFn, callsitePath);
    }
    async triggerFlowHandlers() {
        const coreTab = await __classPrivateFieldGet(this, _Tab_coreTabPromise, "f");
        const coreResult = await coreTab.triggerFlowHandlers();
        return {
            triggeredFlowHandler: coreResult.triggeredFlowHandler?.name,
            matchedFlowHandlers: coreResult.matchedFlowHandlers.map((handler) => handler.name),
        };
    }
    async flowCommand(commandFn, optionsOrExitState) {
        const callsitePath = __classPrivateFieldGet(this, _Tab_callsiteLocator, "f").getCurrent();
        const coreTab = await __classPrivateFieldGet(this, _Tab_coreTabPromise, "f");
        let exitState;
        let options;
        if (optionsOrExitState) {
            if (typeof optionsOrExitState === 'function')
                exitState = { all: optionsOrExitState };
            else {
                if ('maxRetries' in optionsOrExitState) {
                    options = { maxRetries: optionsOrExitState.maxRetries };
                }
                if ('exitState' in optionsOrExitState) {
                    exitState = optionsOrExitState.exitState;
                }
            }
        }
        return await coreTab.runFlowCommand(commandFn, exitState, callsitePath, options);
    }
    waitForResource(filter, options) {
        return Resource_1.default.waitForOne(this, filter, options);
    }
    waitForResources(filter, options) {
        return Resource_1.default.waitForMany(this, filter, options);
    }
    async waitForElement(element, options) {
        return await this.mainFrameEnvironment.waitForElement(element, options);
    }
    async waitForLocation(trigger, options) {
        return await this.mainFrameEnvironment.waitForLocation(trigger, options);
    }
    async waitForMillis(millis) {
        const coreTab = await __classPrivateFieldGet(this, _Tab_coreTabPromise, "f");
        await coreTab.waitForMillis(millis);
    }
    focus() {
        return __classPrivateFieldGet(this, _Tab_hero, "f").focusTab(this);
    }
    async close() {
        await __classPrivateFieldGet(this, _Tab_hero, "f").closeTab(this);
    }
    toJSON() {
        // return empty so we can avoid infinite "stringifying" in jest
        return {
            type: this.constructor.name,
        };
    }
}
_Tab_getOrCreateFrameEnvironment = async function _Tab_getOrCreateFrameEnvironment(coreFrame) {
    const frameEnvironments = __classPrivateFieldGet(this, _Tab_frameEnvironments, "f");
    for (const frameEnvironment of frameEnvironments) {
        const frameId = await frameEnvironment.frameId;
        if (frameId === coreFrame.frameId)
            return frameEnvironment;
    }
    const frameEnvironment = new FrameEnvironment_1.default(__classPrivateFieldGet(this, _Tab_hero, "f"), this, Promise.resolve(coreFrame));
    frameEnvironments.push(frameEnvironment);
    return frameEnvironment;
}, _Tab_getRefreshedFrameEnvironments = async function _Tab_getRefreshedFrameEnvironments() {
    const coreTab = await __classPrivateFieldGet(this, _Tab_coreTabPromise, "f");
    const coreFrames = await coreTab.getCoreFrameEnvironments();
    const newFrameIds = coreFrames.map(x => x.frameId);
    for (const frameEnvironment of __classPrivateFieldGet(this, _Tab_frameEnvironments, "f")) {
        const id = await frameEnvironment.frameId;
        // remove frames that are gone
        if (!newFrameIds.includes(id)) {
            const idx = __classPrivateFieldGet(this, _Tab_frameEnvironments, "f").indexOf(frameEnvironment);
            __classPrivateFieldGet(this, _Tab_frameEnvironments, "f").splice(idx, 1);
        }
    }
    await Promise.all(coreFrames.map(x => __classPrivateFieldGet(this, _Tab_instances, "m", _Tab_getOrCreateFrameEnvironment).call(this, x)));
    return __classPrivateFieldGet(this, _Tab_frameEnvironments, "f");
};
exports.default = Tab;
(0, addGlobalInstance_1.default)(Tab);
function getCoreTab(tab) {
    return tab[internal_1.InternalPropertiesSymbol].coreTabPromise.then(x => {
        if (x instanceof Error)
            throw x;
        return x;
    });
}
// CREATE
function createTab(hero, coreTab, callsiteLocator) {
    return new Tab(hero, coreTab, callsiteLocator);
}
//# sourceMappingURL=Tab.js.map