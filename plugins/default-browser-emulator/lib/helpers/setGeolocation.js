"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = setActiveAndFocused;
const utils_1 = require("@ulixee/commons/lib/utils");
function setActiveAndFocused(emulationProfile, pageOrFrame) {
    const location = emulationProfile.geolocation;
    if (!location)
        return;
    (0, utils_1.assert)(Math.abs(location.latitude) <= 90, 'Latitude must be in a range from -90 to 90');
    (0, utils_1.assert)(Math.abs(location.longitude) <= 180, 'Longitude must be in a range from -180 to 180');
    if (!location.accuracy)
        location.accuracy = 50 - Math.floor(Math.random() * 10);
    (0, utils_1.assert)(location.accuracy >= 0, 'Accuracy must be a number greater than or equal to 0');
    const browserContext = 'browserContext' in pageOrFrame ? pageOrFrame.browserContext : pageOrFrame.page.browserContext;
    return Promise.all([
        pageOrFrame.devtoolsSession.send('Emulation.setGeolocationOverride', {
            ...location,
        }),
        browserContext.browser.devtoolsSession.send('Browser.grantPermissions', {
            permissions: ['geolocation'],
            browserContextId: browserContext.id,
        }),
    ]);
}
//# sourceMappingURL=setGeolocation.js.map