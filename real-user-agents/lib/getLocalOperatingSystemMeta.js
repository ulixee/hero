"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getLocalOperatingSystemMeta;
const Os = require("os");
const OsUtils_1 = require("./OsUtils");
const VersionUtils_1 = require("./VersionUtils");
const darwinToMacOsVersionMap = require("../data/os-mappings/darwinToMacOsVersionMap.json");
const windowsToWindowsVersionMap = require("../data/os-mappings/windowsToWindowsVersionMap.json");
function getLocalOperatingSystemMeta(platform = Os.platform(), release = Os.release()) {
    const name = extractOsName(platform);
    const version = extractOsVersion(platform, release);
    return { name, version };
}
function extractOsName(platform) {
    return platformToOsName[platform.toLowerCase()];
}
function extractOsVersion(platform, release) {
    let versionStr = '';
    if (platform === 'darwin') {
        versionStr = extractMacOsVersion(release);
    }
    else if (platform === 'win32') {
        versionStr = extractWindowsVersion(release);
    } // else if linux then no version
    return versionStr.split('.').slice(0, 2).join('-');
}
function extractWindowsVersion(release) {
    // there is no guarantee we have an exact match, so let's get the closest
    const [major, minor] = release.split('.');
    const majors = Object.keys(windowsVersionTree).map(x => Number(x));
    const majorMatch = (0, VersionUtils_1.getClosestNumberMatch)(Number(major), majors);
    let versionMatch = `${majorMatch}`;
    const minors = Object.keys(windowsVersionTree[majorMatch]).map(x => Number(x));
    const minorMatch = (0, VersionUtils_1.getClosestNumberMatch)(Number(minor), minors);
    versionMatch += `.${minorMatch}`;
    return windowsToWindowsVersionMap[versionMatch];
}
function extractMacOsVersion(release) {
    // there is no guarantee we have an exact match, so let's get the closest
    const [major, minor, build] = release.split('.');
    const majors = Object.keys(darwinVersionTree).map(x => Number(x));
    const majorMatch = (0, VersionUtils_1.getClosestNumberMatch)(Number(major), majors);
    let versionMatch = `${majorMatch}`;
    const minors = Object.keys(darwinVersionTree[majorMatch]).map(x => Number(x));
    const minorMatch = (0, VersionUtils_1.getClosestNumberMatch)(Number(minor), minors);
    versionMatch += `.${minorMatch}`;
    if (build) {
        const builds = darwinVersionTree[majorMatch][minorMatch];
        const buildMatch = (0, VersionUtils_1.getClosestNumberMatch)(Number(build), builds);
        versionMatch += `.${buildMatch}`;
    }
    const versionString = darwinToMacOsVersionMap[versionMatch];
    return (0, OsUtils_1.convertMacOsVersionString)(versionString);
}
const platformToOsName = {
    darwin: 'mac-os',
    win32: 'windows',
    linux: 'linux',
    aix: 'linux',
    freebsd: 'linux',
    openbsd: 'linux',
    sunos: 'linux',
};
const darwinVersionTree = (0, VersionUtils_1.convertVersionsToTree)(Object.keys(darwinToMacOsVersionMap));
const windowsVersionTree = (0, VersionUtils_1.convertVersionsToTree)(Object.keys(windowsToWindowsVersionMap));
//# sourceMappingURL=getLocalOperatingSystemMeta.js.map