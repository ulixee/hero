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
var _Hero_instances, _Hero_options, _Hero_clientPlugins, _Hero_connectionToCore, _Hero_didAutoCreateConnection, _Hero_didInitializeClientPlugins, _Hero_coreSessionPromise, _Hero_tabs, _Hero_activeTab, _Hero_isClosingPromise, _Hero_detachedElements, _Hero_detachedResources, _Hero_directEventEmitter, _Hero_callsiteLocator, _Hero_getCoreSessionOrReject, _Hero_initializeClientPlugins, _Hero_sendToActiveTab, _Hero_refreshedTabs;
Object.defineProperty(exports, "__esModule", { value: true });
const ITabOptions_1 = require("@ulixee/hero-interfaces/ITabOptions");
const utils_1 = require("@ulixee/commons/lib/utils");
const addGlobalInstance_1 = require("@ulixee/commons/lib/addGlobalInstance");
const IPluginTypes_1 = require("@ulixee/hero-interfaces/IPluginTypes");
const requirePlugins_1 = require("@ulixee/hero-plugin-utils/lib/utils/requirePlugins");
const filterPlugins_1 = require("@ulixee/hero-plugin-utils/lib/utils/filterPlugins");
const extractPlugins_1 = require("@ulixee/hero-plugin-utils/lib/utils/extractPlugins");
const DisconnectedError_1 = require("@ulixee/net/errors/DisconnectedError");
const IInteractions_1 = require("@ulixee/unblocked-specification/agent/interact/IInteractions");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const ShutdownHandler_1 = require("@ulixee/commons/lib/ShutdownHandler");
const events_1 = require("events");
const WebsocketResource_1 = require("./WebsocketResource");
const Resource_1 = require("./Resource");
const Interactor_1 = require("./Interactor");
const IInteractions_2 = require("../interfaces/IInteractions");
const Tab_1 = require("./Tab");
const AwaitedEventTarget_1 = require("./AwaitedEventTarget");
const ConnectionFactory_1 = require("../connections/ConnectionFactory");
const FrameEnvironment_1 = require("./FrameEnvironment");
const CoreSession_1 = require("./CoreSession");
const internal_1 = require("./internal");
const DetachedElements_1 = require("./DetachedElements");
const DetachedResources_1 = require("./DetachedResources");
const DomExtender_1 = require("./DomExtender");
const ScriptInvocationMeta_1 = require("./ScriptInvocationMeta");
const CallsiteLocator_1 = require("./CallsiteLocator");
const { version } = require('../package.json');
class Hero extends AwaitedEventTarget_1.default {
    get [(_Hero_options = new WeakMap(), _Hero_clientPlugins = new WeakMap(), _Hero_connectionToCore = new WeakMap(), _Hero_didAutoCreateConnection = new WeakMap(), _Hero_didInitializeClientPlugins = new WeakMap(), _Hero_coreSessionPromise = new WeakMap(), _Hero_tabs = new WeakMap(), _Hero_activeTab = new WeakMap(), _Hero_isClosingPromise = new WeakMap(), _Hero_detachedElements = new WeakMap(), _Hero_detachedResources = new WeakMap(), _Hero_directEventEmitter = new WeakMap(), _Hero_callsiteLocator = new WeakMap(), _Hero_instances = new WeakSet(), internal_1.InternalPropertiesSymbol)]() {
        const coreSessionPromise = () => __classPrivateFieldGet(this, _Hero_instances, "m", _Hero_getCoreSessionOrReject).call(this);
        const isConnected = () => !!__classPrivateFieldGet(this, _Hero_coreSessionPromise, "f");
        return {
            clientPlugins: __classPrivateFieldGet(this, _Hero_clientPlugins, "f"),
            get coreSessionPromise() {
                return coreSessionPromise();
            },
            get isConnected() {
                return isConnected();
            },
        };
    }
    constructor(createOptions = {}) {
        super(() => {
            return {
                target: __classPrivateFieldGet(this, _Hero_instances, "m", _Hero_getCoreSessionOrReject).call(this),
            };
        });
        _Hero_instances.add(this);
        _Hero_options.set(this, void 0);
        _Hero_clientPlugins.set(this, []);
        _Hero_connectionToCore.set(this, void 0);
        _Hero_didAutoCreateConnection.set(this, false);
        _Hero_didInitializeClientPlugins.set(this, false);
        _Hero_coreSessionPromise.set(this, void 0);
        _Hero_tabs.set(this, void 0);
        _Hero_activeTab.set(this, void 0);
        _Hero_isClosingPromise.set(this, void 0);
        _Hero_detachedElements.set(this, void 0);
        _Hero_detachedResources.set(this, void 0);
        _Hero_directEventEmitter.set(this, new events_1.EventEmitter());
        _Hero_callsiteLocator.set(this, void 0);
        (0, utils_1.bindFunctions)(this);
        const { name, connectionToCore, callsiteLocator, ...options } = createOptions;
        options.blockedResourceTypes ??= Hero.defaults.blockedResourceTypes;
        options.blockedResourceUrls ??= Hero.defaults.blockedResourceUrls;
        options.userProfile ??= Hero.defaults.userProfile;
        __classPrivateFieldSet(this, _Hero_options, {
            ...options,
            mode: options.mode,
            sessionName: name,
            scriptInvocationMeta: ScriptInvocationMeta_1.default.getScriptInvocationMeta(options.scriptInvocationMeta),
            dependencyMap: {},
            corePluginPaths: [],
        }, "f");
        __classPrivateFieldSet(this, _Hero_callsiteLocator, callsiteLocator ?? new CallsiteLocator_1.default(__classPrivateFieldGet(this, _Hero_options, "f").scriptInvocationMeta.entrypoint), "f");
        if (Hero.defaults.shutdownOnProcessSignals === false) {
            ShutdownHandler_1.default.disableSignals = true;
        }
        let connect = connectionToCore;
        if (typeof connect === 'string')
            connect = { host: connect };
        __classPrivateFieldSet(this, _Hero_connectionToCore, ConnectionFactory_1.default.createConnection(connect ?? {}, __classPrivateFieldGet(this, _Hero_callsiteLocator, "f")), "f");
        __classPrivateFieldSet(this, _Hero_didAutoCreateConnection, __classPrivateFieldGet(this, _Hero_connectionToCore, "f") !== connect, "f");
    }
    get activeTab() {
        __classPrivateFieldGet(this, _Hero_instances, "m", _Hero_getCoreSessionOrReject).call(this).catch(() => null);
        return __classPrivateFieldGet(this, _Hero_activeTab, "f");
    }
    get document() {
        return this.activeTab.document;
    }
    get frameEnvironments() {
        return this.activeTab.frameEnvironments;
    }
    get isAllContentLoaded() {
        return this.activeTab.isAllContentLoaded;
    }
    get isDomContentLoaded() {
        return this.activeTab.isDomContentLoaded;
    }
    get isPaintingStable() {
        return this.activeTab.isPaintingStable;
    }
    get lastCommandId() {
        return this.activeTab.lastCommandId;
    }
    get mainFrameEnvironment() {
        return this.activeTab.mainFrameEnvironment;
    }
    get sessionId() {
        const coreSession = __classPrivateFieldGet(this, _Hero_instances, "m", _Hero_getCoreSessionOrReject).call(this);
        return coreSession.then(x => x.sessionId);
    }
    get sessionName() {
        return Promise.resolve(__classPrivateFieldGet(this, _Hero_options, "f").sessionName);
    }
    get meta() {
        const coreSession = __classPrivateFieldGet(this, _Hero_instances, "m", _Hero_getCoreSessionOrReject).call(this);
        return coreSession.then(x => x.getHeroMeta());
    }
    get storage() {
        const coreTab = (0, Tab_1.getCoreTab)(this.activeTab);
        return coreTab.then(async (tab) => {
            const profile = await tab.exportUserProfile();
            return profile.storage;
        });
    }
    get tabs() {
        return __classPrivateFieldGet(this, _Hero_instances, "m", _Hero_refreshedTabs).call(this);
    }
    get url() {
        return this.activeTab.url;
    }
    get coreHost() {
        return Promise.resolve(__classPrivateFieldGet(this, _Hero_connectionToCore, "f")?.transport.host);
    }
    get Request() {
        return this.activeTab.Request;
    }
    get version() {
        return version;
    }
    get detachedElements() {
        const coreSessionPromise = __classPrivateFieldGet(this, _Hero_instances, "m", _Hero_getCoreSessionOrReject).call(this);
        __classPrivateFieldSet(this, _Hero_detachedElements, __classPrivateFieldGet(this, _Hero_detachedElements, "f") ?? new DetachedElements_1.default(coreSessionPromise, Promise.resolve(__classPrivateFieldGet(this, _Hero_options, "f").replaySessionId ?? this.sessionId)), "f");
        return __classPrivateFieldGet(this, _Hero_detachedElements, "f");
    }
    get detachedResources() {
        const coreSessionPromise = __classPrivateFieldGet(this, _Hero_instances, "m", _Hero_getCoreSessionOrReject).call(this);
        __classPrivateFieldSet(this, _Hero_detachedResources, __classPrivateFieldGet(this, _Hero_detachedResources, "f") ?? new DetachedResources_1.default(coreSessionPromise, Promise.resolve(__classPrivateFieldGet(this, _Hero_options, "f").replaySessionId ?? this.sessionId)), "f");
        return __classPrivateFieldGet(this, _Hero_detachedResources, "f");
    }
    // METHODS
    async addToDetached(name, elementOrResource) {
        if (elementOrResource instanceof Resource_1.default || elementOrResource instanceof WebsocketResource_1.default) {
            await elementOrResource.$addToDetachedResources(name);
        }
        else if ((0, DomExtender_1.isDomExtensionClass)(elementOrResource)) {
            await elementOrResource.$addToDetachedElements(name);
        }
        else {
            throw new Error('The first argument must be an Element or Resource');
        }
    }
    async detach(elementOrResource) {
        if (elementOrResource instanceof Resource_1.default || elementOrResource instanceof WebsocketResource_1.default) {
            return await elementOrResource.$detach();
        }
        if ((0, DomExtender_1.isDomExtensionClass)(elementOrResource)) {
            return await elementOrResource.$detach();
        }
        throw new Error('The first argument must be an Element or Resource');
    }
    close() {
        return (__classPrivateFieldSet(this, _Hero_isClosingPromise, __classPrivateFieldGet(this, _Hero_isClosingPromise, "f") ?? new Promise(async (resolve, reject) => {
            try {
                const sessionOrError = await __classPrivateFieldGet(this, _Hero_coreSessionPromise, "f");
                if (sessionOrError instanceof CoreSession_1.default) {
                    await sessionOrError.close();
                }
                if (__classPrivateFieldGet(this, _Hero_didAutoCreateConnection, "f")) {
                    await __classPrivateFieldGet(this, _Hero_connectionToCore, "f").disconnect();
                }
            }
            catch (error) {
                if (!(error instanceof DisconnectedError_1.default))
                    return reject(error);
            }
            resolve();
        }), "f"));
    }
    async newTab() {
        const coreTab = __classPrivateFieldGet(this, _Hero_instances, "m", _Hero_getCoreSessionOrReject).call(this).then(x => x.newTab());
        const tab = (0, Tab_1.createTab)(this, coreTab, __classPrivateFieldGet(this, _Hero_callsiteLocator, "f"));
        __classPrivateFieldGet(this, _Hero_tabs, "f").push(tab);
        return tab;
    }
    async closeTab(tab) {
        const tabIdx = __classPrivateFieldGet(this, _Hero_tabs, "f").indexOf(tab);
        __classPrivateFieldGet(this, _Hero_tabs, "f").splice(tabIdx, 1);
        if (__classPrivateFieldGet(this, _Hero_tabs, "f").length) {
            __classPrivateFieldSet(this, _Hero_activeTab, __classPrivateFieldGet(this, _Hero_tabs, "f")[0], "f");
        }
        const coreTab = await (0, Tab_1.getCoreTab)(tab);
        await coreTab.close();
    }
    async focusTab(tab) {
        const coreTab = await (0, Tab_1.getCoreTab)(tab);
        await coreTab.focusTab();
        __classPrivateFieldSet(this, _Hero_activeTab, tab, "f");
    }
    async findResource(filter, options) {
        return await this.activeTab.findResource(filter, options);
    }
    async findResources(filter, options) {
        return await this.activeTab.findResources(filter, options);
    }
    async getSnippet(key) {
        const coreSession = await __classPrivateFieldGet(this, _Hero_instances, "m", _Hero_getCoreSessionOrReject).call(this);
        const sessionId = __classPrivateFieldGet(this, _Hero_options, "f").replaySessionId ?? (await this.sessionId);
        const snippets = await coreSession.getSnippets(sessionId, key);
        if (!snippets.length)
            return null;
        return snippets[snippets.length - 1].value;
    }
    async setSnippet(key, value) {
        const coreSession = await __classPrivateFieldGet(this, _Hero_instances, "m", _Hero_getCoreSessionOrReject).call(this);
        await coreSession.setSnippet(key, value);
    }
    async waitForNewTab(options) {
        const coreTab = await (0, Tab_1.getCoreTab)(this.activeTab);
        const newCoreTab = coreTab.waitForNewTab(options);
        const tab = (0, Tab_1.createTab)(this, newCoreTab, __classPrivateFieldGet(this, _Hero_callsiteLocator, "f"));
        __classPrivateFieldGet(this, _Hero_tabs, "f").push(tab);
        return tab;
    }
    // INTERACT METHODS
    async click(mousePosition, options) {
        let coreFrame = await (0, FrameEnvironment_1.getCoreFrameEnvironmentForPosition)(mousePosition);
        coreFrame ??=
            await this.activeTab.mainFrameEnvironment[internal_1.InternalPropertiesSymbol].coreFramePromise;
        let interaction = { click: mousePosition };
        if (!(0, IInteractions_1.isMousePositionXY)(mousePosition)) {
            interaction = {
                click: {
                    element: mousePosition,
                    verification: options?.clickVerification ?? 'elementAtPath',
                },
            };
        }
        await Interactor_1.default.run(coreFrame, [interaction]);
    }
    async getFrameEnvironment(frameElement) {
        return await this.activeTab.getFrameEnvironment(frameElement);
    }
    async interact(...interactions) {
        if (!interactions.length)
            return;
        let coreFrame = await getCoreFrameForInteractions(interactions);
        coreFrame ??=
            await this.activeTab.mainFrameEnvironment[internal_1.InternalPropertiesSymbol].coreFramePromise;
        await Interactor_1.default.run(coreFrame, interactions);
    }
    async scrollTo(mousePosition) {
        let coreFrame = await (0, FrameEnvironment_1.getCoreFrameEnvironmentForPosition)(mousePosition);
        coreFrame ??=
            await this.activeTab.mainFrameEnvironment[internal_1.InternalPropertiesSymbol].coreFramePromise;
        await Interactor_1.default.run(coreFrame, [{ [IInteractions_2.Command.scroll]: mousePosition }]);
    }
    async type(...typeInteractions) {
        const coreFrame = await this.activeTab.mainFrameEnvironment[internal_1.InternalPropertiesSymbol].coreFramePromise;
        await Interactor_1.default.run(coreFrame, typeInteractions.map(t => ({ type: t })));
    }
    async exportUserProfile() {
        const coreTab = await (0, Tab_1.getCoreTab)(this.activeTab);
        return await coreTab.exportUserProfile();
    }
    // PLUGINS
    use(PluginObject) {
        const ClientPluginsById = {};
        if (__classPrivateFieldGet(this, _Hero_coreSessionPromise, "f")) {
            throw new Error('You must call .use before any Hero "await" calls (ie, before the Agent connects to Core).');
        }
        if (typeof PluginObject === 'string') {
            const Plugins = (0, requirePlugins_1.default)(PluginObject);
            const CorePlugins = (0, filterPlugins_1.default)(Plugins, IPluginTypes_1.PluginTypes.CorePlugin);
            const ClientPlugins = (0, filterPlugins_1.default)(Plugins, IPluginTypes_1.PluginTypes.ClientPlugin);
            if (CorePlugins.length) {
                __classPrivateFieldGet(this, _Hero_options, "f").corePluginPaths.push(PluginObject);
            }
            ClientPlugins.forEach(ClientPlugin => (ClientPluginsById[ClientPlugin.id] = ClientPlugin));
        }
        else {
            const ClientPlugins = (0, extractPlugins_1.default)(PluginObject, IPluginTypes_1.PluginTypes.ClientPlugin);
            ClientPlugins.forEach(ClientPlugin => (ClientPluginsById[ClientPlugin.id] = ClientPlugin));
        }
        const clientPlugins = [];
        for (const ClientPlugin of Object.values(ClientPluginsById)) {
            const clientPlugin = new ClientPlugin();
            __classPrivateFieldGet(this, _Hero_clientPlugins, "f").push(clientPlugin);
            clientPlugins.push(clientPlugin);
            __classPrivateFieldGet(this, _Hero_options, "f").dependencyMap[ClientPlugin.id] = ClientPlugin.coreDependencyIds || [];
        }
        if (__classPrivateFieldGet(this, _Hero_didInitializeClientPlugins, "f")) {
            __classPrivateFieldGet(this, _Hero_instances, "m", _Hero_initializeClientPlugins).call(this, clientPlugins);
        }
    }
    /////// METHODS THAT DELEGATE TO ACTIVE TAB //////////////////////////////////////////////////////////////////////////
    goto(href, options) {
        return this.activeTab.goto(href, options);
    }
    goBack(options) {
        return this.activeTab.goBack(options);
    }
    goForward(options) {
        return this.activeTab.goForward(options);
    }
    reload(options) {
        return this.activeTab.reload(options);
    }
    fetch(request, init) {
        return this.activeTab.fetch(request, init);
    }
    getComputedStyle(element, pseudoElement) {
        return this.activeTab.getComputedStyle(element, pseudoElement);
    }
    getComputedVisibility(node) {
        return this.activeTab.getComputedVisibility(node);
    }
    getJsValue(path) {
        return this.activeTab.getJsValue(path);
    }
    // @deprecated 2021-04-30: Replaced with getComputedVisibility
    async isElementVisible(element) {
        return await this.getComputedVisibility(element).then(x => x.isVisible);
    }
    async pause() {
        const session = await __classPrivateFieldGet(this, _Hero_instances, "m", _Hero_getCoreSessionOrReject).call(this);
        await session.pause();
    }
    querySelector(selector) {
        return this.activeTab.querySelector(selector);
    }
    querySelectorAll(selector) {
        return this.activeTab.querySelectorAll(selector);
    }
    xpathSelector(xpath, orderedNodeResults = false) {
        return this.activeTab.xpathSelector(xpath, orderedNodeResults);
    }
    xpathSelectorAll(xpath, orderedNodeResults = false) {
        return this.activeTab.xpathSelectorAll(xpath, orderedNodeResults);
    }
    takeScreenshot(options) {
        return this.activeTab.takeScreenshot(options);
    }
    waitForPaintingStable(options) {
        return this.activeTab.waitForPaintingStable(options);
    }
    waitForResource(filter, options) {
        return this.activeTab.waitForResource(filter, options);
    }
    waitForResources(filter, options) {
        return this.activeTab.waitForResources(filter, options);
    }
    waitForElement(element, options) {
        return this.activeTab.waitForElement(element, options);
    }
    waitForFileChooser(options) {
        return this.activeTab.waitForFileChooser(options);
    }
    waitForLocation(trigger, options) {
        return this.activeTab.waitForLocation(trigger, options);
    }
    waitForLoad(status, options) {
        return this.activeTab.waitForLoad(status, options);
    }
    waitForMillis(millis) {
        return this.activeTab.waitForMillis(millis);
    }
    async waitForState(state, options) {
        return await this.activeTab.waitForState(state, options);
    }
    async validateState(state) {
        return await this.activeTab.validateState(state);
    }
    async flowCommand(commandFn, optionsOrExitState) {
        return await this.activeTab.flowCommand(commandFn, optionsOrExitState);
    }
    async registerFlowHandler(name, state, handlerCallbackFn) {
        return await this.activeTab.registerFlowHandler(name, state, handlerCallbackFn);
    }
    async triggerFlowHandlers() {
        return await this.activeTab.triggerFlowHandlers();
    }
    toJSON() {
        // return empty so we can avoid infinite "stringifying" in jest
        return {
            type: this.constructor.name,
        };
    }
    /// EVENTS
    async addEventListener(eventType, listenerFn, options) {
        if (eventType === 'connected') {
            __classPrivateFieldGet(this, _Hero_directEventEmitter, "f").addListener(eventType, listenerFn);
            return;
        }
        return await super.addEventListener(eventType, listenerFn, options);
    }
    on(eventType, listenerFn, options) {
        if (eventType === 'connected') {
            __classPrivateFieldGet(this, _Hero_directEventEmitter, "f").on(eventType, listenerFn);
            return;
        }
        return super.on(eventType, listenerFn, options);
    }
    once(eventType, listenerFn, options) {
        if (eventType === 'connected') {
            __classPrivateFieldGet(this, _Hero_directEventEmitter, "f").once(eventType, listenerFn);
            return;
        }
        return super.once(eventType, listenerFn, options);
    }
    off(eventType, listenerFn) {
        if (eventType === 'connected') {
            __classPrivateFieldGet(this, _Hero_directEventEmitter, "f").off(eventType, listenerFn);
            return;
        }
        return super.off(eventType, listenerFn);
    }
    async removeEventListener(eventType, listenerFn) {
        if (eventType === 'connected') {
            __classPrivateFieldGet(this, _Hero_directEventEmitter, "f").removeListener(eventType, listenerFn);
            return;
        }
        return await super.removeEventListener(eventType, listenerFn);
    }
    async connect() {
        await __classPrivateFieldGet(this, _Hero_instances, "m", _Hero_getCoreSessionOrReject).call(this);
    }
}
_Hero_getCoreSessionOrReject = function _Hero_getCoreSessionOrReject() {
    if (!__classPrivateFieldGet(this, _Hero_coreSessionPromise, "f")) {
        __classPrivateFieldSet(this, _Hero_coreSessionPromise, __classPrivateFieldGet(this, _Hero_connectionToCore, "f")
            .createSession(__classPrivateFieldGet(this, _Hero_options, "f"), __classPrivateFieldGet(this, _Hero_callsiteLocator, "f"))
            .then(session => {
            if (session instanceof CoreSession_1.default)
                __classPrivateFieldGet(this, _Hero_instances, "m", _Hero_initializeClientPlugins).call(this, __classPrivateFieldGet(this, _Hero_clientPlugins, "f"));
            __classPrivateFieldGet(this, _Hero_directEventEmitter, "f").emit('connected');
            return session;
        })
            .catch(err => err), "f");
        const coreTab = __classPrivateFieldGet(this, _Hero_coreSessionPromise, "f")
            .then(x => {
            if (x instanceof Error)
                throw x;
            if (!x)
                throw new IPendingWaitEvent_1.CanceledPromiseError('No connection to Hero Core established.');
            return x.firstTab;
        })
            .catch(err => err);
        __classPrivateFieldSet(this, _Hero_activeTab, (0, Tab_1.createTab)(this, coreTab, __classPrivateFieldGet(this, _Hero_callsiteLocator, "f")), "f");
        __classPrivateFieldSet(this, _Hero_tabs, [__classPrivateFieldGet(this, _Hero_activeTab, "f")], "f");
    }
    return __classPrivateFieldGet(this, _Hero_coreSessionPromise, "f").then(coreSession => {
        if (coreSession instanceof CoreSession_1.default)
            return coreSession;
        if (coreSession === null)
            return null;
        throw coreSession;
    });
}, _Hero_initializeClientPlugins = function _Hero_initializeClientPlugins(plugins) {
    __classPrivateFieldSet(this, _Hero_didInitializeClientPlugins, true, "f");
    for (const clientPlugin of plugins) {
        if (clientPlugin.onHero)
            clientPlugin.onHero(this, __classPrivateFieldGet(this, _Hero_instances, "m", _Hero_sendToActiveTab).bind(this));
    }
}, _Hero_sendToActiveTab = async function _Hero_sendToActiveTab(toPluginId, ...args) {
    const coreSession = (await __classPrivateFieldGet(this, _Hero_coreSessionPromise, "f"));
    const coreTab = coreSession.tabsById.get(await __classPrivateFieldGet(this, _Hero_activeTab, "f").tabId);
    return coreTab.commandQueue.run('Tab.runPluginCommand', toPluginId, args);
}, _Hero_refreshedTabs = async function _Hero_refreshedTabs() {
    const session = await __classPrivateFieldGet(this, _Hero_instances, "m", _Hero_getCoreSessionOrReject).call(this);
    const coreTabs = await session.getTabs();
    const tabIds = await Promise.all(__classPrivateFieldGet(this, _Hero_tabs, "f").map(x => x.tabId));
    for (const coreTab of coreTabs) {
        const hasTab = tabIds.includes(coreTab.tabId);
        if (!hasTab) {
            const tab = (0, Tab_1.createTab)(this, Promise.resolve(coreTab), __classPrivateFieldGet(this, _Hero_callsiteLocator, "f"));
            __classPrivateFieldGet(this, _Hero_tabs, "f").push(tab);
        }
    }
    return __classPrivateFieldGet(this, _Hero_tabs, "f");
};
Hero.defaults = {
    blockedResourceTypes: [ITabOptions_1.BlockedResourceType.None],
    shutdownOnProcessSignals: true,
};
exports.default = Hero;
(0, addGlobalInstance_1.default)(Hero);
async function getCoreFrameForInteractions(interactions) {
    for (const interaction of interactions) {
        if (typeof interaction !== 'object')
            continue;
        for (const element of Object.values(interaction)) {
            const coreFrame = await (0, FrameEnvironment_1.getCoreFrameEnvironmentForPosition)(element);
            if (coreFrame)
                return coreFrame;
        }
    }
}
//# sourceMappingURL=Hero.js.map