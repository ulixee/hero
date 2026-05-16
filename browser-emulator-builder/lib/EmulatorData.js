"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const paths_1 = require("../paths");
class EmulatorData {
    static get emulatorsDirPath() {
        return paths_1.emulatorDataDir;
    }
    static getEmulatorDir(browserId) {
        const emulatorId = this.extractBrowserEngineId(browserId);
        return `${this.emulatorsDirPath}/as-${emulatorId}`;
    }
    static getEmulatorDataOsDir(baseDataDir, operatingSystemId) {
        return `${baseDataDir}/as-${operatingSystemId}`;
    }
    static extractBrowserEngineId(browserId) {
        return browserId.replace('chromium', 'chrome');
    }
}
exports.default = EmulatorData;
//# sourceMappingURL=EmulatorData.js.map