"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = configureSessionTls;
function configureSessionTls(emulationProfile, settings) {
    const { browserName, browserVersion, string } = emulationProfile.userAgentOption;
    settings.tlsClientHelloId = `${browserName}-${browserVersion.major}`;
    settings.proxyUseragent = string;
}
//# sourceMappingURL=configureSessionTls.js.map