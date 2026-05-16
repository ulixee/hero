"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const unblocked_browser_profiler_1 = require("@ulixee/unblocked-browser-profiler");
const EmulatorData_1 = require("../EmulatorData");
class WindowNavigatorJson {
    constructor(config, userAgentIds) {
        this.dataByOsId = {};
        this.browserId = config.browserId;
        for (const userAgentId of userAgentIds) {
            const profile = unblocked_browser_profiler_1.default.getProfile('browser-dom-environment', userAgentId);
            const { operatingSystemId } = unblocked_browser_profiler_1.default.extractMetaFromUserAgentId(userAgentId);
            const window = profile.data.https.window;
            if (window.navigator) {
                this.dataByOsId[operatingSystemId] = { navigator: window.navigator };
            }
        }
    }
    save(dataDir) {
        for (const [osId, data] of Object.entries(this.dataByOsId)) {
            const dataOsDir = EmulatorData_1.default.getEmulatorDataOsDir(dataDir, osId);
            if (!Fs.existsSync(dataOsDir))
                Fs.mkdirSync(dataOsDir, { recursive: true });
            const dataString = JSON.stringify(data, null, 2);
            Fs.writeFileSync(`${dataOsDir}/window-navigator.json`, `${dataString}\n`);
        }
    }
}
exports.default = WindowNavigatorJson;
//# sourceMappingURL=WindowNavigator.js.map