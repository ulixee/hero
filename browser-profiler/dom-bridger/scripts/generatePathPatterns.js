"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@ulixee/commons/lib/SourceMapSupport");
const Fs = require("fs");
const Path = require("path");
const unblocked_browser_profiler_1 = require("@ulixee/unblocked-browser-profiler");
const getStableChromeVersions_1 = require("@ulixee/unblocked-browser-profiler/lib/getStableChromeVersions");
const promises_1 = require("fs/promises");
const zlib_1 = require("zlib");
const InstanceChangeExtractor_1 = require("../lib/extractors/InstanceChangeExtractor");
const LocationChangeExtractor_1 = require("../lib/extractors/LocationChangeExtractor");
const WindowChangeExtractor_1 = require("../lib/extractors/WindowChangeExtractor");
const DevtoolsIndicatorExtractor_1 = require("../lib/extractors/DevtoolsIndicatorExtractor");
const HeadlessIndicatorExtractor_1 = require("../lib/extractors/HeadlessIndicatorExtractor");
const BrowserstackIndicatorExtractor_1 = require("../lib/extractors/BrowserstackIndicatorExtractor");
const extractDomPaths_1 = require("../lib/extractDomPaths");
const instanceToInstanceMappings = unblocked_browser_profiler_1.default.loadDataFile('dom-bridges/raw-mappings/instance-to-instance.json');
const nodevtoolsToDevtoolsMappings = unblocked_browser_profiler_1.default.loadDataFile('dom-bridges/raw-mappings/nodevtools-to-devtools.json');
const headedToHeadlessMappings = unblocked_browser_profiler_1.default.loadDataFile('dom-bridges/raw-mappings/headed-to-headless.json');
const localToBrowserstack = unblocked_browser_profiler_1.default.loadDataFile('dom-bridges/raw-mappings/local-to-browserstack.json');
async function generatePathPatterns() {
    const browserEngineOptions = await (0, getStableChromeVersions_1.default)(15);
    const browserIds = browserEngineOptions.map(x => x.id);
    const instanceExtractor = new InstanceChangeExtractor_1.default(instanceToInstanceMappings);
    const locationExtractor = new LocationChangeExtractor_1.default(instanceToInstanceMappings);
    const windowExtractor = new WindowChangeExtractor_1.default(instanceToInstanceMappings);
    const devtoolsExtractor = new DevtoolsIndicatorExtractor_1.default(nodevtoolsToDevtoolsMappings);
    const headlessExtractor = new HeadlessIndicatorExtractor_1.default(headedToHeadlessMappings);
    const browserstackExtractor = new BrowserstackIndicatorExtractor_1.default(localToBrowserstack);
    for (const profileType of ['local', 'browserstack']) {
        const profileTypeDir = `${unblocked_browser_profiler_1.default.dataDir}/profiled-doms/${profileType}`;
        const dirNames = await Fs.promises.readdir(profileTypeDir);
        for (const profileName of dirNames) {
            if (!browserIds.some(y => profileName.includes(y)))
                continue;
            const domDir = Path.join(profileTypeDir, profileName);
            console.log('EXTRACTING DOM PATHS', profileType, profileName);
            const contents = await (0, promises_1.readFile)(`${domDir}/browser-dom-environment--https--1.json.gz`);
            const { data: dom } = JSON.parse(await new Promise(resolve => (0, zlib_1.gunzip)(contents, (err, x) => resolve(x.toString()))));
            const paths = (0, extractDomPaths_1.extractPathsFromDom)(dom);
            for (const extractor of [
                instanceExtractor,
                locationExtractor,
                windowExtractor,
                devtoolsExtractor,
                headlessExtractor,
                browserstackExtractor,
            ]) {
                extractor.evaluate(paths);
            }
        }
    }
    locationExtractor.setAsHandled(instanceExtractor.handledPatterns, windowExtractor.handledPatterns, devtoolsExtractor.handledPatterns, headlessExtractor.handledPatterns, browserstackExtractor.handledPatterns);
    instanceExtractor.setAsHandled(locationExtractor.handledPatterns, windowExtractor.handledPatterns, devtoolsExtractor.handledPatterns, headlessExtractor.handledPatterns, browserstackExtractor.handledPatterns);
    windowExtractor.setAsHandled(instanceExtractor.handledPatterns, locationExtractor.handledPatterns, devtoolsExtractor.handledPatterns, headlessExtractor.handledPatterns, browserstackExtractor.handledPatterns);
    devtoolsExtractor.setAsHandled(instanceExtractor.handledPatterns, locationExtractor.handledPatterns, windowExtractor.handledPatterns, headlessExtractor.handledPatterns, browserstackExtractor.handledPatterns);
    headlessExtractor.setAsHandled(instanceExtractor.handledPatterns, locationExtractor.handledPatterns, windowExtractor.handledPatterns, devtoolsExtractor.handledPatterns, browserstackExtractor.handledPatterns);
    browserstackExtractor.setAsHandled(instanceExtractor.handledPatterns, locationExtractor.handledPatterns, windowExtractor.handledPatterns, devtoolsExtractor.handledPatterns, headlessExtractor.handledPatterns);
    const dataGroups = {
        'INSTANCE VARIATIONS': instanceExtractor,
        'LOCATION VARIATIONS': locationExtractor,
        'WINDOW VARIATIONS': windowExtractor,
        'DEVTOOLS INDICATORS': devtoolsExtractor,
        'HEADLESS INDICATORS': headlessExtractor,
        'BROWSERSTACK INDICATORS': browserstackExtractor,
    };
    for (const [title, extractor] of Object.entries(dataGroups)) {
        console.log('\n'.padEnd(150, '='), `\n${title} --`);
        const fileName = title.toLowerCase().replace(' ', '-');
        const filePath = Path.resolve(unblocked_browser_profiler_1.default.dataDir, `dom-bridges/path-patterns/${fileName}.json`);
        await Fs.promises.writeFile(filePath, JSON.stringify(extractor.toJSON(), null, 2));
        console.log('\n---------------------------------------');
        console.log(`${title} / DEFINITE PATHS MATCHED: `);
        extractor.definitePathsMatched.forEach(x => console.log(x));
        console.log('\n---------------------------------------');
        console.log(`${title} / DEFINITE PATHS NOT MATCHED: `);
        extractor.definitePathsNotMatched.forEach(x => console.log(x, extractor.getRegexps(x)));
        console.log('\n---------------------------------------');
        console.log(`${title} / DEFINITE PATTERNS NOT USED: `);
        extractor.definitePatternsNotUsed.forEach(x => console.log(x));
        // console.log('\n---------------------------------------')
        // console.log(`${title} / DEFINITE PATHS HANDLED ELSEWHERE: `);
        // extractor.definitePathsHandledElsewhere.forEach(x => console.log(x));
        console.log('\n---------------------------------------');
        console.log(`${title} / EXTRA PATHS MATCHED: `);
        extractor.extraPathsMatched.forEach(x => console.log(x));
        console.log('\n---------------------------------------');
        console.log(`${title} / EXTRA PATHS NOT MATCHED: `);
        extractor.extraPathsNotMatched.forEach(x => console.log(x));
        // console.log('\n---------------------------------------')
        // console.log(`${title} / EXTRA PATHS HANDLED ELSEWHERE: `);
        // extractor.extraPathsHandledElsewhere.forEach(x => console.log(x));
        // console.log('\n---------------------------------------')
        // console.log(`${title} / PATHS ALREADY HANDLED: `);
        // extractor.patternsHandledElsewhere.forEach(x => console.log(x));
    }
    console.log('');
}
generatePathPatterns().catch(console.error);
//# sourceMappingURL=generatePathPatterns.js.map