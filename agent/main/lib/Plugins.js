"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chrome_app_1 = require("@ulixee/chrome-app");
const ChromeEngine_1 = require("./ChromeEngine");
const Interactor_1 = require("./Interactor");
class Plugins {
    get hasHooks() {
        for (const list of Object.values(this.hooksByName))
            if (list.length)
                return true;
        return false;
    }
    constructor(emulationProfile, pluginClasses, pluginConfigs = {}) {
        this.profile = {};
        this.isStarted = false;
        this.instances = [];
        this.hooksByName = {
            configure: [],
            onClose: [],
            addDomOverride: [],
            playInteractions: [],
            adjustStartingMousePoint: [],
            onNewBrowser: [],
            onNewBrowserContext: [],
            onDevtoolsPanelAttached: [],
            onNewPage: [],
            onNewFrameProcess: [],
            onNewWorker: [],
            onDevtoolsPanelDetached: [],
            onDnsConfiguration: [],
            onTcpConfiguration: [],
            onTlsConfiguration: [],
            onHttpAgentInitialized: [],
            onHttp2SessionConnect: [],
            shouldInterceptRequest: [],
            handleInterceptedRequest: [],
            beforeHttpRequest: [],
            beforeHttpRequestBody: [],
            beforeHttpResponse: [],
            beforeHttpResponseBody: [],
            afterHttpResponse: [],
            websiteHasFirstPartyInteraction: [],
        };
        this.profile = emulationProfile ?? {};
        this.profile.options ??= {};
        Object.assign(this.profile, this.profile.options);
        pluginClasses ??= [];
        pluginConfigs ??= {};
        if (this.profile.browserEngine instanceof chrome_app_1.default) {
            this.profile.browserEngine = new ChromeEngine_1.default(this.profile.browserEngine);
        }
        for (const Plugin of pluginClasses) {
            const config = pluginConfigs[Plugin.id];
            let plugin;
            // true shortcircuits and doesn't check shouldActivate
            if (config === true) {
                plugin = new Plugin(this.profile);
            }
            else if (config === false || Plugin.shouldActivate?.(this.profile, config) === false) {
                continue;
            }
            else {
                plugin = new Plugin(this.profile, config);
            }
            this.instances.push(plugin);
            this.hook(plugin, false);
        }
        if (!this.profile.browserEngine && !pluginClasses?.length) {
            try {
                this.profile.browserEngine = ChromeEngine_1.default.default();
            }
            catch (e) {
                this.profile.logger?.warn('Default Chrome Browser could not be found', {
                    packageId: ChromeEngine_1.default.defaultPackageName,
                });
            }
        }
        void this.configure(this.profile).catch(() => null);
    }
    hook(hooksToAdd, runConfigure = true) {
        for (const name in this.hooksByName) {
            if (!(name in hooksToAdd)) {
                continue;
            }
            const callbackFn = hooksToAdd[name].bind(hooksToAdd);
            this.hooksByName[name].push(callbackFn);
            if (runConfigure && name === 'configure' && !this.isStarted) {
                callbackFn(this.profile);
            }
        }
    }
    onClose() {
        for (const plugin of this.instances) {
            plugin.onClose?.();
        }
        this.instances.length = 0;
        this.profile = null;
    }
    addDomOverride(runOn, script, args, callback) {
        // delegate to first plugin implementing addDomOverride
        for (const plugin of this.instances) {
            if (plugin.addDomOverride?.(runOn, script, args, callback)) {
                return true;
            }
        }
        return false;
    }
    // INTERACTIONS
    async playInteractions(interactionGroups, runFn, helper) {
        if (this.hooksByName.playInteractions.length) {
            const playFn = this.hooksByName.playInteractions[this.hooksByName.playInteractions.length - 1];
            await playFn(interactionGroups, runFn, helper);
        }
        else {
            await Interactor_1.default.defaultPlayInteractions(interactionGroups, runFn);
        }
    }
    async adjustStartingMousePoint(point, helper) {
        for (const fn of this.hooksByName.adjustStartingMousePoint) {
            await fn(point, helper);
        }
    }
    // BROWSER EMULATORS
    async configure(profile) {
        await Promise.all(this.hooksByName.configure.map(fn => fn(profile)));
    }
    async onNewBrowser(browser, launchArgs) {
        this.isStarted = true;
        await Promise.all(this.hooksByName.onNewBrowser.map(fn => fn(browser, launchArgs)));
    }
    async onNewPage(page) {
        await Promise.all(this.hooksByName.onNewPage.map(fn => fn(page)));
    }
    async onNewFrameProcess(frame) {
        await Promise.all(this.hooksByName.onNewFrameProcess.map(fn => fn(frame)));
    }
    async onNewWorker(worker) {
        await Promise.all(this.hooksByName.onNewWorker.map(fn => fn(worker)));
    }
    async onNewBrowserContext(context) {
        this.isStarted = true;
        await Promise.all(this.hooksByName.onNewBrowserContext.map(fn => fn(context)));
    }
    async onDevtoolsPanelAttached(devtoolsSession) {
        await Promise.all(this.hooksByName.onDevtoolsPanelAttached.map(fn => fn(devtoolsSession)));
    }
    async onDevtoolsPanelDetached(devtoolsSession) {
        await Promise.all(this.hooksByName.onDevtoolsPanelDetached.map(fn => fn(devtoolsSession)));
    }
    // NETWORK
    onDnsConfiguration(settings) {
        for (const fn of this.hooksByName.onDnsConfiguration)
            void fn(settings);
    }
    onTcpConfiguration(settings) {
        for (const fn of this.hooksByName.onTcpConfiguration)
            void fn(settings);
    }
    onTlsConfiguration(settings) {
        for (const fn of this.hooksByName.onTlsConfiguration)
            void fn(settings);
    }
    async onHttpAgentInitialized(agent) {
        await Promise.all(this.hooksByName.onHttpAgentInitialized.map(fn => fn(agent)));
    }
    async onHttp2SessionConnect(resource, settings) {
        await Promise.all(this.hooksByName.onHttp2SessionConnect.map(fn => fn(resource, settings)));
    }
    async shouldInterceptRequest(url, resourceTypeIfKnown) {
        for (const hook of this.hooksByName.shouldInterceptRequest) {
            if (await hook(url, resourceTypeIfKnown))
                return true;
        }
        return false;
    }
    async handleInterceptedRequest(url, type, request, response) {
        for (const fn of this.hooksByName.handleInterceptedRequest) {
            if (await fn(url, type, request, response)) {
                return true;
            }
        }
        return false;
    }
    async beforeHttpRequest(resource) {
        await Promise.all(this.hooksByName.beforeHttpRequest.map(fn => fn(resource)));
    }
    async beforeHttpRequestBody(resource) {
        await Promise.all(this.hooksByName.beforeHttpRequestBody.map(fn => fn(resource)));
    }
    async beforeHttpResponse(resource) {
        await Promise.all(this.hooksByName.beforeHttpResponse.map(fn => fn(resource)));
    }
    async beforeHttpResponseBody(resource) {
        await Promise.all(this.hooksByName.beforeHttpResponseBody.map(fn => fn(resource)));
    }
    async afterHttpResponse(resource) {
        await Promise.all(this.hooksByName.afterHttpResponse.map(fn => fn(resource)));
    }
    websiteHasFirstPartyInteraction(url) {
        for (const fn of this.hooksByName.websiteHasFirstPartyInteraction)
            void fn(url);
    }
}
exports.default = Plugins;
//# sourceMappingURL=Plugins.js.map