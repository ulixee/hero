"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeUserAgentsToTest = writeUserAgentsToTest;
exports.collectUserAgentsToTest = collectUserAgentsToTest;
const Fs = require("fs");
const Path = require("path");
const real_user_agents_1 = require("@ulixee/real-user-agents");
const IUserAgentToTest_1 = require("@double-agent/config/interfaces/IUserAgentToTest");
const index_1 = require("@double-agent/config/index");
const UserAgent_1 = require("@ulixee/real-user-agents/lib/UserAgent");
const FsPromises = Fs.promises;
async function writeUserAgentsToTest(userAgentConfig, outFilePath) {
    const userAgentsToTest = await collectUserAgentsToTest(userAgentConfig);
    const outDir = Path.dirname(outFilePath);
    await FsPromises.mkdir(outDir, { recursive: true });
    await FsPromises.writeFile(`${outFilePath}.json`, JSON.stringify(userAgentsToTest, null, 2));
}
async function collectUserAgentsToTest(userAgentConfig) {
    const userAgentsToTest = [];
    // use TcpProbes to determine user agents
    const probeTcpFilePath = Path.join(index_1.default.probesDataDir, '/probe-buckets/tcp.json');
    if (!(await exists(probeTcpFilePath))) {
        return userAgentsToTest;
    }
    const tcpProbeBuckets = JSON.parse(await FsPromises.readFile(probeTcpFilePath, 'utf8'));
    const userAgentIds = new Set();
    tcpProbeBuckets.forEach(probeBucket => {
        probeBucket.userAgentIds.forEach(userAgentId => userAgentIds.add(userAgentId));
    });
    for (const userAgentId of userAgentIds) {
        if (!userAgentConfig.browserIds.some(x => userAgentId.includes(x))) {
            continue;
        }
        const userAgent = real_user_agents_1.default.getId(userAgentId);
        if (!userAgent) {
            throw new Error(`${userAgentId} not supported by RealUserAgents`);
        }
        let string = userAgent.pattern;
        if (userAgent.stablePatchVersions) {
            const patch = userAgent.stablePatchVersions[0];
            const os = userAgent.uaClientHintsPlatformVersions[0];
            string = UserAgent_1.default.parse(userAgent, patch, os);
        }
        const userAgentToTest = {
            browserId: userAgent.browserId,
            operatingSystemId: userAgent.operatingSystemId,
            pickTypes: [],
            usagePercent: {
                [IUserAgentToTest_1.UserAgentToTestPickType.popular]: 0,
                [IUserAgentToTest_1.UserAgentToTestPickType.random]: 0,
            },
            string,
        };
        userAgentsToTest.push(userAgentToTest);
    }
    return userAgentsToTest;
}
async function exists(path) {
    try {
        await FsPromises.access(path);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=collectUserAgentsToTest.js.map