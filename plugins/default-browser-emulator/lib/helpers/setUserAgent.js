"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = setUserAgent;
async function setUserAgent(emulationProfile, devtools, userAgentData) {
    const userAgentMetadata = userAgentData
        ? {
            brands: userAgentData.brands,
            fullVersion: userAgentData.uaFullVersion,
            fullVersionList: userAgentData.fullVersionList,
            platform: userAgentData.platform,
            platformVersion: userAgentData.platformVersion,
            architecture: 'x86',
            model: '',
            mobile: false,
        }
        : undefined;
    await devtools.send('Emulation.setUserAgentOverride', {
        userAgent: emulationProfile.userAgentOption.string,
        acceptLanguage: emulationProfile.locale,
        platform: emulationProfile.windowNavigatorPlatform,
        userAgentMetadata,
    });
}
//# sourceMappingURL=setUserAgent.js.map