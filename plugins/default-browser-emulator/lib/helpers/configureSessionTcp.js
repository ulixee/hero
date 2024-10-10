"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = configureSessionTcp;
const getTcpSettingsForOs_1 = require("../utils/getTcpSettingsForOs");
function configureSessionTcp(emulationProfile, settings) {
    const { operatingSystemName, operatingSystemVersion } = emulationProfile.userAgentOption;
    const tcpSettings = (0, getTcpSettingsForOs_1.default)(operatingSystemName, operatingSystemVersion);
    if (tcpSettings) {
        settings.tcpTtl = tcpSettings.ttl;
        settings.tcpWindowSize = tcpSettings.windowSize;
    }
}
//# sourceMappingURL=configureSessionTcp.js.map