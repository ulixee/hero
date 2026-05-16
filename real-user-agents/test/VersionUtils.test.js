"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const VersionUtils_1 = require("../lib/VersionUtils");
const getLocalOperatingSystemMeta_1 = require("../lib/getLocalOperatingSystemMeta");
test('it should findClosestVersionMatch even if minor is not matched', async () => {
    const versionMatch1 = (0, VersionUtils_1.findClosestVersionMatch)('10-16', ['11']);
    const versionMatch2 = (0, VersionUtils_1.findClosestVersionMatch)('11-2', ['11']);
    const versionMatch3 = (0, VersionUtils_1.findClosestVersionMatch)('11-3', ['11']);
    const versionMatch4 = (0, VersionUtils_1.findClosestVersionMatch)('11-4', ['11']);
    expect(versionMatch1).toBe('11');
    expect(versionMatch2).toBe('11');
    expect(versionMatch3).toBe('11');
    expect(versionMatch4).toBe('11');
}, 60e3);
test('it should work with monteray', async () => {
    const OsMeta = (0, getLocalOperatingSystemMeta_1.default)('darwin', '500.0.0');
    expect(OsMeta.version.split('-').map(Number)[0]).toBeGreaterThanOrEqual(11);
});
//# sourceMappingURL=VersionUtils.test.js.map