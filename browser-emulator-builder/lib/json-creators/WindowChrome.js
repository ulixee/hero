"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const unblocked_browser_profiler_1 = require("@ulixee/unblocked-browser-profiler");
const Path = require("path");
const zlib_1 = require("zlib");
const EmulatorData_1 = require("../EmulatorData");
const localProfilesDir = Path.join(unblocked_browser_profiler_1.default.dataDir, 'profiled-doms/local');
class WindowChromeJson {
    constructor(config, userAgentIds) {
        this.dataByOsId = {};
        this.browserId = config.browserId;
        let localHeadedChromeProperty = null;
        for (const userAgentId of userAgentIds) {
            const profile = unblocked_browser_profiler_1.default.getProfile('browser-dom-environment', userAgentId);
            const { operatingSystemId } = unblocked_browser_profiler_1.default.extractMetaFromUserAgentId(userAgentId);
            if (!localHeadedChromeProperty) {
                const headedLocalDom = Fs.readdirSync(localProfilesDir).find(x => x.endsWith(`${config.browserId}--headed-devtools`));
                if (headedLocalDom) {
                    const localDomPath = `${localProfilesDir}/${headedLocalDom}/browser-dom-environment--https--1.json.gz`;
                    const { data } = JSON.parse((0, zlib_1.gunzipSync)(Fs.readFileSync(localDomPath)).toString());
                    localHeadedChromeProperty = data.window.chrome;
                }
            }
            const window = profile.data.https.window;
            if (window.chrome) {
                const keys = Object.keys(window);
                const index = keys.indexOf('chrome');
                const prevProperty = keys[index - 1];
                if (localHeadedChromeProperty) {
                    window.chrome.runtime = localHeadedChromeProperty.runtime;
                }
                this.dataByOsId[operatingSystemId] = {
                    chrome: window.chrome,
                    prevProperty,
                };
            }
        }
    }
    save(dataDir) {
        for (const [osId, data] of Object.entries(this.dataByOsId)) {
            const dataOsDir = EmulatorData_1.default.getEmulatorDataOsDir(dataDir, osId);
            if (!Fs.existsSync(dataOsDir))
                Fs.mkdirSync(dataOsDir, { recursive: true });
            const dataString = JSON.stringify(data, null, 2);
            Fs.writeFileSync(`${dataOsDir}/window-chrome.json`, `${dataString}\n`);
        }
    }
}
exports.default = WindowChromeJson;
//# sourceMappingURL=WindowChrome.js.map