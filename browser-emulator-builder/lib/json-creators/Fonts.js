"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const unblocked_browser_profiler_1 = require("@ulixee/unblocked-browser-profiler");
const EmulatorData_1 = require("../EmulatorData");
class FontsJson {
    constructor(config, userAgentIds) {
        this.dataByOsId = {};
        for (const userAgentId of userAgentIds) {
            const { browserId, operatingSystemId } = unblocked_browser_profiler_1.default.extractMetaFromUserAgentId(userAgentId);
            const profile = unblocked_browser_profiler_1.default.getProfile('browser-fonts', userAgentId);
            this.browserId = browserId;
            this.dataByOsId[operatingSystemId] = profile.data.fonts;
        }
    }
    save(dataDir) {
        for (const [osId, fonts] of Object.entries(this.dataByOsId)) {
            const dataOsDir = EmulatorData_1.default.getEmulatorDataOsDir(dataDir, osId);
            if (!Fs.existsSync(dataOsDir))
                Fs.mkdirSync(dataOsDir, { recursive: true });
            const dataString = JSON.stringify({ fonts }, null, 2);
            Fs.writeFileSync(`${dataOsDir}/browser-fonts.json`, `${dataString}`);
        }
    }
}
exports.default = FontsJson;
//# sourceMappingURL=Fonts.js.map