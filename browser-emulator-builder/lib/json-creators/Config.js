"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
class ConfigJson {
    constructor(browserId, browserEngineId, browserEngineOption) {
        this.browserId = browserId;
        this.browserEngineId = browserEngineId;
        this.browserEngineOption = browserEngineOption;
        this.data = {
            defaultLocale: 'en-US,en',
            features: [],
        };
    }
    save(baseDir) {
        if (!Fs.existsSync(baseDir))
            Fs.mkdirSync(baseDir, { recursive: true });
        const dataString = JSON.stringify(this.data, null, 2);
        Fs.writeFileSync(`${baseDir}/config.json`, `${dataString}`);
    }
}
exports.default = ConfigJson;
//# sourceMappingURL=Config.js.map