"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = setTimezone;
async function setTimezone(emulationProfile, devtools) {
    const { timezoneId } = emulationProfile;
    if (!timezoneId)
        return;
    try {
        await devtools.send('Emulation.setTimezoneOverride', { timezoneId });
    }
    catch (error) {
        if (error.message.includes('Timezone override is already in effect'))
            return;
        if (error.message.includes('Invalid timezone'))
            throw new Error(`Invalid timezone ID: ${timezoneId}`);
        throw error;
    }
}
//# sourceMappingURL=setTimezone.js.map