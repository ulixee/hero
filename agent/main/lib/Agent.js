"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
require("@ulixee/commons/lib/SourceMapSupport");
const unblocked_agent_mitm_1 = require("@ulixee/unblocked-agent-mitm");
const nanoid_1 = require("nanoid");
const env_1 = require("../env");
const Plugins_1 = require("./Plugins");
const Pool_1 = require("./Pool");
const { log } = (0, Logger_1.default)(module);
class Agent extends eventUtils_1.TypedEventEmitter {
    get emulationProfile() {
        return this.plugins.profile;
    }
    get isIncognito() {
        return this.plugins.profile.options.disableIncognito !== true;
    }
    get proxyConnectionInfo() {
        if (!this.enableMitm) {
            if (!this.emulationProfile.upstreamProxyUrl)
                return null;
            const url = new URL(this.emulationProfile.upstreamProxyUrl);
            return {
                address: `${url.protocol}//${url.host}`,
                username: url.username,
                password: url.password,
            };
        }
        if (this.isolatedMitm) {
            // don't use password for an isolated mitm proxy
            return { address: `localhost:${this.isolatedMitm.port}` };
        }
        return { address: null, password: this.id };
    }
    constructor(options = {}, pool) {
        super();
        this.options = options;
        this.pool = pool;
        this.events = new EventSubscriber_1.default();
        this.enableMitm = true;
        this.closeBrowserOnClose = false;
        // We use secretKey all through Agent components to make sure websites can't test if hero is present.
        // Without this secretKey if would be pretty easy to detect hero.
        this.secretKey = (0, nanoid_1.nanoid)();
        this.id = options.id ?? (0, nanoid_1.nanoid)();
        if (!this.pool) {
            this.pool = new Pool_1.default({ maxConcurrentAgents: 1 });
            this.events.once(this, 'close', () => this.pool.close());
            this.closeBrowserOnClose = true;
        }
        this.logger =
            options.logger?.createChild(module) ??
                log.createChild(module, {
                    sessionId: this.id,
                });
        this.plugins = new Plugins_1.default(options, options.plugins, options.pluginConfigs);
        this.mitmRequestSession = new unblocked_agent_mitm_1.RequestSession(this.id, this.plugins, this.logger, this.plugins.profile.upstreamProxyUrl, this.plugins.profile.upstreamProxyUseLocalDns);
        this.enableMitm = !env_1.default.disableMitm && !this.plugins.profile.options.disableMitm;
        this.logger.info('Agent created', {
            id: this.id,
            incognito: this.isIncognito,
            hasHooks: !!this.plugins.hasHooks,
            browserEngine: this.plugins.profile.browserEngine
                ? { fullVersion: this.plugins.profile.browserEngine.fullVersion }
                : 'unassigned',
        });
    }
    async open() {
        if (this.isOpen)
            return this.isOpen.promise;
        this.isOpen = new Resolvable_1.default();
        try {
            if (!this.options.browserEngine)
                throw new Error('A browserEngine is required to create a new Agent instance.');
            const pool = this.pool;
            await pool.waitForAvailability(this);
            const browser = await pool.getBrowser(this.options.browserEngine, this.id, this.plugins, this.plugins.profile.options);
            if (this.closeBrowserOnClose) {
                this.events.once(this, 'close', () => browser.close());
            }
            this.events.once(browser, 'close', () => this.close());
            if (this.enableMitm) {
                if (browser.supportsBrowserContextProxy && this.isIncognito) {
                    const mitmProxy = await pool.createMitmProxy();
                    this.isolatedMitm = mitmProxy;
                    // register session will automatically close with the request session
                    mitmProxy.registerSession(this.mitmRequestSession, true);
                }
                else {
                    pool.sharedMitmProxy.registerSession(this.mitmRequestSession, false);
                }
            }
            this.logger.info('Agent Opening in Pool', {
                id: this.id,
                browserId: browser.id,
                mitmEnabled: this.enableMitm,
                usingIsolatedMitm: !!this.isolatedMitm,
                isIncognito: this.isIncognito,
            });
            const context = await this.createBrowserContext(browser);
            this.isOpen?.resolve(context);
            return context;
        }
        catch (err) {
            const openPromise = this.isOpen;
            await this.close();
            if (openPromise) {
                openPromise.reject(err);
            }
            return openPromise;
        }
    }
    async newPage() {
        if (!this.browserContext)
            await this.open();
        return this.browserContext.newPage();
    }
    hook(hooks) {
        this.plugins.hook(hooks);
        return this;
    }
    async close() {
        if (this.isClosing)
            return this.isClosing;
        const id = this.logger.info('Agent.Closing');
        this.isClosing = new Resolvable_1.default();
        try {
            await this.browserContext?.close();
        }
        catch (error) {
            this.logger.warn('Agent.CloseBrowserContextError', { error });
        }
        try {
            this.mitmRequestSession.close();
        }
        catch (error) {
            this.logger.warn('Agent.CloseMitmRequestSessionError', { error });
        }
        try {
            this.isolatedMitm?.close();
        }
        catch (error) {
            this.logger.warn('Agent.CloseIsolatedError', { error });
        }
        try {
            this.emit('close');
            this.events.close();
            this.plugins.onClose();
            this.cleanup();
        }
        catch (error) {
            this.logger.warn('Agent.CloseError', { parentLogId: id, error });
        }
        finally {
            this.logger.stats('Agent.Closed', { parentLogId: id });
            this.isClosing.resolve();
        }
        return this.isClosing;
    }
    async createBrowserContext(browser) {
        this.browserContext = await browser.newContext({
            logger: this.logger,
            proxy: this.proxyConnectionInfo,
            hooks: this.plugins,
            isIncognito: this.isIncognito,
            commandMarker: this.options.commandMarker,
            secretKey: this.secretKey,
        });
        this.events.once(this.browserContext, 'close', () => this.close());
        if (this.enableMitm) {
            // hook request session to browserContext (this is how RequestSession subscribes to new page creations)
            this.plugins.hook(this.mitmRequestSession);
            const requestSession = this.mitmRequestSession;
            this.browserContext.resources.connectToMitm(requestSession);
            await this.plugins.onHttpAgentInitialized(requestSession.requestAgent);
        }
        else {
            await this.plugins.onHttpAgentInitialized(null);
        }
        return this.browserContext;
    }
    cleanup() {
        this.browserContext = null;
        this.isOpen = null;
        this.isolatedMitm = null;
        this.options.commandMarker = null;
    }
}
exports.default = Agent;
//# sourceMappingURL=Agent.js.map