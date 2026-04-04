"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const Path = require("path");
const unblocked_browser_profiler_1 = require("@ulixee/unblocked-browser-profiler");
const unblocked_browser_profiler_dom_bridger_1 = require("@ulixee/unblocked-browser-profiler-dom-bridger");
const zlib_1 = require("zlib");
const generatePolyfill_1 = require("../generatePolyfill");
const EmulatorData_1 = require("../EmulatorData");
const browserstackProfilesDir = Path.join(unblocked_browser_profiler_1.default.dataDir, 'profiled-doms/browserstack');
const localProfilesDir = Path.join(unblocked_browser_profiler_1.default.dataDir, 'profiled-doms/local');
function log(message, ...args) {
    // eslint-disable-next-line no-console
    console.log(message, ...args);
}
class DomPolyfillJson {
    constructor(config, userAgentIds) {
        this.dataMap = {};
        if (!config.browserEngineOption)
            return;
        const foundationDomsByOsId = getFoundationDoms(config.browserId);
        for (const userAgentId of userAgentIds) {
            const profile = unblocked_browser_profiler_1.default.getProfile('browser-dom-environment', userAgentId);
            const { operatingSystemId: emulateOsId } = unblocked_browser_profiler_1.default.extractMetaFromUserAgentId(userAgentId);
            for (const runtimeOsId of Object.keys(foundationDomsByOsId)) {
                const foundationDom = foundationDomsByOsId[runtimeOsId];
                const polyfill = (0, generatePolyfill_1.default)(profile.data.https, foundationDom);
                // apply devtools, browserstack, headless indicator removes
                unblocked_browser_profiler_dom_bridger_1.default.removeDevtoolsFromPolyfill(polyfill);
                unblocked_browser_profiler_dom_bridger_1.default.removeBrowserstackFromPolyfill(polyfill);
                unblocked_browser_profiler_dom_bridger_1.default.removeHeadlessFromPolyfill(polyfill);
                // remove variations
                unblocked_browser_profiler_dom_bridger_1.default.removeVariationsFromPolyfill(polyfill);
                // remove stuff not support by our polyfill plugin
                unblocked_browser_profiler_dom_bridger_1.default.removeCustomCallbackFromPolyfill(polyfill, filterNotSupportedByPolyfillPlugin);
                this.dataMap[emulateOsId] = this.dataMap[emulateOsId] || {};
                this.dataMap[emulateOsId][runtimeOsId] = polyfill;
            }
        }
    }
    save(dataDir) {
        for (const [emulateOsId, dataByRuntimeOsId] of Object.entries(this.dataMap)) {
            const dataOsDir = EmulatorData_1.default.getEmulatorDataOsDir(dataDir, emulateOsId);
            if (!Fs.existsSync(dataOsDir))
                Fs.mkdirSync(dataOsDir, { recursive: true });
            for (const runtimeOsId of Object.keys(dataByRuntimeOsId)) {
                const dataString = JSON.stringify(dataByRuntimeOsId[runtimeOsId], null, 2);
                const domDiffsPath = Path.join(dataOsDir, `dom-polyfill-when-runtime-${runtimeOsId}.json`);
                const byteSize = Buffer.byteLength(dataString, 'utf8');
                const { add, remove, modify } = dataByRuntimeOsId[runtimeOsId];
                if (add.length || remove.length || modify.length) {
                    log('----------------------------------');
                    log(formatBytes(byteSize).padEnd(10), domDiffsPath);
                    if (add.length) {
                        log('\nMUST ADD:');
                        for (const toAdd of add || []) {
                            log(`- ${toAdd.path}.${toAdd.propertyName}`);
                        }
                    }
                    if (remove.length) {
                        log('\nMUST REMOVE:');
                        for (const item of remove || []) {
                            log(`- ${item.path}.${item.propertyName}`);
                        }
                    }
                    if (modify.length) {
                        log('\nMUST MODIFY:');
                        for (const item of modify || []) {
                            log(`- ${item.path}.${item.propertyName}`);
                        }
                    }
                }
                Fs.writeFileSync(domDiffsPath, `${dataString}\n`);
            }
        }
    }
    static clean(dataDir, userAgentIds) {
        for (const userAgentId of userAgentIds) {
            const { operatingSystemId: emulateOsId } = unblocked_browser_profiler_1.default.extractMetaFromUserAgentId(userAgentId);
            const dataOsDir = EmulatorData_1.default.getEmulatorDataOsDir(dataDir, emulateOsId);
            if (Fs.existsSync(dataOsDir))
                Fs.rmSync(dataOsDir, { recursive: true });
        }
    }
    static hasAllDomPolyfills(browserId, dataDir, userAgentIds) {
        const osIds = getFoundationDomOsIds(browserId);
        for (const userAgentId of userAgentIds) {
            const { operatingSystemId: emulateOsId } = unblocked_browser_profiler_1.default.extractMetaFromUserAgentId(userAgentId);
            const dataOsDir = EmulatorData_1.default.getEmulatorDataOsDir(dataDir, emulateOsId);
            if (!Fs.existsSync(dataOsDir))
                return false;
            const files = Fs.readdirSync(dataOsDir).filter(x => x.startsWith('dom-polyfill'));
            for (const runtimeOsId of osIds) {
                if (!files.some(x => x.includes(runtimeOsId)))
                    return false;
            }
        }
        return true;
    }
}
exports.default = DomPolyfillJson;
function filterNotSupportedByPolyfillPlugin(path, propertyName, value) {
    // DomExtractor timedout and produced this output
    if (value === 'Promise-like') {
        return true;
    }
    // Function needs multiple arguments
    if (typeof value === 'string' && value.includes('but only 0 present')) {
        return true;
    }
    // Handled by other plugin
    const pathsToIgnore = ['window.navigator.platform'];
    if (pathsToIgnore.includes(path)) {
        return true;
    }
    const languages = ['window.navigator.languages', 'window.navigator.language'];
    if (languages.includes(path)) {
        return true;
    }
    // Currently we don't support creating otherInvocations with new()
    if (propertyName.includes('_$otherInvocation') && propertyName.includes('new()')) {
        return true;
    }
    return false;
}
function getFoundationDomOsIds(forBrowserId) {
    const osIds = new Set();
    for (const dirName of Fs.readdirSync(browserstackProfilesDir)) {
        const [osId, browserId] = dirName.split('--');
        if (browserId !== forBrowserId)
            continue;
        osIds.add(osId);
    }
    return [...osIds];
}
function getFoundationDoms(forBrowserId) {
    const domsByOsId = {};
    const domPathsByOsId = {};
    for (const dirName of Fs.readdirSync(browserstackProfilesDir)) {
        const [osId, browserId] = dirName.split('--');
        if (browserId !== forBrowserId)
            continue;
        const startingDomPath = `${browserstackProfilesDir}/${dirName}/browser-dom-environment--https--1.json.gz`;
        const { data: dom } = JSON.parse((0, zlib_1.gunzipSync)(Fs.readFileSync(startingDomPath)).toString());
        domsByOsId[osId] = dom;
        domPathsByOsId[osId] = startingDomPath;
    }
    for (const dirName of Fs.readdirSync(localProfilesDir)) {
        const [osId, browserId, features] = dirName.split('--');
        if (browserId !== forBrowserId)
            continue;
        if (osId !== 'linux')
            continue;
        // add linux polyfills (NOTE: these should switch to headed)
        if (features !== 'headless-devtools')
            continue;
        const startingDomPath = `${localProfilesDir}/${dirName}/browser-dom-environment--https--1.json.gz`;
        const { data: dom } = JSON.parse((0, zlib_1.gunzipSync)(Fs.readFileSync(startingDomPath)).toString());
        domsByOsId[osId] = dom;
        domPathsByOsId[osId] = startingDomPath;
    }
    return domsByOsId;
}
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1e3;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    // eslint-disable-next-line no-restricted-properties
    const finalSize = parseFloat((bytes / k ** i).toFixed(dm));
    return `${finalSize} ${sizes[i]}`;
}
//# sourceMappingURL=DomPolyfill.js.map