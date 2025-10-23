"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = findUaClientHintsPlatformVersion;
const fs_1 = require("fs");
const Path = require("path");
const paths_1 = require("./paths");
let data;
function findUaClientHintsPlatformVersion(osId) {
    if (!data) {
        data = {
            windowsUniversalApiMap: JSON.parse((0, fs_1.readFileSync)(Path.join(paths_1.dataDir, 'manual/windowsUniversalApiMap.json'), 'utf8')),
            osReleaseDates: JSON.parse((0, fs_1.readFileSync)(Path.join(paths_1.dataDir, 'manual/osReleaseDates.json'), 'utf8')),
        };
    }
    const uaClientHintsPlatformVersions = [];
    if (osId.startsWith('windows')) {
        let version = osId.replace('windows-', '');
        if (!version.includes('-'))
            version += '-0';
        for (const [release, platform] of Object.entries(data.windowsUniversalApiMap)) {
            if (!release.startsWith(version))
                continue;
            uaClientHintsPlatformVersions.push(platform);
        }
    }
    else if (osId.startsWith('mac')) {
        for (const release of Object.keys(data.osReleaseDates)) {
            if (!release.startsWith(`${osId}-`))
                continue;
            const releaseVersion = release.replace(`mac-os-`, '');
            const parts = releaseVersion.split('-');
            uaClientHintsPlatformVersions.push(`${parts[0]}.${parts[1] ?? 0}.${parts[2] ?? 0}`);
        }
    }
    return uaClientHintsPlatformVersions;
}
//# sourceMappingURL=findUaClientHintsPlatformVersion.js.map