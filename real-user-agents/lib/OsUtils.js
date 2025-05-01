"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOsName = createOsName;
exports.getOsNameFromId = getOsNameFromId;
exports.getOsVersionFromOsId = getOsVersionFromOsId;
exports.createOsId = createOsId;
exports.createOsIdFromUserAgentString = createOsIdFromUserAgentString;
exports.createOsVersion = createOsVersion;
exports.convertMacOsVersionString = convertMacOsVersionString;
const extractUserAgentMeta_1 = require("./extractUserAgentMeta");
const macOsNameToVersionMap = require('../data/os-mappings/macOsNameToVersionMap.json');
const macOsVersionAliasMap = require('../data/os-mappings/macOsVersionAliasMap.json');
const winOsNameToVersionMap = require('../data/os-mappings/winOsNameToVersionMap.json');
function createOsName(name) {
    if (name.startsWith('Win'))
        return 'Windows';
    if (name.includes('OS X'))
        return 'Mac OS';
    return name;
}
function getOsNameFromId(osId) {
    if (osId.startsWith('win'))
        return 'Windows';
    if (osId.startsWith('mac'))
        return 'Mac OS';
    return osId;
}
function getOsVersionFromOsId(osId) {
    const [major, minor] = osId.replace('windows-', '').replace('mac-os-', '').split('-');
    const rawVersion = [major, minor].filter(Boolean).join('.');
    if (osId.startsWith('win')) {
        for (const [name, version] of Object.entries(winOsNameToVersionMap)) {
            if (version === rawVersion)
                return { name, major, minor };
        }
    }
    else if (osId.startsWith('mac')) {
        for (const [name, version] of Object.entries(macOsNameToVersionMap)) {
            if (version === rawVersion)
                return { name, major, minor };
        }
    }
    return { major, minor };
}
function createOsId(os) {
    const name = os.name.toLowerCase().replace(/\s/g, '-').replace('os-x', 'os');
    const minorVersion = os.name.startsWith('Win') && os.version.minor === '0' ? null : os.version.minor;
    if (['other', 'linux'].includes(name)) {
        return name;
    }
    let id = `${name}-${os.version.major}`;
    if (minorVersion)
        id += `-${os.version.minor}`;
    return id;
}
function createOsIdFromUserAgentString(userAgentString) {
    const { osName, osVersion } = (0, extractUserAgentMeta_1.default)(userAgentString);
    const name = osName;
    const version = createOsVersion(name, osVersion.major, osVersion.minor);
    return createOsId({ name, version });
}
function createOsVersion(osName, majorVersionOrVersionString, minorVersion) {
    let namedVersion;
    let majorVersion = majorVersionOrVersionString;
    if (majorVersion.match(/^([a-z\s]+)/i)) {
        // majorVersion is name instead of number
        namedVersion = majorVersion;
        if (osName.startsWith('Mac')) {
            const versionString = macOsNameToVersionMap[majorVersion];
            if (versionString) {
                [majorVersion, minorVersion] = versionString.split('.');
            }
            else {
                const embeddedVersion = majorVersion.match(/(\d+[.\d+]?)/);
                if (embeddedVersion) {
                    const converted = convertMacOsVersionString(embeddedVersion[1]);
                    [majorVersion, minorVersion] = converted.split('.');
                    namedVersion = macOsVersionToNameMap[versionString];
                }
            }
        }
        else if (osName.startsWith('Win') && winOsNameToVersionMap[majorVersion]) {
            [majorVersion, minorVersion] = winOsNameToVersionMap[majorVersion].split('.');
        }
    }
    else {
        if (majorVersion.includes('.')) {
            [majorVersion, minorVersion] = majorVersion.split('.');
        }
        // majorVersion is number so let's cleanup
        let versionString = `${majorVersion}.${minorVersion}`;
        if (osName.startsWith('Mac')) {
            versionString = convertMacOsVersionString(versionString);
            [majorVersion, minorVersion] = versionString.split('.');
            namedVersion = macOsVersionToNameMap[versionString];
        }
        else if (osName.startsWith('Win')) {
            namedVersion = winOsVersionToNameMap[versionString];
        }
    }
    return {
        major: majorVersion,
        minor: minorVersion,
        name: namedVersion,
    };
}
function convertMacOsVersionString(versionString) {
    let newVersionString = macOsVersionAliasMap[versionString];
    if (!newVersionString) {
        const [majorVersion] = versionString.split('.');
        newVersionString = macOsVersionAliasMap[`${majorVersion}.*`];
    }
    return newVersionString || versionString;
}
const macOsVersionToNameMap = Object.entries(macOsNameToVersionMap).reduce((obj, [a, b]) => {
    return Object.assign(obj, { [b]: a });
}, {});
const winOsVersionToNameMap = Object.entries(winOsNameToVersionMap).reduce((obj, [a, b]) => {
    return Object.assign(obj, { [b]: a });
}, {});
//# sourceMappingURL=OsUtils.js.map