"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const Path = require("path");
const real_user_agents_1 = require("@ulixee/real-user-agents");
const zlib_1 = require("zlib");
const paths_1 = require("./paths");
class BrowserProfiler {
    static get dataDir() {
        return Path.resolve(paths_1.profileDataDir);
    }
    static get profilesDir() {
        return Path.join(this.dataDir, 'profiles');
    }
    static get profiledDoms() {
        return Path.join(this.dataDir, 'profiled-doms');
    }
    static get userAgentIds() {
        return Fs.readdirSync(this.profilesDir).filter(x => !x.startsWith('.') && isDirectory(this.userAgentDir(x)));
    }
    static userAgentDir(userAgentId) {
        return Path.join(this.profilesDir, userAgentId);
    }
    static init() {
        const baseProfilesDir = this.profilesDir;
        if (!Fs.existsSync(baseProfilesDir))
            Fs.mkdirSync(baseProfilesDir, { recursive: true });
    }
    static loadDataFile(relativePath) {
        const absolutePath = Path.resolve(this.dataDir, relativePath);
        return JSON.parse(Fs.readFileSync(absolutePath, 'utf8'));
    }
    static extractMetaFromUserAgentId(userAgentId) {
        return real_user_agents_1.default.extractMetaFromUserAgentId(userAgentId);
    }
    static getProfile(pluginId, userAgentId) {
        const profileDir = `${this.profilesDir}/${userAgentId}`;
        const defaultProfilePath = `${profileDir}/${pluginId}.json`;
        if (Fs.existsSync(defaultProfilePath) || Fs.existsSync(`${defaultProfilePath}.gz`)) {
            const profile = importProfile(defaultProfilePath);
            return profile;
        }
        const profilePaths = {};
        for (const fileName of Fs.readdirSync(profileDir)) {
            if ((!fileName.endsWith('.json') && !fileName.endsWith('.json.gz')) ||
                fileName.startsWith('_'))
                continue;
            const profilePath = Path.join(profileDir, fileName);
            const [foundPluginId, filenameSuffix] = fileName
                .replace('.json', '')
                .replace('.gz', '')
                .split('--');
            if (foundPluginId === pluginId && filenameSuffix) {
                profilePaths[filenameSuffix] = profilePath;
            }
        }
        if (Object.keys(profilePaths).length) {
            const profile = importProfile(profilePaths);
            return profile;
        }
    }
    static getProfiles(pluginId) {
        const profiles = [];
        this.userAgentIds.forEach(userAgentId => {
            const profile = this.getProfile(pluginId, userAgentId);
            if (profile)
                profiles.push(profile);
        });
        return profiles;
    }
    static cleanPluginProfiles(pluginIds) {
        for (const userAgentId of this.userAgentIds) {
            const profileDir = this.userAgentDir(userAgentId);
            if (!Fs.existsSync(profileDir))
                return;
            for (const fileName of Fs.readdirSync(profileDir)) {
                if (!pluginIds.some(x => fileName.startsWith(x)))
                    continue;
                Fs.unlinkSync(Path.join(profileDir, fileName));
            }
        }
    }
    static findMissingPlugins(userAgentId, plugins) {
        const userAgentDir = this.userAgentDir(userAgentId);
        // no plugins, needs to run
        if (!Fs.existsSync(userAgentDir))
            return plugins.map(x => x.id);
        const profileFiles = Fs.readdirSync(userAgentDir);
        const needsRerun = [];
        for (const plugin of plugins) {
            const files = profileFiles.filter(x => x.startsWith(plugin.id));
            if (files.length < plugin.outputFiles) {
                needsRerun.push(plugin.id);
            }
        }
        return needsRerun;
    }
    static isMissingPlugins(userAgentId, plugins, rerunPluginIds) {
        const userAgentDir = this.userAgentDir(userAgentId);
        // no plugins, needs to run
        if (!Fs.existsSync(userAgentDir))
            return true;
        const profileFiles = Fs.readdirSync(userAgentDir);
        // if we're re-reunning a specific set, only check that those all exist
        if (rerunPluginIds.length) {
            for (const pluginId of rerunPluginIds) {
                const doesPluginAlreadyExist = profileFiles.some(x => x.startsWith(pluginId));
                if (doesPluginAlreadyExist === false) {
                    console.log(`FOUND PROFILE ${userAgentId}... rerunning plugins: ${rerunPluginIds.join(', ')}`);
                    return true;
                }
            }
            return false;
        }
        const expectedFileCount = plugins.reduce((total, x) => x.outputFiles + total, 0);
        if (profileFiles.length >= expectedFileCount) {
            console.log(`FOUND ${userAgentId}... skipping`);
            return false;
        }
        console.log(`FOUND CORRUPTED ${userAgentId}... RERUNNING`, {
            filesCount: profileFiles.length,
            expectedFileCount,
        });
        return true;
    }
}
exports.default = BrowserProfiler;
// HELPERS
function importProfile(profilePath) {
    if (typeof profilePath === 'string') {
        let rawData = Fs.readFileSync(profilePath);
        try {
            if (profilePath.endsWith('.gz')) {
                rawData = (0, zlib_1.gunzipSync)(rawData);
            }
            if (!rawData.length)
                return null;
            return JSON.parse(rawData.toString());
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
            profile = importProfile(profilePath[filenameSuffix]);
            dataByFilenameSuffix[filenameSuffix] = profile.data;
        }
        profile.data = dataByFilenameSuffix;
        return profile;
    }
}
function isDirectory(path) {
    return Fs.lstatSync(path).isDirectory();
}
//# sourceMappingURL=index.js.map