"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chrome_app_1 = require("@ulixee/chrome-app");
class BrowserEngineOptions {
    constructor(dataLoader, defaultBrowserId) {
        this.dataLoader = dataLoader;
        this.installedOptions = [];
        this.browserIdsNeedingDataFiles = new Set();
        this.checkForInstalled();
        this.default = this.installedOptions[0];
        if (defaultBrowserId) {
            const id = defaultBrowserId.replace('@ulixee/', '');
            this.default = this.installedOptions.find(x => x.id === id);
            if (!this.default) {
                if (this.browserIdsNeedingDataFiles.has(id) || this.getInstalled(id)) {
                    throw new Error(`The Default Browser Engine specified in your environment does not have Emulation Data Files installed.:\n\n
            
----------- update to the latest data files using ----------
        
         npx @ulixee/default-browser-emulator update-unblocked-emulators
        
------------------------------------------------------------`);
                }
                throw new Error(`The Default Browser Engine specified in your environment is not installed\n\n
-------- reinstall the browser in your working directory -------
        
                npm install @ulixee/${defaultBrowserId}
        
----------------------------------------------------------------
      `);
            }
        }
    }
    getInstalled(browserId) {
        try {
            // eslint-disable-next-line import/no-dynamic-require
            const ChromeVersion = require(`@ulixee/${browserId}`);
            return new ChromeVersion();
        }
        catch (e) {
            return null;
        }
    }
    checkForInstalled() {
        for (const engine of this.dataLoader.browserEngineOptions) {
            const ChromeVersion = this.getInstalled(engine.id);
            if (!ChromeVersion)
                continue;
            if (!this.dataLoader.isInstalledBrowser(`as-${engine.id}`)) {
                this.browserIdsNeedingDataFiles.add(engine.id);
                console.warn(`[@ulixee/hero] You have a Chrome Browser Engine installed without accompanying data files needed to emulate Operating Systems & Headed operation. 
          
You must install data files for "${engine.id}" to support emulating the browser.`);
                continue;
            }
            const [major, minor, patch, build] = ChromeVersion.fullVersion.split('.');
            this.installedOptions.push({
                ...engine,
                version: {
                    minor,
                    major,
                    patch,
                    build,
                },
            });
        }
        this.installedOptions.sort((a, b) => {
            return Number(b.version.major) - Number(a.version.major);
        });
    }
    static latestFullVersion(option) {
        let platform = chrome_app_1.default.getOsPlatformName();
        if (platform.startsWith('mac'))
            platform = 'mac';
        if (platform.startsWith('win'))
            platform = 'win';
        const latest = option.stablePatchesByOs[platform];
        return `${option.majorVersion}.0.${option.buildVersion}.${latest[0]}`;
    }
}
exports.default = BrowserEngineOptions;
//# sourceMappingURL=BrowserEngineOptions.js.map