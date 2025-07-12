"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dirUtils_1 = require("@ulixee/chrome-app/lib/dirUtils");
const env_1 = require("../env");
class ChromeEngine {
    constructor(source) {
        this.source = source;
        this.name = 'chrome';
        this.launchArguments = [];
        this.doesBrowserAnimateScrolling = false;
        this.doesBrowserAnimateScrolling = false;
        this.isInstalled = source.isInstalled;
        this.fullVersion = source.fullVersion;
        this.executablePath = source.executablePath;
        this.executablePathEnvVar = source.executablePathEnvVar;
        if (source.launchArgs)
            this.launchArguments = [...source.launchArgs];
    }
    async verifyLaunchable() {
        if (!(await (0, dirUtils_1.existsAsync)(this.executablePath))) {
            let remedyMessage = `No executable exists at "${this.executablePath}"`;
            const isCustomInstall = this.executablePathEnvVar && process.env[this.executablePathEnvVar];
            if (!isCustomInstall) {
                remedyMessage = `Please re-install the browser engine:
-------------------------------------------------
-------------- NPM INSTALL ----------------------
-------------------------------------------------

 npm install @ulixee/${this.fullVersion.split('.').slice(0, 2).join('-')}

-------------------------------------------------
`;
            }
            throw new Error(`Failed to launch ${this.name} ${this.fullVersion}:

${remedyMessage}`);
        }
        // exists, validate that host requirements exist
        await this.source.validateHostRequirements();
    }
    static fromPackageName(npmPackage) {
        // eslint-disable-next-line import/no-dynamic-require
        const Chrome = require(npmPackage);
        const engine = new Chrome();
        return new ChromeEngine(engine);
    }
    static default() {
        // eslint-disable-next-line import/no-dynamic-require
        const Chrome = require(this.defaultPackageName);
        const engine = new Chrome();
        return new ChromeEngine(engine);
    }
}
ChromeEngine.defaultPackageName = `@ulixee/${env_1.default.defaultChromeId}`;
exports.default = ChromeEngine;
//# sourceMappingURL=ChromeEngine.js.map