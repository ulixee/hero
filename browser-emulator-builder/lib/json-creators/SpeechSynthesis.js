"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const unblocked_browser_profiler_1 = require("@ulixee/unblocked-browser-profiler");
const EmulatorData_1 = require("../EmulatorData");
class SpeechSynthesisJson {
    constructor(config, userAgentIds) {
        this.dataByOsId = {};
        this.osDefaults = {};
        for (const userAgentId of userAgentIds) {
            const { browserId, operatingSystemId, operatingSystemName } = unblocked_browser_profiler_1.default.extractMetaFromUserAgentId(userAgentId);
            const profile = unblocked_browser_profiler_1.default.getProfile('browser-speech', userAgentId);
            this.browserId = browserId;
            const voices = profile.data.https.voices;
            if (voices?.length) {
                this.osDefaults[operatingSystemName] ??= voices;
            }
            this.dataByOsId[operatingSystemId] = profile.data.https.voices;
        }
    }
    save(dataDir) {
        for (const [osId, data] of Object.entries(this.dataByOsId)) {
            const dataOsDir = EmulatorData_1.default.getEmulatorDataOsDir(dataDir, osId);
            if (!Fs.existsSync(dataOsDir))
                Fs.mkdirSync(dataOsDir, { recursive: true });
            const voices = data?.length > 0
                ? data
                : this.osDefaults[osId.startsWith('mac') ? 'mac-os' : 'windows'] ?? [];
            const dataString = JSON.stringify({ voices }, null, 2);
            Fs.writeFileSync(`${dataOsDir}/browser-speech.json`, `${dataString}`);
        }
    }
}
exports.default = SpeechSynthesisJson;
//# sourceMappingURL=SpeechSynthesis.js.map