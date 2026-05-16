"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const compare_versions_1 = require("compare-versions");
const BrowserUtils_1 = require("../lib/BrowserUtils");
const Browsers_1 = require("../lib/Browsers");
const extractUserAgentMeta_1 = require("../lib/extractUserAgentMeta");
const OperatingSystems_1 = require("../lib/OperatingSystems");
const UserAgent_1 = require("../lib/UserAgent");
const findUaClientHintsPlatformVersion_1 = require("../lib/findUaClientHintsPlatformVersion");
class UserAgentGenerator {
    static async run(data) {
        const byId = {};
        const idSortInfo = {};
        for (const value of data.userAgents) {
            const userAgentString = value.string;
            const { name, version } = (0, extractUserAgentMeta_1.default)(userAgentString);
            const browserId = (0, BrowserUtils_1.createBrowserId)({ name, version });
            const osId = value.osId;
            const [osName, osVersionMajor, osVersionMinor] = osId.replace('mac-os', 'mac').split('-');
            const userAgentId = `${osId}--${browserId}`;
            let allPatchVersions = [];
            let stablePatchVersions = [];
            let uaClientHintsPlatformVersions = [];
            let pattern = userAgentString;
            let browserVersion = version;
            if (name === 'Chrome') {
                const chromeVersion = data.stableChromeVersions.find(x => x.id === browserId);
                if (chromeVersion) {
                    browserVersion = {
                        major: String(chromeVersion.majorVersion),
                        minor: '0',
                        build: String(chromeVersion.buildVersion ?? ''),
                    };
                }
                allPatchVersions = this.getAllPatches(data, version.major);
                stablePatchVersions = this.getStablePatches(data, browserId, osName);
                const regexp = /Chrome\/([0-9]+.[0-9]+.[0-9]+.([0-9]+))/;
                const userAgentMatches = userAgentString.match(regexp);
                const fullUa = userAgentMatches[1];
                const buildVersion = userAgentMatches[2];
                if (buildVersion && buildVersion !== '0') {
                    const buildNumber = Number(buildVersion);
                    if (!stablePatchVersions.includes(buildNumber))
                        stablePatchVersions.push(buildNumber);
                    if (stablePatchVersions.length) {
                        pattern = userAgentString.replace(`/${fullUa}`, `/${version.major}.${version.minor}.${version.build}.$patch$`);
                    }
                }
                if (Number(version.major) > 89) {
                    uaClientHintsPlatformVersions = (0, findUaClientHintsPlatformVersion_1.default)(osId);
                    if (uaClientHintsPlatformVersions.length &&
                        osId.startsWith('mac') &&
                        !userAgentString.includes('10_15_7')) {
                        pattern = pattern.replace('10_15_7', '$osVersion$');
                    }
                }
            }
            const browserIdParts = browserId.split('-');
            idSortInfo[userAgentId] = [
                osName,
                Number(osVersionMajor),
                Number(osVersionMinor ?? 0),
                browserIdParts[0],
                Number(browserIdParts[1]),
                Number(browserIdParts[2] ?? 0),
            ];
            byId[userAgentId] = {
                id: userAgentId,
                allPatchVersions,
                stablePatchVersions,
                browserBaseVersion: [
                    Number(browserVersion.major),
                    Number(browserVersion.minor),
                    browserVersion.build !== undefined ? Number(browserVersion.build) : undefined,
                    browserVersion.patch !== undefined ? Number(browserVersion.patch) : undefined,
                ],
                uaClientHintsPlatformVersions,
                operatingSystemVersion: { major: osVersionMajor, minor: osVersionMinor },
                operatingSystemId: osId,
                pattern,
                browserId,
                marketshare: 0,
            };
        }
        for (const browser of Object.values(Browsers_1.default.all())) {
            const userAgents = Object.values(byId).filter(x => x.browserId === browser.id);
            const osPercentTotal = userAgents.reduce((total, x) => {
                return total + OperatingSystems_1.default.byId(x.operatingSystemId).marketshare;
            }, 0);
            for (const userAgent of userAgents) {
                const os = OperatingSystems_1.default.byId(userAgent.operatingSystemId);
                const percentOfOsTraffic = os ? os.marketshare / osPercentTotal : 0;
                userAgent.marketshare = Math.floor(browser.marketshare * percentOfOsTraffic * 100) / 100;
            }
        }
        const values = Object.entries(byId).sort(([, a], [, b]) => {
            const aSort = idSortInfo[a.id];
            const bSort = idSortInfo[b.id];
            for (let i = 0; i < aSort.length; i += 1) {
                if (aSort[i] === bSort[i])
                    continue;
                if (typeof aSort[i] === 'number')
                    return bSort[i] - aSort[i];
                return aSort[i].localeCompare(bSort[i]);
            }
            return 0;
        });
        const entry = Object.fromEntries(values);
        await Fs.promises.writeFile(UserAgent_1.default.filePath, `${JSON.stringify(entry, null, 2)}\n`);
    }
    static getAllPatches(data, majorVersion) {
        let buildVersions = data.chromiumBuildVersions.filter(x => x.startsWith(`${majorVersion}.0`));
        buildVersions = buildVersions.sort(compare_versions_1.compareVersions).slice(-10).reverse();
        return buildVersions.map(x => x.split('.').pop()).map(Number);
    }
    static getStablePatches(data, browserId, osName) {
        const chromeVersion = data.stableChromeVersions.find(x => x.id === browserId);
        if (!chromeVersion)
            return [];
        if (osName.toLowerCase() === 'windows')
            return chromeVersion.stablePatchesByOs.win;
        if (osName.toLowerCase().startsWith('mac'))
            return chromeVersion.stablePatchesByOs.mac;
        return [];
    }
}
exports.default = UserAgentGenerator;
//# sourceMappingURL=UserAgentGenerator.js.map