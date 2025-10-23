"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserAgentIdFromString = createUserAgentIdFromString;
exports.createUserAgentIdFromIds = createUserAgentIdFromIds;
exports.pathIsPatternMatch = pathIsPatternMatch;
const Fs = require("fs");
const Path = require("path");
const OsUtils_1 = require("@ulixee/real-user-agents/lib/OsUtils");
const BrowserUtils_1 = require("@ulixee/real-user-agents/lib/BrowserUtils");
const real_user_agents_1 = require("@ulixee/real-user-agents");
const envUtils_1 = require("@ulixee/commons/lib/envUtils");
const Paths = require("./paths");
const browserstackIndicators = require("./data/path-patterns/browserstack-indicators.json");
const instanceVariations = require("./data/path-patterns/instance-variations.json");
const devtoolsIndicators = require("./data/path-patterns/devtools-indicators.json");
const locationVariations = require("./data/path-patterns/location-variations.json");
const windowVariations = require("./data/path-patterns/window-variations.json");
const paths_1 = require("./paths");
(0, envUtils_1.loadEnv)(Path.resolve(__dirname, '..'));
const env = process.env;
/////// /////////////////////////////////////////////////////////////////////////////////////
function createUserAgentIdFromString(userAgentString) {
    const osKey = (0, OsUtils_1.createOsIdFromUserAgentString)(userAgentString);
    const browserKey = (0, BrowserUtils_1.createBrowserIdFromUserAgentString)(userAgentString);
    return createUserAgentIdFromIds(osKey, browserKey);
}
function createUserAgentIdFromIds(osId, browserId) {
    return `${osId}--${browserId}`;
}
let probeIdsMap;
/////// /////////////////////////////////////////////////////////////////////////////////////
class Config {
    static get probeIdsMap() {
        if (!this.probesDataDir) {
            throw new Error('probesDataDir must be set');
        }
        if (!probeIdsMap) {
            probeIdsMap = {};
            const probeIdsDir = Path.join(this.probesDataDir, 'probe-ids');
            if (Fs.existsSync(probeIdsDir)) {
                for (const fileName of Fs.readdirSync(probeIdsDir)) {
                    const matches = fileName.match(/^(.+)\.json$/);
                    if (!matches)
                        continue;
                    const pluginId = matches[1];
                    probeIdsMap[pluginId] = JSON.parse(Fs.readFileSync(`${probeIdsDir}/${fileName}`, 'utf8'));
                }
            }
        }
        return probeIdsMap;
    }
    static get browserNames() {
        const names = this.userAgentIds.map(userAgentId => real_user_agents_1.default.extractMetaFromUserAgentId(userAgentId).browserName);
        return Array.from(new Set(names));
    }
    static get osNames() {
        const names = this.userAgentIds.map(userAgentId => real_user_agents_1.default.extractMetaFromUserAgentId(userAgentId).operatingSystemName);
        return Array.from(new Set(names));
    }
    static findUserAgentIdsByName(name) {
        return this.userAgentIds.filter(userAgentId => {
            const meta = real_user_agents_1.default.extractMetaFromUserAgentId(userAgentId);
            return [meta.operatingSystemName, meta.browserName].includes(name);
        });
    }
    static getProfilerIndicators() {
        return browserstackIndicators;
    }
    static getDevtoolsIndicators() {
        return devtoolsIndicators;
    }
    static isVariationPath(path) {
        if (instanceVariations.changed.some(pattern => pathIsPatternMatch(path, pattern)))
            return true;
        if (instanceVariations.extraChanged.some(pattern => pathIsPatternMatch(path, pattern)))
            return true;
        if (locationVariations.changed.some(pattern => pathIsPatternMatch(path, pattern)))
            return true;
        if (locationVariations.extraChanged.some(pattern => pathIsPatternMatch(path, pattern)))
            return true;
        if (windowVariations.changed.some(pattern => pathIsPatternMatch(path, pattern)))
            return true;
        if (windowVariations.extraChanged.some(pattern => pathIsPatternMatch(path, pattern)))
            return true;
        return false;
    }
    static shouldIgnorePathValue(path) {
        if (devtoolsIndicators.added.some(pattern => pathIsPatternMatch(path, pattern)))
            return true;
        if (devtoolsIndicators.extraAdded.some(pattern => pathIsPatternMatch(path, pattern)))
            return true;
        if (devtoolsIndicators.extraChanged.some(pattern => pathIsPatternMatch(path, pattern)))
            return true;
        if (browserstackIndicators.changedOrder.some(pattern => pathIsPatternMatch(path, pattern)))
            return true;
        if (this.isVariationPath(path))
            return true;
        return false;
    }
}
Config.userAgentIds = [];
Config.dataDir = Path.join(paths_1.rootDir, 'data');
// copied from browser-profiler
Config.profilesDataDir = Path.resolve(Paths.rootDir, '../../..', 'browser-profile-data');
Config.collect = {
    port: (0, envUtils_1.parseEnvInt)(env.COLLECT_PORT),
    domains: {
        MainDomain: env.MAIN_DOMAIN,
        SubDomain: env.SUB_DOMAIN,
        TlsDomain: env.TLS_DOMAIN,
        CrossDomain: env.CROSS_DOMAIN,
    },
    shouldGenerateProfiles: parseEnvBool(env.GENERATE_PROFILES),
    pluginStartingPort: (0, envUtils_1.parseEnvInt)(env.PLUGIN_STARTING_PORT),
    pluginMaxPort: (0, envUtils_1.parseEnvInt)(env.PLUGIN_MAX_PORT) || 20000,
    // collect plugins
    tcpNetworkDevice: env.TCP_NETWORK_DEVICE,
    tcpDebug: parseEnvBool(env.TCP_DEBUG),
    tlsPrintRaw: parseEnvBool(env.TLS_PRINT_RAW),
    // path to letsencrypt certs
    enableLetsEncrypt: parseEnvBool(env.LETSENCRYPT),
};
Config.runner = {
    assignmentsHost: env.DA_COLLECT_CONTROLLER_HOST,
};
Config.probesDataDir = paths_1.probesDataDir;
exports.default = Config;
function pathIsPatternMatch(path, pattern) {
    if (pattern.charAt(0) === '*') {
        return path.includes(pattern.substr(1));
    }
    return path.startsWith(pattern);
}
function parseEnvBool(envvar) {
    if (envvar === '1' || envvar?.toLowerCase() === 'true' || envvar?.toLowerCase() === 'yes')
        return true;
    return false;
}
//# sourceMappingURL=index.js.map