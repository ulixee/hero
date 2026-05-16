"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const SeleniumRunner_1 = require("@ulixee/double-agent-stacks/lib/SeleniumRunner");
const env_1 = require("../env");
class BrowserStack {
    static async buildWebDriver(browser, customCapabilities = {}) {
        const capabilities = {
            ...browser,
            ...browserstackSettings,
            ...(env_1.default.browserStackLocal ? browserstackLocalSettings : {}),
            'browserstack.selenium_version': getSeleniumVersion(browser),
            ...customCapabilities,
            acceptSslCert: shouldBypassSecurity(browser),
            browserName: browser.browser,
            chromeOptions: getChromeOptions(browser),
        };
        try {
            return await SeleniumRunner_1.default.createDriver('http://hub-cloud.browserstack.com/wd/hub', capabilities);
        }
        catch (err) {
            console.log(capabilities);
            console.log(err);
            console.log("Couldn't build driver for %s", browser);
        }
        return null;
    }
    static async createAgent(os, browser) {
        let osVersion = os.version.name;
        if (!osVersion) {
            osVersion = os.version.major;
            if (os.version.minor && os.version.minor !== '0') {
                osVersion += `.${os.version.minor}`;
            }
        }
        const agent = {
            browser: browser.name,
            browser_version: `${browser.version.major}.${browser.version.minor}`,
            os: os.name.replace('Mac OS', 'OS X'),
            os_version: osVersion,
        };
        if (await this.isBrowserSupported(agent)) {
            return agent;
        }
        console.log("BrowserStack doesn't support", browser.id, os.id);
        return null;
    }
    static async getCapabilities() {
        if (!this.supportedCapabilities.length) {
            this.supportedCapabilities = await axios_1.default.get('https://api.browserstack.com/automate/browsers.json', {
                auth: {
                    password: browserstackSettings['browserstack.key'],
                    username: browserstackSettings['browserstack.user'],
                },
            }).then(x => x.data);
        }
        return this.supportedCapabilities;
    }
    static async isBrowserSupported(agent) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { os, os_version, browser, browser_version } = agent;
        const capabilities = await BrowserStack.getCapabilities();
        return capabilities.find(x => {
            return (x.os === os &&
                x.os_version === os_version &&
                x.browser === browser.toLowerCase() &&
                (x.browser_version === browser_version || x.browser_version === `${browser_version}.0`));
        });
    }
}
BrowserStack.supportedCapabilities = [];
exports.default = BrowserStack;
const browserstackSettings = {
    resolution: '1024x768',
    'browserstack.user': env_1.default.browserStackUser,
    'browserstack.key': env_1.default.browserStackKey,
    'browserstack.idleTimeout': 300,
    'browserstack.safari.allowAllCookies': 'true',
    'browserstack.debug': 'true', // Enabling visual logs
    'browserstack.seleniumLogs': 'true',
    'browserstack.console': 'verbose', // Enabling console logs
    'browserstack.networkLogs': 'false', // Enabling network logs for the test
    checkURL: 'false',
    buildName: 'Profiles',
    projectName: 'Double Agent',
};
const browserstackLocalSettings = {
    acceptInsecureCerts: true,
    'browserstack.local': true,
    'browserstack.browserStackLocalOptions.forceLocal': true,
};
function getChromeOptions({ browser, browser_version: browserVersion }) {
    const [majorVersion] = browserVersion.split('.').map(x => Number(x));
    const args = [
        '--disable-blink-features=AutomationControlled',
        '--disable-site-isolation-trials',
    ];
    if (browser === 'Chrome' && majorVersion >= 80 && majorVersion < 84) {
        args.push('--enable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure');
    }
    return {
        args,
        excludeSwitches: [
            'enable-automation',
            'disable-background-networking',
            'safebrowsing-disable-auto-update',
        ],
    };
}
function shouldBypassSecurity({ os, os_version: osVersion }) {
    // El Capitan has a root cert issue that doesn't work with LetsEncrypt certs (says connection is not private)
    if (os === 'OS X' && (osVersion === 'El Capitan' || osVersion === 'Yosemite')) {
        return true;
    }
    return false;
}
function getSeleniumVersion({ browser, browser_version: browserVersion, os, os_version: osVersion, }) {
    const [majorVersion] = browserVersion.split('.').map(x => Number(x));
    if (os === 'OS X' &&
        osVersion === 'Snow Leopard' &&
        browser === 'Safari' &&
        browserVersion === '5.1') {
        return '2.5';
    }
    if (os === 'OS X' &&
        osVersion === 'Mountain Lion' &&
        browser === 'Safari' &&
        browserVersion === '6.2') {
        return '3.5.2';
    }
    if (os === 'OS X' && osVersion === 'Snow Leopard') {
        return '2.46.0';
    }
    if (browser === 'Opera') {
        return '2.43.1';
    }
    if (browser === 'Firefox' && browserVersion === '4.0' && os === 'OS X' && osVersion === 'Lion') {
        return '2.37.0';
    }
    if (browser === 'Firefox' && osVersion === 'XP') {
        return '2.53.1';
    }
    if (browser === 'Firefox' && majorVersion < 45) {
        return '2.53.1';
    }
    if (browser === 'Firefox' && majorVersion <= 52) {
        return '3.2.0';
    }
    if (browser === 'Chrome' && majorVersion < 45) {
        return '2.37.0';
    }
    return undefined;
}
//# sourceMappingURL=BrowserStack.js.map