"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = importBrowserProfiles;
const fs_1 = require("fs");
const Path = require("path");
const config_1 = require("@double-agent/config");
const real_user_agents_1 = require("@ulixee/real-user-agents");
async function importBrowserProfiles(profilesDir, userAgentConfig) {
    const sourceProfilesDir = Path.join(config_1.default.profilesDataDir, 'profiles');
    for (const userAgentId of await fs_1.promises.readdir(sourceProfilesDir)) {
        if (!userAgentConfig.browserIds.some((x) => userAgentId.includes(x))) {
            continue;
        }
        const userAgent = real_user_agents_1.default.getId(userAgentId);
        if (!userAgent) {
            throw new Error(`${userAgentId} not supported by RealUserAgents`);
        }
        const fromDir = `${sourceProfilesDir}/${userAgentId}`;
        const toDir = `${profilesDir}/${userAgentId}`;
        await copyDir(fromDir, toDir);
    }
}
async function copyDir(fromDir, toDir) {
    await fs_1.promises.mkdir(toDir, { recursive: true });
    for (const fileNameToCopy of await fs_1.promises.readdir(fromDir)) {
        await fs_1.promises.copyFile(`${fromDir}/${fileNameToCopy}`, `${toDir}/${fileNameToCopy}`);
    }
}
//# sourceMappingURL=importFoundationalProfiles.js.map