"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const unblocked_browser_profiler_1 = require("@ulixee/unblocked-browser-profiler");
const EmulatorData_1 = require("../EmulatorData");
class ClienthelloJson {
    constructor(config, userAgentIds) {
        this.dataByOsId = {};
        for (const userAgentId of userAgentIds) {
            const profile = unblocked_browser_profiler_1.default.getProfile('tls-clienthello', userAgentId);
            const { browserId, operatingSystemId } = unblocked_browser_profiler_1.default.extractMetaFromUserAgentId(userAgentId);
            const { version, ciphers, compressionMethods, extensions } = profile.data.clientHello;
            this.browserId = browserId;
            this.dataByOsId[operatingSystemId] = { version, ciphers, compressionMethods, extensions };
        }
    }
    save(dataDir) {
        for (const [osId, data] of Object.entries(this.dataByOsId)) {
            const dataOsDir = EmulatorData_1.default.getEmulatorDataOsDir(dataDir, osId);
            if (!Fs.existsSync(dataOsDir))
                Fs.mkdirSync(dataOsDir, { recursive: true });
            const dataString = JSON.stringify(data, null, 2);
            Fs.writeFileSync(`${dataOsDir}/clienthello.json`, `${dataString}\n`);
        }
    }
}
exports.default = ClienthelloJson;
//# sourceMappingURL=Clienthello.js.map