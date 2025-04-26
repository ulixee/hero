"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const unblocked_browser_profiler_1 = require("@ulixee/unblocked-browser-profiler");
const EmulatorData_1 = require("../EmulatorData");
class Http2SessionJson {
    constructor(config, userAgentIds) {
        this.dataByOsId = {};
        for (const userAgentId of userAgentIds) {
            const { browserId, operatingSystemId } = unblocked_browser_profiler_1.default.extractMetaFromUserAgentId(userAgentId);
            const profile = unblocked_browser_profiler_1.default.getProfile('http2-session', userAgentId);
            this.browserId = browserId;
            let settings;
            let ping;
            let initialWindowSize;
            let firstFrameWindowSize;
            for (const session of profile.data.sessions) {
                for (const activity of session.activity) {
                    if (activity.type === 'ping')
                        ping = activity.data;
                    if (activity.type === 'remoteSettings')
                        settings = activity.data.settings;
                    if (activity.data?.remoteWindowSize && !initialWindowSize) {
                        initialWindowSize = activity.data.remoteWindowSize;
                    }
                    if (!firstFrameWindowSize && activity.type === 'stream') {
                        firstFrameWindowSize = activity.data.remoteWindowSize;
                    }
                }
            }
            this.dataByOsId[operatingSystemId] = {
                settings,
                ping,
                initialWindowSize,
                firstFrameWindowSize,
            };
        }
    }
    save(dataDir) {
        for (const [osId, data] of Object.entries(this.dataByOsId)) {
            const dataOsDir = EmulatorData_1.default.getEmulatorDataOsDir(dataDir, osId);
            if (!Fs.existsSync(dataOsDir))
                Fs.mkdirSync(dataOsDir, { recursive: true });
            const dataString = JSON.stringify(data, null, 2);
            Fs.writeFileSync(`${dataOsDir}/http2-session.json`, `${dataString}`);
        }
    }
}
exports.default = Http2SessionJson;
//# sourceMappingURL=Http2Session.js.map