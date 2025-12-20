"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = configureDeviceProfile;
const utils_1 = require("@ulixee/commons/lib/utils");
const crypto_1 = require("crypto");
function configureDeviceProfile(deviceProfile) {
    deviceProfile.deviceMemory ??= (0, utils_1.pickRandom)([2, 4, 8]);
    deviceProfile.rtt ??= (0, utils_1.pickRandom)([25, 50, 100]);
    deviceProfile.hardwareConcurrency ??= (0, utils_1.pickRandom)([4, 8, 10, 12, 16, 24]);
    deviceProfile.videoDevice ??= {
        deviceId: (0, crypto_1.randomBytes)(32).toString('hex'),
        groupId: (0, crypto_1.randomBytes)(32).toString('hex'),
    };
    // values observed in real chrome instances
    deviceProfile.maxHeapSize = 4294705152;
    if (deviceProfile.deviceMemory === 4) {
        deviceProfile.maxHeapSize = 2172649472;
    }
    else if (deviceProfile.deviceMemory === 2) {
        deviceProfile.maxHeapSize = 1620000000;
    }
    deviceProfile.deviceStorageTib ??= (0, utils_1.pickRandom)([0.5, 1, 2, 4, 8, 16]);
    deviceProfile.webGlParameters ??= {
        // UNMASKED_VENDOR_WEBGL
        37445: 'Intel Inc.',
        // UNMASKED_RENDERER_WEBGL
        37446: 'Intel Iris OpenGL Engine',
    };
}
//# sourceMappingURL=configureDeviceProfile.js.map