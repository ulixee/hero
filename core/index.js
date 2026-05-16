"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationTrigger = exports.Session = exports.Tab = void 0;
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const ShutdownHandler_1 = require("@ulixee/commons/lib/ShutdownHandler");
const utils_1 = require("@ulixee/commons/lib/utils");
const default_browser_emulator_1 = require("@ulixee/default-browser-emulator");
const default_human_emulator_1 = require("@ulixee/default-human-emulator");
const IPluginTypes_1 = require("@ulixee/hero-interfaces/IPluginTypes");
const extractPlugins_1 = require("@ulixee/hero-plugin-utils/lib/utils/extractPlugins");
const requirePlugins_1 = require("@ulixee/hero-plugin-utils/lib/utils/requirePlugins");
const EmittingTransportToClient_1 = require("@ulixee/net/lib/EmittingTransportToClient");
const Pool_1 = require("@ulixee/unblocked-agent/lib/Pool");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
Object.defineProperty(exports, "LocationTrigger", { enumerable: true, get: function () { return Location_1.LocationTrigger; } });
const Fs = require("fs");
const Path = require("path");
const ConnectionToHeroClient_1 = require("./connections/ConnectionToHeroClient");
const DefaultSessionRegistry_1 = require("./dbs/DefaultSessionRegistry");
const NetworkDb_1 = require("./dbs/NetworkDb");
const env_1 = require("./env");
const Session_1 = require("./lib/Session");
exports.Session = Session_1.default;
const Tab_1 = require("./lib/Tab");
exports.Tab = Tab_1.default;
const { log } = (0, Logger_1.default)(module);
class HeroCore extends eventUtils_1.TypedEventEmitter {
    get defaultUnblockedPlugins() {
        if (this.pool)
            return this.pool.plugins;
    }
    set defaultUnblockedPlugins(value) {
        this.pool.plugins = value;
    }
    get dataDir() {
        return this.options.dataDir;
    }
    constructor(options = {}) {
        super();
        this.options = options;
        this.connections = new Set();
        this.corePluginsById = {};
        this.clearIdleConnectionsAfterMillis = -1;
        (0, utils_1.bindFunctions)(this);
        this.id = HeroCore.idCounter++;
        HeroCore.instances.push(this);
        options.dataDir ??= HeroCore.dataDir;
        if (!Path.isAbsolute(options.dataDir)) {
            options.dataDir = Path.join(process.cwd(), options.dataDir);
        }
        options.disableSessionPersistence ??= env_1.default.disableSessionPersistence;
        try {
            Fs.mkdirSync(`${options.dataDir}`, { recursive: true });
        }
        catch { }
        this.sessionRegistry =
            options.sessionRegistry ??
                new DefaultSessionRegistry_1.default(Path.join(this.dataDir, 'hero-sessions'));
        this.networkDb = new NetworkDb_1.default(this.dataDir);
        this.corePluginsById = { ...(HeroCore.defaultCorePluginsById ?? {}) };
        this.pool = new Pool_1.default({
            certificateStore: this.networkDb.certificates,
            dataDir: this.dataDir,
            logger: log.createChild(module),
            maxConcurrentAgents: options.maxConcurrentClientCount,
            maxConcurrentAgentsPerBrowser: options.maxConcurrentClientsPerBrowser,
            plugins: options.defaultUnblockedPlugins ?? HeroCore.defaultUnblockedPlugins,
        });
        this.setMaxListeners(this.pool.maxConcurrentAgents + 2);
        this.pool.addEventEmitter(this, [
            'all-browsers-closed',
            'browser-has-no-open-windows',
            'browser-launched',
        ]);
        this.pool.addEventEmitter(HeroCore.events, [
            'all-browsers-closed',
            'browser-has-no-open-windows',
            'browser-launched',
        ]);
    }
    addConnection(transportToClient) {
        transportToClient ??= new EmittingTransportToClient_1.default();
        const connection = new ConnectionToHeroClient_1.default(transportToClient, this);
        connection.once('disconnected', () => this.connections.delete(connection));
        this.connections.add(connection);
        return connection;
    }
    getUtilityContext() {
        if (this.utilityBrowserContext)
            return this.utilityBrowserContext;
        this.utilityBrowserContext = this.pool
            .getBrowser(default_browser_emulator_1.default.default(), `utility-${this.id}`, {}, {
            showChrome: false,
        })
            .then(browser => browser.newContext({ logger: log, isIncognito: true }));
        return this.utilityBrowserContext;
    }
    async start() {
        if (this.isStarting)
            return this.isStarting;
        HeroCore.registerSignals(this.options.shouldShutdownOnSignals);
        const startLogId = log.info('Core.start', {
            options: this.options,
            sessionId: null,
        });
        this.isClosing = null;
        this.isStarting = this.pool.start();
        await this.isStarting;
        log.info('Core started', {
            sessionId: null,
            parentLogId: startLogId,
            dataDir: this.dataDir,
        });
    }
    async close() {
        if (this.isClosing)
            return this.isClosing;
        const isClosing = new Resolvable_1.default();
        this.isClosing = isClosing.promise;
        this.isStarting = null;
        const idx = HeroCore.instances.indexOf(this);
        if (idx >= 0)
            HeroCore.instances.splice(idx, 1);
        const logid = log.info('Core.shutdown');
        let shutDownErrors = [];
        try {
            shutDownErrors = await Promise.all([
                ...[...this.connections].map(x => x.disconnect().catch(err => err)),
                this.utilityBrowserContext?.then(x => x.close()).catch(err => err),
                this.pool?.close().catch(err => err),
            ]);
            shutDownErrors = shutDownErrors.filter(Boolean);
            this.utilityBrowserContext = null;
            this.networkDb?.close();
            await this.sessionRegistry?.shutdown().catch(err => {
                if (err)
                    shutDownErrors.push(err);
            });
            isClosing.resolve();
        }
        catch (error) {
            isClosing.reject(error);
        }
        finally {
            this.emit('close');
            log.info('Core.shutdownComplete', {
                parentLogId: logid,
                sessionId: null,
                errors: shutDownErrors.length ? shutDownErrors : undefined,
            });
        }
        return isClosing.promise;
    }
    use(PluginObject) {
        let Plugins;
        if (typeof PluginObject === 'string') {
            Plugins = (0, requirePlugins_1.default)(PluginObject);
        }
        else {
            Plugins = (0, extractPlugins_1.default)(PluginObject);
        }
        for (const Plugin of Plugins) {
            if (Plugin.type === IPluginTypes_1.PluginTypes.CorePlugin) {
                this.corePluginsById[Plugin.id] = Plugin;
            }
        }
    }
    static async start(options = {}) {
        // this method only creates a single core. To create multiple, you can create them individually, but you usually want a single core
        if (this.instances.length > 0) {
            return this.instances[0];
        }
        const core = new HeroCore(options);
        await core.start();
        return core;
    }
    static addConnection(transportToClient) {
        if (!this.instances.length) {
            new HeroCore();
        }
        return this.instances[0].addConnection(transportToClient);
    }
    static async shutdown() {
        if (this.isShuttingDown)
            return this.isShuttingDown;
        ShutdownHandler_1.default.unregister(this.shutdown);
        this.isShuttingDown = Promise.allSettled(this.instances.map(x => x.close()));
        await this.isShuttingDown;
        if (this.onShutdown)
            this.onShutdown();
    }
    static use(PluginObject) {
        let Plugins;
        if (typeof PluginObject === 'string') {
            Plugins = (0, requirePlugins_1.default)(PluginObject);
        }
        else {
            Plugins = (0, extractPlugins_1.default)(PluginObject);
        }
        for (const Plugin of Plugins) {
            if (Plugin.type === IPluginTypes_1.PluginTypes.CorePlugin) {
                this.defaultCorePluginsById[Plugin.id] = Plugin;
            }
        }
    }
    static registerSignals(shouldShutdownOnSignals = true) {
        if (this.didRegisterSignals)
            return;
        this.didRegisterSignals = true;
        if (!shouldShutdownOnSignals)
            ShutdownHandler_1.default.disableSignals = true;
        this.shutdown = this.shutdown.bind(this);
        ShutdownHandler_1.default.register(this.shutdown);
        if (process.env.NODE_ENV !== 'test') {
            process.on('uncaughtExceptionMonitor', (error, origin) => {
                if (!error || error[Logger_1.hasBeenLoggedSymbol])
                    return;
                log.error('UnhandledError(fatal)', { error, origin, sessionId: null });
            });
            process.on('unhandledRejection', (error) => {
                if (!error || error[Logger_1.hasBeenLoggedSymbol])
                    return;
                log.error('UnhandledRejection', { error, sessionId: null });
            });
        }
    }
}
HeroCore.allowDynamicPluginLoading = true;
HeroCore.defaultCorePluginsById = {};
HeroCore.events = new eventUtils_1.TypedEventEmitter();
HeroCore.defaultUnblockedPlugins = [
    default_browser_emulator_1.default,
    default_human_emulator_1.default,
];
HeroCore.dataDir = env_1.default.dataDir;
HeroCore.instances = [];
HeroCore.idCounter = 0;
exports.default = HeroCore;
//# sourceMappingURL=index.js.map