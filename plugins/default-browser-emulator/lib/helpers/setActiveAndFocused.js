"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = setActiveAndFocused;
async function setActiveAndFocused(emulationProfile, devtools) {
    await devtools.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(err => err);
}
//# sourceMappingURL=setActiveAndFocused.js.map