"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = setLocale;
async function setLocale(emulationProfile, devtools) {
    const { locale } = emulationProfile;
    if (!locale)
        return;
    try {
        await devtools.send('Emulation.setLocaleOverride', { locale });
    }
    catch (error) {
        // not installed in Chrome 80
        if (error.message.includes("'Emulation.setLocaleOverride' wasn't found"))
            return;
        // All pages in the same renderer share locale. All such pages belong to the same
        // context and if locale is overridden for one of them its value is the same as
        // we are trying to set so it's not a problem.
        if (error.message.includes('Another locale override is already in effect'))
            return;
        throw error;
    }
}
//# sourceMappingURL=setLocale.js.map