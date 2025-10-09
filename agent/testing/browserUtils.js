"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageHooks = exports.browserEngineOptions = exports.newPoolOptions = exports.defaultHooks = exports.defaultBrowserEngine = void 0;
exports.createDefaultBrowser = createDefaultBrowser;
const Browser_1 = require("@ulixee/unblocked-agent/lib/Browser");
const ChromeEngine_1 = require("@ulixee/unblocked-agent/lib/ChromeEngine");
const index_1 = require("./index");
// eslint-disable-next-line import/no-dynamic-require
const ChromeApp = require(ChromeEngine_1.default.defaultPackageName);
exports.defaultBrowserEngine = new ChromeEngine_1.default(new ChromeApp());
exports.defaultHooks = {
    onNewBrowser(b) {
        b.engine.launchArguments.push('--password-store=basic', '--use-mock-keychain');
    },
};
exports.newPoolOptions = { defaultBrowserEngine: exports.defaultBrowserEngine };
exports.browserEngineOptions = exports.defaultBrowserEngine;
function createDefaultBrowser() {
    const browser = new Browser_1.default(exports.defaultBrowserEngine);
    index_1.Helpers.onClose(() => browser.close(), true);
    return browser;
}
class PageHooks {
    constructor(config = {}) {
        this.viewport = {
            screenHeight: 900,
            screenWidth: 1024,
            positionY: 0,
            positionX: 0,
            height: 900,
            width: 1024,
        };
        this.locale = 'en';
        this.timezoneId = 'America/New_York';
        this.userAgentString = 'Browser Test';
        this.operatingSystemPlatform = 'linux';
        config.locale ??= this.locale;
        config.viewport ??= this.viewport;
        config.timezoneId ??= this.timezoneId;
        config.osPlatform ??= this.operatingSystemPlatform;
        this.locale = config.locale;
        this.viewport = config.viewport;
        this.timezoneId = config.timezoneId;
        this.operatingSystemPlatform = config.osPlatform;
        if (config.userAgent) {
            this.userAgentString = config.userAgent;
        }
    }
    async onNewPage(page) {
        const devtools = page.devtoolsSession;
        await Promise.all([
            devtools.send('Network.setUserAgentOverride', {
                userAgent: this.userAgentString,
                acceptLanguage: this.locale,
                platform: this.operatingSystemPlatform,
            }),
            devtools
                .send('Emulation.setTimezoneOverride', { timezoneId: this.timezoneId })
                .catch(() => null),
            devtools.send('Emulation.setLocaleOverride', { locale: this.locale }).catch(err => err),
            this.viewport
                ? devtools
                    .send('Emulation.setDeviceMetricsOverride', {
                    width: this.viewport.width,
                    height: this.viewport.height,
                    deviceScaleFactor: 1,
                    positionX: this.viewport.positionX,
                    positionY: this.viewport.positionY,
                    screenWidth: this.viewport.screenWidth,
                    screenHeight: this.viewport.screenHeight,
                    mobile: false,
                })
                    .catch(() => null)
                : null,
            devtools.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(err => err),
        ]);
    }
    async onNewBrowser(browser) {
        browser.engine.launchArguments.push('--force-color-profile=srgb');
    }
}
exports.PageHooks = PageHooks;
//# sourceMappingURL=browserUtils.js.map