"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const chrome_app_1 = require("@ulixee/chrome-app");
const BrowserEngineOptions_1 = require("./BrowserEngineOptions");
class BrowserEngine {
    constructor(browserEngineOption) {
        this.launchArguments = [];
        this.doesBrowserAnimateScrolling = false;
        // figure out which one is closest to installed?
        this.engineFetcher = this.loadEngineFetcher(browserEngineOption);
        if (this.engineFetcher.launchArgs?.length) {
            this.launchArguments.push(...this.engineFetcher.launchArgs);
        }
        this.engineOption = browserEngineOption;
        this.name = browserEngineOption.name;
        this.fullVersion = this.engineFetcher.fullVersion;
        // changes at version 90
        this.doesBrowserAnimateScrolling = browserEngineOption.majorVersion > 90;
        this.executablePath = this.engineFetcher.executablePath;
        this.executablePathEnvVar = this.engineFetcher.executablePathEnvVar;
        this.isInstalled = this.engineFetcher.isInstalled;
    }
    async verifyLaunchable() {
        if (!(0, fs_1.existsSync)(this.executablePath)) {
            let remedyMessage = `No executable exists at "${this.executablePath}"`;
            const isCustomInstall = this.executablePathEnvVar && process.env[this.executablePathEnvVar];
            if (!isCustomInstall) {
                remedyMessage = `Please re-install the browser engine:
-------------------------------------------------
-------------- NPM INSTALL ----------------------
-------------------------------------------------

 npm install @ulixee/${this.engineOption.id}

-------------------------------------------------
`;
            }
            throw new Error(`Failed to launch ${this.name} ${this.fullVersion}:

${remedyMessage}`);
        }
        // exists, validate that host requirements exist
        await this.engineFetcher.validateHostRequirements();
    }
    loadEngineFetcher(option) {
        if (option.name !== 'chrome') {
            throw new Error(`Invalid browser engine requested ${option.name}`);
        }
        try {
            // eslint-disable-next-line global-require,import/no-dynamic-require
            let ChromeAtMajorVersion = require(`@ulixee/${option.id}`);
            if (ChromeAtMajorVersion.default) {
                ChromeAtMajorVersion = ChromeAtMajorVersion.default;
            }
            return new ChromeAtMajorVersion();
        }
        catch (err) {
            /* no op */
        }
        const fullVersion = BrowserEngineOptions_1.default.latestFullVersion(option);
        return new chrome_app_1.default(fullVersion);
    }
}
exports.default = BrowserEngine;
//# sourceMappingURL=BrowserEngine.js.map