"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Worker = void 0;
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const utils_1 = require("@ulixee/commons/lib/utils");
const ConsoleMessage_1 = require("./ConsoleMessage");
const NetworkManager_1 = require("./NetworkManager");
class Worker extends eventUtils_1.TypedEventEmitter {
    get isInitializationSent() {
        return this.initializationSent.promise;
    }
    get id() {
        return this.targetInfo.targetId;
    }
    get url() {
        return this.targetInfo.url;
    }
    get type() {
        return this.targetInfo.type;
    }
    constructor(browserContext, parentNetworkManager, devtoolsSession, logger, targetInfo) {
        super();
        this.hasLoadedResponse = false;
        this.initializationSent = (0, utils_1.createPromise)();
        this.events = new EventSubscriber_1.default();
        this.targetInfo = targetInfo;
        this.devtoolsSession = devtoolsSession;
        this.browserContext = browserContext;
        this.logger = logger.createChild(module, {
            workerTargetId: this.id,
            workerType: this.type,
        });
        this.networkManager = new NetworkManager_1.default(devtoolsSession, this.logger, browserContext.proxy, browserContext.secretKey);
        const session = this.devtoolsSession;
        this.events.on(session, 'Inspector.targetReloadedAfterCrash', () => {
            return this.initialize(parentNetworkManager);
        });
        this.events.once(session, 'disconnected', this.emit.bind(this, 'close'));
        this.isReady = this.initialize(parentNetworkManager).catch(err => err);
    }
    initialize(pageNetworkManager) {
        const { hooks } = this.browserContext;
        const result = Promise.all([
            this.networkManager.initializeFromParent(pageNetworkManager).catch(err => {
                // web workers can use parent network
                if (err.message.includes(`'Fetch.enable' wasn't found`))
                    return;
                throw err;
            }),
            this.type === 'shared_worker'
                ? this.devtoolsSession.send('Network.setCacheDisabled', { cacheDisabled: true })
                : null,
            this.initializeEmulation(hooks),
        ]);
        setImmediate(() => this.initializationSent.resolve());
        return result.then(() => null);
    }
    async evaluate(expression, isInitializationScript = false) {
        if (!isInitializationScript)
            await this.isReady;
        const result = await this.devtoolsSession.send('Runtime.evaluate', {
            expression,
            // To be able to use awaitPromise the eventloop must be running, which is not the
            // case during our initialization script since we pause debugger there.
            awaitPromise: !isInitializationScript,
            // contextId,
            returnByValue: true,
        });
        if (result.exceptionDetails) {
            throw ConsoleMessage_1.default.exceptionToError(result.exceptionDetails);
        }
        const remote = result.result;
        if (remote.objectId)
            this.devtoolsSession.disposeRemoteObject(remote);
        return remote.value;
    }
    close() {
        this.devtoolsSession.send('Target.closeTarget', { targetId: this.id }).catch(() => undefined);
        this.networkManager.close();
        this.cancelPendingEvents('Worker closing', ['close']);
        this.events.close();
    }
    toJSON() {
        return {
            id: this.id,
            url: this.url,
            type: this.type,
        };
    }
    async initializeEmulation(hooks) {
        if (!hooks.onNewWorker) {
            await this.devtoolsSession.send('Runtime.runIfWaitingForDebugger');
            return;
        }
        try {
            const emulationPromises = [hooks.onNewWorker(this)];
            // Not needed in blob worker since we already have a plugin that handles this.
            // This is needed because cdp is often times too slow to pause debugger, it could
            // be completely to late or pause debugger mid execution somewhere, all resulting
            // in very bad results and/or crashes.
            const isBlobWorker = this.targetInfo.url.startsWith('blob:');
            if (!isBlobWorker) {
                emulationPromises.push(this.devtoolsSession.send('Debugger.enable'), this.devtoolsSession.send('Debugger.setBreakpointByUrl', {
                    lineNumber: 0,
                    url: this.targetInfo.url,
                }));
            }
            // Service worker will lock up without this! This happens because of deadlock in chromium
            // where debugger is waiting for worker to be created but this only happens after runIfWaitingForDebugger.
            // Good news is: if we queue up everything this doesn't affect us, it's just weird...
            // https://issues.chromium.org/issues/40830027, https://issues.chromium.org/issues/40811832
            if (this.type === 'service_worker') {
                emulationPromises.push(this.devtoolsSession.send('Runtime.runIfWaitingForDebugger'));
            }
            await Promise.all(emulationPromises);
            await this.resumeAfterEmulation();
        }
        catch (error) {
            if (error instanceof IPendingWaitEvent_1.CanceledPromiseError)
                return;
            await this.resumeAfterEmulation().catch(() => null);
            this.logger.warn('Emulator.onNewWorkerError', {
                error,
            });
            throw error;
        }
    }
    resumeAfterEmulation() {
        return Promise.all([
            this.devtoolsSession.send('Debugger.disable'),
            this.devtoolsSession.send('Runtime.runIfWaitingForDebugger'),
        ]);
    }
}
exports.Worker = Worker;
//# sourceMappingURL=Worker.js.map