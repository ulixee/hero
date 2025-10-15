"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOsId = createOsId;
exports.createBrowserId = createBrowserId;
const Fs = require("fs");
const OsUtils_1 = require("@ulixee/real-user-agents/lib/OsUtils");
const getLocalOperatingSystemMeta_1 = require("@ulixee/real-user-agents/lib/getLocalOperatingSystemMeta");
const VersionUtils_1 = require("@ulixee/real-user-agents/lib/VersionUtils");
const DataLoader_1 = require("./DataLoader");
class BrowserData {
    constructor(dataLoader, userAgentOption) {
        const browserId = createBrowserId(userAgentOption);
        const os = getOperatingSystemParts(userAgentOption);
        this.dataLoader = dataLoader;
        this.baseDataDir = `${dataLoader.dataDir}/as-${browserId}`;
        this.osDataDir = `${this.baseDataDir}/as-${createOsId(userAgentOption)}`;
        if (!this.dataLoader.isSupportedEmulatorOs(this.osDataDir)) {
            const otherVersions = this.dataLoader.getBrowserOperatingSystemVersions(browserId, os.name);
            if (!otherVersions?.length) {
                throw new Error(`${browserId} has no emulation data for ${os.name}`);
            }
            const closestVersionMatch = (0, VersionUtils_1.findClosestVersionMatch)(os.version, otherVersions);
            this.osDataDir = `${this.baseDataDir}/as-${os.name}-${closestVersionMatch}`;
        }
    }
    get pkg() {
        return this.dataLoader.pkg;
    }
    get headers() {
        return (0, DataLoader_1.loadData)(`${this.baseDataDir}/headers.json`);
    }
    get windowBaseFraming() {
        return (0, DataLoader_1.loadData)(`${this.baseDataDir}/window-base-framing.json`);
    }
    get browserConfig() {
        return (0, DataLoader_1.loadData)(`${this.baseDataDir}/config.json`);
    }
    get clienthello() {
        return (0, DataLoader_1.loadData)(`${this.osDataDir}/clienthello.json`);
    }
    get codecs() {
        return (0, DataLoader_1.loadData)(`${this.osDataDir}/codecs.json`);
    }
    get userAgentHints() {
        return (0, DataLoader_1.loadData)(`${this.osDataDir}/user-agent-hints.json`);
    }
    get speech() {
        return (0, DataLoader_1.loadData)(`${this.osDataDir}/browser-speech.json`);
    }
    get fonts() {
        return (0, DataLoader_1.loadData)(`${this.osDataDir}/browser-fonts.json`);
    }
    get http2Settings() {
        return (0, DataLoader_1.loadData)(`${this.osDataDir}/http2-session.json`);
    }
    get windowChrome() {
        try {
            return (0, DataLoader_1.loadData)(`${this.osDataDir}/window-chrome.json`);
        }
        catch (e) {
            return undefined;
        }
    }
    get windowFraming() {
        return (0, DataLoader_1.loadData)(`${this.osDataDir}/window-framing.json`);
    }
    get windowNavigator() {
        return (0, DataLoader_1.loadData)(`${this.osDataDir}/window-navigator.json`);
    }
    get domPolyfill() {
        try {
            this.domPolyfillFilename ??= extractPolyfillFilename(this.osDataDir);
            return (0, DataLoader_1.loadData)(`${this.osDataDir}/${this.domPolyfillFilename}`);
        }
        catch (e) {
            return undefined;
        }
    }
}
BrowserData.localOsMeta = (0, getLocalOperatingSystemMeta_1.default)();
exports.default = BrowserData;
const polyfillFilesByDatadir = {};
function extractPolyfillFilename(dataDir) {
    let filenameMap = polyfillFilesByDatadir[dataDir];
    const localOsMeta = BrowserData.localOsMeta;
    if (!filenameMap) {
        filenameMap = {};
        polyfillFilesByDatadir[dataDir] = filenameMap;
        for (const filename of Fs.readdirSync(dataDir)) {
            const matches = filename.match(/^dom-polyfill-when-runtime-([a-z-]+)(-([0-9-]+))?.json$/);
            if (!matches)
                continue;
            const [osName, _, osVersion] = matches.slice(1); // eslint-disable-line @typescript-eslint/naming-convention,@typescript-eslint/no-unused-vars
            filenameMap[osName] = filenameMap[osName] || {};
            filenameMap[osName][osVersion || 'ALL'] = filename;
        }
    }
    if (!filenameMap[localOsMeta.name]) {
        throw new Error(`Your OS (${localOsMeta.name}) is not supported by this emulator.`);
    }
    const versionMatch = (0, VersionUtils_1.findClosestVersionMatch)(localOsMeta.version, Object.keys(filenameMap[localOsMeta.name]));
    if (!versionMatch) {
        throw new Error(`Emulator could not find a version match for ${localOsMeta.name} ${localOsMeta.version}`);
    }
    return filenameMap[localOsMeta.name][versionMatch];
}
function createOsId(userAgentOption) {
    const parts = getOperatingSystemParts(userAgentOption);
    return `${parts.name}-${parts.version}`;
}
function createBrowserId(userAgentOption) {
    const { browserName, browserVersion } = userAgentOption;
    return [browserName, browserVersion.major, browserVersion.minor].filter(x => x).join('-');
}
function getOperatingSystemParts(userAgentOption) {
    const { operatingSystemCleanName: name, operatingSystemVersion: version } = userAgentOption;
    let { major, minor } = version;
    if (name.startsWith('mac')) {
        [major, minor] = (0, OsUtils_1.convertMacOsVersionString)([major, minor].filter(x => x).join('.')).split('.');
    }
    if (name.startsWith('win') && version.minor === '0') {
        minor = null;
    }
    const finalVersion = [major, minor].filter(x => x).join('-');
    return { name, version: finalVersion };
}
//# sourceMappingURL=BrowserData.js.map