"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractProfilePathsMap = extractProfilePathsMap;
exports.importProfile = importProfile;
const Fs = require("fs");
const Path = require("path");
function extractProfilePathsMap(profileDir, userAgentId, profilePathsMap = {}) {
    for (const fileName of Fs.readdirSync(profileDir)) {
        if (!fileName.endsWith('.json') || fileName.startsWith('_'))
            continue;
        const [pluginId, filenameSuffix] = fileName.replace('.json', '').split('--');
        const profilePath = Path.join(profileDir, fileName);
        profilePathsMap[pluginId] = profilePathsMap[pluginId] || {};
        if (filenameSuffix) {
            profilePathsMap[pluginId][userAgentId] ??= {};
            profilePathsMap[pluginId][userAgentId][filenameSuffix] = profilePath;
        }
        else {
            profilePathsMap[pluginId][userAgentId] = profilePath;
        }
    }
    return profilePathsMap;
}
function importProfile(profilePath) {
    if (typeof profilePath === 'string') {
        const rawData = Fs.readFileSync(profilePath, 'utf8');
        try {
            return JSON.parse(rawData);
        }
        catch (error) {
            console.log(profilePath);
            throw error;
        }
    }
    else {
        const dataByFilenameSuffix = {};
        let profile;
        for (const filenameSuffix of Object.keys(profilePath)) {
            const rawData = Fs.readFileSync(profilePath[filenameSuffix], 'utf8');
            try {
                profile = JSON.parse(rawData);
            }
            catch (error) {
                console.log(profilePath[filenameSuffix]);
                throw error;
            }
            dataByFilenameSuffix[filenameSuffix] = profile.data;
        }
        profile.data = dataByFilenameSuffix;
        return profile;
    }
}
//# sourceMappingURL=ProfileUtils.js.map