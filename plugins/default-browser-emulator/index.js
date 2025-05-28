"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var _DefaultBrowserEmulator_domOverridesBuilder;
var DefaultBrowserEmulator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = exports.defaultBrowserEngine = void 0;
const IUnblockedPlugin_1 = require("@ulixee/unblocked-specification/plugin/IUnblockedPlugin");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const Viewports_1 = require("./lib/Viewports");
const BrowserEngine_1 = require("./lib/BrowserEngine");
const setWorkerDomOverrides_1 = require("./lib/setWorkerDomOverrides");
const setPageDomOverrides_1 = require("./lib/setPageDomOverrides");
const setUserAgent_1 = require("./lib/helpers/setUserAgent");
const setScreensize_1 = require("./lib/helpers/setScreensize");
const setTimezone_1 = require("./lib/helpers/setTimezone");
const setLocale_1 = require("./lib/helpers/setLocale");
const setActiveAndFocused_1 = require("./lib/helpers/setActiveAndFocused");
const selectUserAgentOption_1 = require("./lib/helpers/selectUserAgentOption");
const modifyHeaders_1 = require("./lib/helpers/modifyHeaders");
const configureSessionDns_1 = require("./lib/helpers/configureSessionDns");
const configureSessionTcp_1 = require("./lib/helpers/configureSessionTcp");
const configureSessionTls_1 = require("./lib/helpers/configureSessionTls");
const DataLoader_1 = require("./lib/DataLoader");
const selectBrowserEngineOption_1 = require("./lib/helpers/selectBrowserEngineOption");
const setGeolocation_1 = require("./lib/helpers/setGeolocation");
const configureBrowserLaunchArgs_1 = require("./lib/helpers/configureBrowserLaunchArgs");
const loadDomOverrides_1 = require("./lib/loadDomOverrides");
const configureDeviceProfile_1 = require("./lib/helpers/configureDeviceProfile");
const configureHttp2Session_1 = require("./lib/helpers/configureHttp2Session");
const lookupPublicIp_1 = require("./lib/helpers/lookupPublicIp");
const UserAgentOptions_1 = require("./lib/UserAgentOptions");
const BrowserEngineOptions_1 = require("./lib/BrowserEngineOptions");
const package_json_1 = require("./package.json");
const IBrowserEmulatorConfig_1 = require("./interfaces/IBrowserEmulatorConfig");
// Configuration to rotate out the default browser id. Used for testing different browsers via cli
const defaultBrowserId = process.env.ULX_DEFAULT_BROWSER_ID;
const dataLoader = new DataLoader_1.default();
const browserEngineOptions = new BrowserEngineOptions_1.default(dataLoader, defaultBrowserId);
const userAgentOptions = new UserAgentOptions_1.default(dataLoader, browserEngineOptions);
exports.defaultBrowserEngine = browserEngineOptions.default;
const { log } = (0, Logger_1.default)(module);
let hasWarnedAboutProxyIp = false;
const allEnabled = Object.values(IBrowserEmulatorConfig_1.InjectedScript).reduce((acc, value) => {
    return { ...acc, [value]: true };
}, {});
exports.defaultConfig = {
    ...allEnabled,
    [IBrowserEmulatorConfig_1.InjectedScript.JSON_STRINGIFY]: false,
    [IBrowserEmulatorConfig_1.InjectedScript.CONSOLE]: false,
};
let DefaultBrowserEmulator = DefaultBrowserEmulator_1 = class DefaultBrowserEmulator {
    get userAgentString() {
        return this.emulationProfile.userAgentOption.string;
    }
    get browserEngine() {
        return this.emulationProfile.browserEngine;
    }
    get deviceProfile() {
        return this.emulationProfile.deviceProfile;
    }
    get domOverridesBuilder() {
        __classPrivateFieldSet(this, _DefaultBrowserEmulator_domOverridesBuilder, __classPrivateFieldGet(this, _DefaultBrowserEmulator_domOverridesBuilder, "f") ?? (0, loadDomOverrides_1.default)(this.config, this.emulationProfile, this.data, this.userAgentData), "f");
        return __classPrivateFieldGet(this, _DefaultBrowserEmulator_domOverridesBuilder, "f");
    }
    constructor(emulationProfile, config) {
        _DefaultBrowserEmulator_domOverridesBuilder.set(this, void 0);
        this.config = config ?? exports.defaultConfig;
        this.logger = emulationProfile.logger ?? log.createChild(module);
        this.emulationProfile = emulationProfile;
        this.data = dataLoader.as(emulationProfile.userAgentOption);
        this.userAgentData = this.getUserAgentData();
        // set default device profile options
        emulationProfile.deviceProfile ??= {};
        (0, configureDeviceProfile_1.default)(this.deviceProfile);
    }
    configure(emulationProfile) {
        emulationProfile.windowNavigatorPlatform ??=
            this.data.windowNavigator.navigator.platform._$value;
        emulationProfile.locale ??= this.data.browserConfig.defaultLocale;
        emulationProfile.viewport ??= Viewports_1.default.getDefault(this.data.windowBaseFraming, this.data.windowFraming);
        this.deviceProfile.viewport = emulationProfile.viewport;
        emulationProfile.timezoneId ??= Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (emulationProfile.upstreamProxyUrl && !emulationProfile.upstreamProxyIpMask) {
            if (!hasWarnedAboutProxyIp) {
                hasWarnedAboutProxyIp = true;
                console.warn("You're using an upstreamProxyUrl without a Proxy IP Mask. This can expose the public IP of your host machine via WebRTC leaks in Chrome. To resolve, you can use the upstreamProxyIpMask feature.");
            }
        }
        emulationProfile.browserEngine.isHeaded = emulationProfile.options.showChrome;
    }
    onDnsConfiguration(settings) {
        (0, configureSessionDns_1.default)(this.emulationProfile, settings);
    }
    onTcpConfiguration(settings) {
        if (DefaultBrowserEmulator_1.enableTcpEmulation) {
            (0, configureSessionTcp_1.default)(this.emulationProfile, settings);
        }
    }
    onTlsConfiguration(settings) {
        (0, configureSessionTls_1.default)(this.emulationProfile, settings);
    }
    beforeHttpRequest(resource) {
        (0, modifyHeaders_1.default)(this.emulationProfile, this.data, this.userAgentData, resource);
    }
    async onHttpAgentInitialized(agent) {
        const profile = this.emulationProfile;
        const upstreamProxyIpMask = profile.upstreamProxyIpMask;
        if (upstreamProxyIpMask && profile.upstreamProxyUrl) {
            upstreamProxyIpMask.publicIp ??= await (0, lookupPublicIp_1.default)(upstreamProxyIpMask.ipLookupService);
            upstreamProxyIpMask.proxyIp ??= await (0, lookupPublicIp_1.default)(upstreamProxyIpMask.ipLookupService, agent, profile.upstreamProxyUrl);
            if (upstreamProxyIpMask.proxyIp === upstreamProxyIpMask.publicIp) {
                this.logger.error('upstreamProxyIpMask Lookup showing same IP for Proxy and Machine IP. Please check these settings.', {
                    ...upstreamProxyIpMask,
                });
                return;
            }
            this.logger.info('PublicIp Lookup', {
                ...upstreamProxyIpMask,
            });
            this.domOverridesBuilder.add(IBrowserEmulatorConfig_1.InjectedScript.WEBRTC, {
                localIp: upstreamProxyIpMask.publicIp,
                proxyIp: upstreamProxyIpMask.proxyIp,
            });
        }
    }
    onHttp2SessionConnect(request, settings) {
        (0, configureHttp2Session_1.default)(this.emulationProfile, this.data, request, settings);
    }
    onNewBrowser(browser, options) {
        (0, configureBrowserLaunchArgs_1.configureBrowserLaunchArgs)(browser.engine, options);
    }
    addDomOverride(runOn, script, args, callback) {
        if (runOn === 'page') {
            this.domOverridesBuilder.addPageScript(script, args, callback);
        }
        else {
            if (callback) {
                throw new Error("Sorry, we can't add a callback function to a Worker environment.");
            }
            this.domOverridesBuilder.addWorkerScript(script, args);
        }
        return true;
    }
    onClose() {
        __classPrivateFieldGet(this, _DefaultBrowserEmulator_domOverridesBuilder, "f")?.cleanup();
        __classPrivateFieldSet(this, _DefaultBrowserEmulator_domOverridesBuilder, null, "f");
    }
    onNewPage(page) {
        // Don't await here! we want to queue all these up to run before the debugger resumes
        const devtools = page.devtoolsSession;
        const emulationProfile = this.emulationProfile;
        return Promise.all([
            (0, setUserAgent_1.default)(emulationProfile, devtools, this.userAgentData),
            (0, setTimezone_1.default)(emulationProfile, devtools),
            (0, setLocale_1.default)(emulationProfile, devtools),
            (0, setScreensize_1.default)(emulationProfile, page, devtools),
            (0, setActiveAndFocused_1.default)(emulationProfile, devtools),
            (0, setPageDomOverrides_1.default)(this.domOverridesBuilder, this.data, page),
            (0, setGeolocation_1.default)(emulationProfile, page),
        ]);
    }
    onNewFrameProcess(frame) {
        // Don't await here! we want to queue all these up to run before the debugger resumes
        const devtools = frame.devtoolsSession;
        const emulationProfile = this.emulationProfile;
        return Promise.all([
            (0, setUserAgent_1.default)(emulationProfile, devtools, this.userAgentData),
            (0, setTimezone_1.default)(emulationProfile, devtools),
            (0, setLocale_1.default)(emulationProfile, devtools),
            (0, setPageDomOverrides_1.default)(this.domOverridesBuilder, this.data, frame.page, frame.devtoolsSession),
            (0, setGeolocation_1.default)(emulationProfile, frame),
        ]);
    }
    onNewWorker(worker) {
        const devtools = worker.devtoolsSession;
        return Promise.all([
            (0, setUserAgent_1.default)(this.emulationProfile, devtools, this.userAgentData),
            (0, setWorkerDomOverrides_1.default)(this.domOverridesBuilder, this.data, worker),
        ]);
    }
    getUserAgentData() {
        if (!this.data.windowNavigator.navigator.userAgentData)
            return null;
        const { browserVersion, uaClientHintsPlatformVersion } = this.emulationProfile.userAgentOption;
        const uaFullVersion = `${browserVersion.major}.0.${browserVersion.build}.${browserVersion.patch}`;
        const brands = this.data.windowNavigator.navigator.userAgentData.brands;
        const brandData = [brands['0'], brands['1'], brands['2']].map(x => ({
            brand: x.brand._$value,
            version: x.version._$value,
        }));
        const fullVersionList = brandData.map(x => ({
            brand: x.brand,
            version: x.brand === 'Chromium' || x.brand === 'Chrome' ? uaFullVersion : `${x.version}.0.0.0`,
        }));
        return {
            uaFullVersion,
            brands: brandData,
            fullVersionList,
            platform: this.data.windowNavigator.navigator.userAgentData.platform._$value,
            platformVersion: uaClientHintsPlatformVersion,
            architecture: 'x86',
            model: '',
            mobile: false,
            wow64: false,
        };
    }
    static shouldActivate(emulationProfile) {
        if (emulationProfile.userAgentOption &&
            !userAgentOptions.hasDataSupport(emulationProfile.userAgentOption)) {
            emulationProfile.logger?.info("DefaultBrowserEmulator doesn't have data file for the provided userAgentOption", { userAgentOption: emulationProfile.userAgentOption });
            return false;
        }
        // assign a browser engine and user agent option if not provided
        if (!emulationProfile.userAgentOption) {
            try {
                const { browserEngine, userAgentOption } = DefaultBrowserEmulator_1.selectBrowserMeta(emulationProfile.customEmulatorConfig?.userAgentSelector);
                emulationProfile.browserEngine = browserEngine;
                emulationProfile.userAgentOption = userAgentOption;
            }
            catch (e) {
                if (emulationProfile.customEmulatorConfig?.userAgentSelector) {
                    emulationProfile.logger?.error('Failed to instantiate a default browser engine.', {
                        error: e,
                    });
                }
                return false;
            }
        }
        if (emulationProfile.userAgentOption && !emulationProfile.browserEngine) {
            try {
                emulationProfile.browserEngine = DefaultBrowserEmulator_1.getBrowserEngine(emulationProfile.userAgentOption);
            }
            catch (e) {
                emulationProfile.logger?.error('Failed to get a browser engine for the configured userAgentOption', {
                    error: e,
                    userAgentOption: emulationProfile.userAgentOption,
                });
                return false;
            }
        }
        return true;
    }
    static selectBrowserMeta(userAgentSelector) {
        const userAgentOption = (0, selectUserAgentOption_1.default)(userAgentSelector, userAgentOptions);
        const browserEngine = this.getBrowserEngine(userAgentOption);
        return { browserEngine, userAgentOption };
    }
    static getBrowserEngine(userAgentOption) {
        const { browserName, browserVersion } = userAgentOption;
        const browserEngineId = `${browserName}-${browserVersion.major}-${browserVersion.minor}`;
        const browserEngineOption = (0, selectBrowserEngineOption_1.default)(browserEngineId, dataLoader.browserEngineOptions);
        if (!browserEngineOption)
            throw new Error(`Unable to load BrowserEngine (${browserEngineId})`);
        return new BrowserEngine_1.default(browserEngineOption);
    }
    static default() {
        return new BrowserEngine_1.default(exports.defaultBrowserEngine);
    }
};
_DefaultBrowserEmulator_domOverridesBuilder = new WeakMap();
DefaultBrowserEmulator.id = package_json_1.name;
// Should the system attempt to manipulate tcp settings to match the emulated OS. NOTE that this can affect tcp performance.
DefaultBrowserEmulator.enableTcpEmulation = false;
DefaultBrowserEmulator = DefaultBrowserEmulator_1 = __decorate([
    IUnblockedPlugin_1.UnblockedPluginClassDecorator
], DefaultBrowserEmulator);
exports.default = DefaultBrowserEmulator;
//# sourceMappingURL=index.js.map