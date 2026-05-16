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
var _Pool_activeAgentsCount, _Pool_waitingForAvailability;
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("@ulixee/commons/lib/Logger");
const unblocked_agent_mitm_1 = require("@ulixee/unblocked-agent-mitm");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const Queue_1 = require("@ulixee/commons/lib/Queue");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const Browser_1 = require("./Browser");
const Agent_1 = require("./Agent");
const env_1 = require("../env");
const { log } = (0, Logger_1.default)(module);
class Pool extends eventUtils_1.TypedEventEmitter {
    get hasAvailability() {
        return this.activeAgentsCount < this.maxConcurrentAgents;
    }
    get activeAgentsCount() {
        return __classPrivateFieldGet(this, _Pool_activeAgentsCount, "f");
    }
    constructor(options = {}) {
        super();
        this.options = options;
        this.maxConcurrentAgents = 10;
        this.maxConcurrentAgentsPerBrowser = 10;
        this.browsersById = new Map();
        this.agentsById = new Map();
        this.plugins = [];
        this.pluginConfigs = {};
        _Pool_activeAgentsCount.set(this, 0);
        _Pool_waitingForAvailability.set(this, []);
        this.agentsByBrowserId = {};
        this.browserIdByAgentId = {};
        this.browserCreationQueue = new Queue_1.default(`BROWSER_CREATION_Q`, 1);
        this.events = new EventSubscriber_1.default();
        this.maxConcurrentAgents = options.maxConcurrentAgents ?? 10;
        this.maxConcurrentAgentsPerBrowser = options.maxConcurrentAgentsPerBrowser ?? 10;
        this.plugins = options.plugins ?? [];
        this.logger = options.logger?.createChild(module) ?? log.createChild(module, {});
    }
    async start() {
        if (this.isClosing)
            await this.isClosing;
        this.isClosing = null;
        this.logger.info('Pool.start');
        await this.startSharedMitm();
    }
    createAgent(options) {
        options ??= {};
        if (this.options.defaultBrowserEngine) {
            options.browserEngine ??= {
                ...this.options.defaultBrowserEngine,
                launchArguments: [...this.options.defaultBrowserEngine.launchArguments],
            };
        }
        options.plugins ??= [...this.plugins];
        options.pluginConfigs ??= structuredClone(this.pluginConfigs);
        const agent = new Agent_1.default(options, this);
        this.agentsById.set(agent.id, agent);
        this.emit('agent-created', { agent });
        return agent;
    }
    async waitForAvailability(agent) {
        this.logger.info('Pool.waitForAvailability', {
            maxConcurrentAgents: this.maxConcurrentAgents,
            activeAgentsCount: this.activeAgentsCount,
            waitingForAvailability: __classPrivateFieldGet(this, _Pool_waitingForAvailability, "f").length,
        });
        if (this.hasAvailability) {
            this.registerActiveAgent(agent);
            return;
        }
        const resolvablePromise = new Resolvable_1.default();
        __classPrivateFieldGet(this, _Pool_waitingForAvailability, "f").push({
            agent,
            promise: resolvablePromise,
        });
        await resolvablePromise.promise;
    }
    async createMitmProxy() {
        this.certificateGenerator ??= unblocked_agent_mitm_1.MitmProxy.createCertificateGenerator(this.options.certificateStore, this.options.dataDir);
        return await unblocked_agent_mitm_1.MitmProxy.start(this.certificateGenerator);
    }
    async getBrowser(engine, agentId, hooks, launchArgs) {
        return await this.browserCreationQueue.run(async () => {
            launchArgs ??= {};
            // You can't proxy browser contexts if the top level proxy isn't enabled
            const needsBrowserLevelProxy = launchArgs.disableMitm !== true || !!hooks.profile?.upstreamProxyUrl;
            if (!this.sharedMitmProxy && needsBrowserLevelProxy)
                await this.start();
            if (needsBrowserLevelProxy) {
                launchArgs.proxyPort ??= this.sharedMitmProxy?.port;
            }
            const browser = new Browser_1.default(engine, hooks, launchArgs);
            for (const existingBrowser of this.browsersById.values()) {
                const agents = this.agentsByBrowserId[existingBrowser.id] ?? 0;
                if (agents < this.maxConcurrentAgentsPerBrowser && existingBrowser.isEqualEngine(engine)) {
                    this.agentsByBrowserId[existingBrowser.id] ??= 0;
                    this.agentsByBrowserId[existingBrowser.id] += 1;
                    this.browserIdByAgentId[agentId] = existingBrowser.id;
                    return existingBrowser;
                }
            }
            this.agentsByBrowserId[browser.id] ??= 0;
            this.agentsByBrowserId[browser.id] += 1;
            this.browserIdByAgentId[agentId] = browser.id;
            // ensure enough listeners is possible
            browser.setMaxListeners(this.maxConcurrentAgents * 5);
            this.browsersById.set(browser.id, browser);
            const contextEvent = this.events.on(browser, 'new-context', this.watchForContextPagesClosed.bind(this));
            this.events.on(browser, 'new-session', this.onSession.bind(this));
            this.events.once(browser, 'close', () => this.onBrowserClosed(browser.id, contextEvent));
            await browser.launch();
            this.emit('browser-launched', { browser });
            return browser;
        });
    }
    async close() {
        if (this.isClosing)
            return this.isClosing.promise;
        this.isClosing = new Resolvable_1.default();
        try {
            const logId = log.stats('Pool.Closing', {
                sessionId: null,
                browsers: this.browsersById.size,
            });
            for (const { promise } of __classPrivateFieldGet(this, _Pool_waitingForAvailability, "f")) {
                promise.reject(new IPendingWaitEvent_1.CanceledPromiseError('Agent pool shutting down'), true);
            }
            __classPrivateFieldGet(this, _Pool_waitingForAvailability, "f").length = 0;
            this.browserCreationQueue.stop(new IPendingWaitEvent_1.CanceledPromiseError('Browser pool shutting down'));
            const closePromises = [];
            for (const agent of this.agentsById.values()) {
                closePromises.push(agent.close().catch(err => err));
            }
            for (const browser of this.browsersById.values()) {
                closePromises.push(browser.close().catch(err => err));
            }
            this.browsersById.clear();
            if (this.mitmStartPromise) {
                this.mitmStartPromise.then(x => x.close()).catch(err => err);
                this.mitmStartPromise = null;
            }
            if (this.sharedMitmProxy) {
                this.sharedMitmProxy.close();
                this.sharedMitmProxy = null;
            }
            if (this.certificateGenerator) {
                this.certificateGenerator.close();
                this.certificateGenerator = null;
            }
            try {
                const errors = await Promise.all(closePromises);
                this.events.close();
                log.stats('Pool.Closed', {
                    parentLogId: logId,
                    sessionId: null,
                    errors: errors.filter(Boolean),
                });
            }
            catch (error) {
                log.error('Error in Pool.Close', { parentLogId: logId, sessionId: null, error });
            }
        }
        finally {
            this.isClosing.resolve();
        }
    }
    registerActiveAgent(agent) {
        __classPrivateFieldSet(this, _Pool_activeAgentsCount, __classPrivateFieldGet(this, _Pool_activeAgentsCount, "f") + 1, "f");
        try {
            this.events.once(agent, 'close', this.onAgentClosed.bind(this, agent.id));
        }
        catch (err) {
            __classPrivateFieldSet(this, _Pool_activeAgentsCount, __classPrivateFieldGet(this, _Pool_activeAgentsCount, "f") - 1, "f");
            throw err;
        }
    }
    onSession(args) {
        args?.session?.setMaxListeners(this.maxConcurrentAgentsPerBrowser + 1);
    }
    onAgentClosed(closedAgentId) {
        __classPrivateFieldSet(this, _Pool_activeAgentsCount, __classPrivateFieldGet(this, _Pool_activeAgentsCount, "f") - 1, "f");
        this.agentsById.delete(closedAgentId);
        const browserId = this.browserIdByAgentId[closedAgentId];
        if (this.agentsByBrowserId[browserId]) {
            this.agentsByBrowserId[browserId] -= 1;
            if (this.agentsByBrowserId[browserId] === 0) {
                delete this.agentsByBrowserId[browserId];
            }
            delete this.browserIdByAgentId[closedAgentId];
        }
        this.logger.info('Pool.ReleasingAgent', {
            maxConcurrentAgents: this.maxConcurrentAgents,
            activeAgentsCount: this.activeAgentsCount,
            waitingForAvailability: __classPrivateFieldGet(this, _Pool_waitingForAvailability, "f").length,
        });
        if (!__classPrivateFieldGet(this, _Pool_waitingForAvailability, "f").length || !this.hasAvailability) {
            return;
        }
        while (__classPrivateFieldGet(this, _Pool_waitingForAvailability, "f").length && this.hasAvailability) {
            const { agent, promise } = __classPrivateFieldGet(this, _Pool_waitingForAvailability, "f").shift();
            this.registerActiveAgent(agent);
            promise.resolve();
        }
    }
    async startSharedMitm() {
        if (this.sharedMitmProxy || env_1.default.disableMitm === true)
            return;
        if (this.mitmStartPromise) {
            await this.mitmStartPromise;
        }
        else {
            this.mitmStartPromise = this.createMitmProxy();
            this.certificateGenerator ??= unblocked_agent_mitm_1.MitmProxy.createCertificateGenerator(this.options.certificateStore, this.options.dataDir);
            this.sharedMitmProxy = await this.mitmStartPromise;
        }
    }
    async onBrowserClosed(browserId, contextEvent) {
        if (this.isClosing)
            return;
        for (const agent of this.agentsById.values()) {
            if (agent.browserContext?.browserId === browserId)
                await agent.close();
        }
        if (contextEvent)
            this.events.off(contextEvent);
        this.logger.info('Browser.closed', {
            engine: this.browsersById.get(browserId)?.engine,
            browserId,
        });
        this.browsersById.delete(browserId);
        if (this.browsersById.size === 0) {
            this.emit('all-browsers-closed');
        }
    }
    watchForContextPagesClosed(event) {
        const browserContext = event.context;
        const registeredEvent = this.events.on(browserContext, 'all-pages-closed', this.checkForInactiveBrowserEngine.bind(this, browserContext.browser.id));
        this.events.once(browserContext, 'close', () => this.events.off(registeredEvent));
    }
    checkForInactiveBrowserEngine(browserId) {
        let hasWindows = false;
        for (const agent of this.agentsById.values()) {
            if (agent.browserContext?.browserId === browserId) {
                hasWindows = agent.browserContext.pagesById.size > 0;
                if (hasWindows)
                    break;
            }
        }
        this.logger.info('Browser.allPagesClosed', {
            browserId,
            engineHasOtherOpenPages: hasWindows,
        });
        if (hasWindows)
            return;
        const browser = this.browsersById.get(browserId);
        if (browser) {
            this.emit('browser-has-no-open-windows', { browser });
        }
    }
}
_Pool_activeAgentsCount = new WeakMap(), _Pool_waitingForAvailability = new WeakMap();
exports.default = Pool;
//# sourceMappingURL=Pool.js.map