"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ua_parser_js_1 = require("ua-parser-js");
const utils_1 = require("@ulixee/commons/lib/utils");
const real_user_agents_1 = require("@ulixee/real-user-agents");
const UserAgent_1 = require("@ulixee/real-user-agents/lib/UserAgent");
const findUaClientHintsPlatformVersion_1 = require("@ulixee/real-user-agents/lib/findUaClientHintsPlatformVersion");
const BrowserData_1 = require("./BrowserData");
class UserAgentOptions {
    get installedOptions() {
        if (!this.installedUserAgentOptions) {
            const enginesByNameVersion = new Set();
            for (const engine of this.browserEngineOptions.installedOptions) {
                enginesByNameVersion.add(engine.id);
            }
            this.installedUserAgentOptions = [];
            for (const userAgent of real_user_agents_1.default.all()) {
                if (enginesByNameVersion.has(userAgent.browserId)) {
                    this.installedUserAgentOptions.push(userAgent);
                }
            }
        }
        return this.installedUserAgentOptions;
    }
    constructor(dataLoader, browserEngineOptions) {
        this.dataLoader = dataLoader;
        this.browserEngineOptions = browserEngineOptions;
        const defaultBrowserEngine = browserEngineOptions.default;
        this.defaultBrowserUserAgentOptions = this.installedOptions.filter(x => x.browserId === defaultBrowserEngine.id);
    }
    getDefaultAgentOption() {
        return UserAgentOptions.random(this.defaultBrowserUserAgentOptions);
    }
    hasDataSupport(userAgentOption) {
        const browserId = (0, BrowserData_1.createBrowserId)(userAgentOption);
        const osId = (0, BrowserData_1.createOsId)(userAgentOption);
        return this.dataLoader.isInstalledBrowserAndOs(browserId, osId);
    }
    findClosestInstalledToUserAgentString(userAgentString) {
        // otherwise parse the agent
        let userAgent = UserAgentOptions.parse(userAgentString);
        const browserId = (0, BrowserData_1.createBrowserId)(userAgent);
        const osId = (0, BrowserData_1.createOsId)(userAgent);
        if (!this.dataLoader.isInstalledBrowserAndOs(browserId, osId) ||
            !this.browserEngineOptions.installedOptions.some(x => x.id === browserId)) {
            userAgent = this.findClosestInstalled(userAgent);
            userAgent.string = userAgentString;
        }
        if (!UserAgentOptions.canTrustOsVersionForAgentString(userAgent)) {
            UserAgentOptions.replaceOperatingSystem(userAgent, this.installedOptions);
        }
        return userAgent;
    }
    findClosestInstalled(userAgent) {
        const id = (0, BrowserData_1.createBrowserId)(userAgent);
        let filteredOptions = this.installedOptions.filter(x => x.browserId === id);
        // if none on this version, go to default
        if (!filteredOptions.length)
            filteredOptions = this.defaultBrowserUserAgentOptions;
        const withOs = filteredOptions.filter(x => cleanName(x.operatingSystemName) === userAgent.operatingSystemCleanName);
        if (withOs.length)
            filteredOptions = withOs;
        const withOsVersion = filteredOptions.filter(x => isLeftVersionGreater(x.operatingSystemVersion, userAgent.operatingSystemVersion, true));
        if (withOsVersion.length)
            filteredOptions = withOsVersion;
        return UserAgentOptions.random(filteredOptions);
    }
    findWithSelector(selectors) {
        const filteredOptions = this.installedOptions.filter(selectors.isMatch);
        if (!filteredOptions.length)
            return null;
        return UserAgentOptions.random(filteredOptions);
    }
    static parse(userAgentString) {
        if (this.parsedCached[userAgentString])
            return this.parsedCached[userAgentString];
        const uaParser = new ua_parser_js_1.UAParser(userAgentString);
        const uaBrowser = uaParser.getBrowser();
        const uaOs = uaParser.getOS();
        const [browserVersionMajor, browserVersionMinor, browserVersionPatch, browserVersionBuild] = uaBrowser.version.split('.');
        const browserName = cleanName(uaBrowser.name || '');
        // eslint-disable-next-line prefer-const
        let [osVersionMajor, osVersionMinor, osVersionPatch] = uaOs.version.split('.');
        const operatingSystemCleanName = cleanName(uaOs.name || '');
        if (operatingSystemCleanName === 'mac-os' &&
            osVersionMajor === '10' &&
            osVersionMinor === '16') {
            osVersionMajor = '11';
            osVersionMinor = undefined;
        }
        const ua = {
            browserName,
            browserVersion: {
                major: browserVersionMajor ?? '1',
                minor: browserVersionMinor ?? '0',
                patch: browserVersionPatch,
                build: browserVersionBuild,
            },
            operatingSystemCleanName,
            operatingSystemVersion: {
                major: osVersionMajor,
                minor: osVersionMinor,
                patch: osVersionPatch,
            },
            uaClientHintsPlatformVersion: uaOs.version,
            string: userAgentString,
        };
        if (browserName.toLowerCase() === 'chrome' && Number(browserVersionMajor) > 89) {
            const platformVersions = (0, findUaClientHintsPlatformVersion_1.default)((0, BrowserData_1.createOsId)(ua));
            if (platformVersions.length) {
                ua.uaClientHintsPlatformVersion = (0, utils_1.pickRandom)(platformVersions);
            }
        }
        this.parsedCached[userAgentString] = ua;
        return this.parsedCached[userAgentString];
    }
    static random(dataUserAgentOptions) {
        const dataUserAgentOption = (0, utils_1.pickRandom)(dataUserAgentOptions);
        return this.convertToUserAgentOption(dataUserAgentOption);
    }
    static convertToUserAgentOption(agent) {
        let patch = agent.browserBaseVersion[3];
        const [major, minor, build] = agent.browserBaseVersion.map(String);
        if (agent.stablePatchVersions.length) {
            patch = (0, utils_1.pickRandom)(agent.stablePatchVersions);
        }
        const uaClientHintsPlatformVersion = agent.uaClientHintsPlatformVersions.length
            ? (0, utils_1.pickRandom)(agent.uaClientHintsPlatformVersions)
            : `${[
                agent.operatingSystemVersion.major,
                agent.operatingSystemVersion.minor,
                agent.operatingSystemVersion.build,
            ]
                .filter(x => x !== undefined && x !== null)
                .join('.')}`;
        const userAgent = {
            browserName: cleanName(agent.browserName),
            browserVersion: { major, minor, build, patch: String(patch) },
            operatingSystemCleanName: cleanName(agent.operatingSystemName),
            operatingSystemVersion: { ...agent.operatingSystemVersion },
            uaClientHintsPlatformVersion,
            string: UserAgent_1.default.parse(agent, patch, uaClientHintsPlatformVersion),
        };
        const parsed = this.parse(userAgent.string);
        if (this.canTrustOsVersionForAgentString(parsed)) {
            userAgent.operatingSystemVersion = parsed.operatingSystemVersion;
        }
        else {
            this.chooseOsPatchValue(userAgent);
        }
        return userAgent;
    }
    static canTrustOsVersionForAgentString(agentOption) {
        // Chrome 90+ started pegging the OS versions to 10.15.7
        if (agentOption.operatingSystemCleanName === 'mac-os' &&
            Number(agentOption.browserVersion.major) > 90 &&
            agentOption.operatingSystemVersion.major === '10' &&
            agentOption.operatingSystemVersion.minor === '15' &&
            agentOption.operatingSystemVersion.patch === '7') {
            return false;
        }
        // windows 11 never shows up in the os version (shows as 10)
        if (agentOption.operatingSystemCleanName === 'windows' &&
            agentOption.operatingSystemVersion.major === '10') {
            return false;
        }
        return true;
    }
    static replaceOperatingSystem(userAgent, dataUserAgentOptions) {
        const browserId = (0, BrowserData_1.createBrowserId)(userAgent);
        const realOperatingSystem = dataUserAgentOptions.find(x => x.browserId === browserId &&
            cleanName(x.operatingSystemName) === userAgent.operatingSystemCleanName &&
            isLeftVersionGreater(x.operatingSystemVersion, userAgent.operatingSystemVersion));
        if (realOperatingSystem) {
            userAgent.operatingSystemVersion = { ...realOperatingSystem.operatingSystemVersion };
            this.chooseOsPatchValue(userAgent);
        }
    }
    // TODO: we need a way to pick good randomized values for these. We're tacking onto the "true" os value.
    //    We could collect valid values as part of data generation...
    static chooseOsPatchValue(userAgent) {
        userAgent.operatingSystemVersion.patch = '1';
    }
}
UserAgentOptions.parsedCached = {};
exports.default = UserAgentOptions;
function isLeftVersionGreater(a, b, allowEqual = false) {
    for (const key of ['major', 'minor', 'patch', 'build']) {
        const aValue = Number(a[key] ?? 0);
        const bValue = Number(b[key] ?? 0);
        if (aValue > bValue)
            return true;
        if (allowEqual && aValue === bValue)
            return true;
        if (aValue < bValue)
            return false;
    }
    return false;
}
const cleanCache = {};
function cleanName(name) {
    cleanCache[name] ??= name.toLowerCase().replace(/[^a-z]+/, '-');
    return cleanCache[name];
}
//# sourceMappingURL=UserAgentOptions.js.map