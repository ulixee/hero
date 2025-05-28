"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const unblocked_browser_profiler_1 = require("@ulixee/unblocked-browser-profiler");
const EmulatorData_1 = require("../EmulatorData");
class UserAgentHintsJson {
    constructor(config, userAgentIds) {
        this.dataByOsId = {};
        for (const userAgentId of userAgentIds) {
            const { browserId, operatingSystemId } = unblocked_browser_profiler_1.default.extractMetaFromUserAgentId(userAgentId);
            const profile = unblocked_browser_profiler_1.default.getProfile('http-ua-hints', userAgentId);
            if (!profile)
                continue;
            this.browserId = browserId;
            this.dataByOsId[operatingSystemId] = profile.data;
        }
    }
    save(dataDir) {
        for (const [osId, data] of Object.entries(this.dataByOsId)) {
            const dataOsDir = EmulatorData_1.default.getEmulatorDataOsDir(dataDir, osId);
            if (!Fs.existsSync(dataOsDir))
                Fs.mkdirSync(dataOsDir, { recursive: true });
            const tested = new Set(data.testedHeaders);
            const documentHeaders = {};
            for (const doc of data.headers) {
                for (const [header, value] of doc.rawHeaders) {
                    if (tested.has(header.toLowerCase())) {
                        documentHeaders[header] = value;
                    }
                }
            }
            const dataString = JSON.stringify({ jsHighEntropyHints: data.jsHighEntropyHints, documentHeaders }, null, 2);
            Fs.writeFileSync(`${dataOsDir}/user-agent-hints.json`, `${dataString}`);
        }
    }
}
exports.default = UserAgentHintsJson;
//# sourceMappingURL=UserAgentHints.js.map