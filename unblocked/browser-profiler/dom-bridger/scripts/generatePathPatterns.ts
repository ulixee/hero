import '@ulixee/commons/lib/SourceMapSupport';
import * as Fs from 'fs';
import * as Path from 'path';
import BrowserProfiler from '@ulixee/unblocked-browser-profiler';
import getStableChromeVersions from '@ulixee/unblocked-browser-profiler/lib/getStableChromeVersions';
import { readFile } from 'fs/promises';
import { gunzip } from 'zlib';
import InstanceChangeExtractor from '../lib/extractors/InstanceChangeExtractor';
import LocationChangeExtractor from '../lib/extractors/LocationChangeExtractor';
import WindowChangeExtractor from '../lib/extractors/WindowChangeExtractor';
import DevtoolsIndicatorExtractor from '../lib/extractors/DevtoolsIndicatorExtractor';
import HeadlessIndicatorExtractor from '../lib/extractors/HeadlessIndicatorExtractor';
import BrowserstackIndicatorExtractor from '../lib/extractors/BrowserstackIndicatorExtractor';
import { extractPathsFromDom } from '../lib/extractDomPaths';

const instanceToInstanceMappings = BrowserProfiler.loadDataFile(
  'dom-bridges/raw-mappings/instance-to-instance.json',
);
const nodevtoolsToDevtoolsMappings = BrowserProfiler.loadDataFile(
  'dom-bridges/raw-mappings/nodevtools-to-devtools.json',
);
const headedToHeadlessMappings = BrowserProfiler.loadDataFile(
  'dom-bridges/raw-mappings/headed-to-headless.json',
);
const localToBrowserstack = BrowserProfiler.loadDataFile(
  'dom-bridges/raw-mappings/local-to-browserstack.json',
);

async function generatePathPatterns(): Promise<void> {
  const browserEngineOptions = await getStableChromeVersions(10);
  const browserIds = browserEngineOptions.map(x => x.id);

  const instanceExtractor = new InstanceChangeExtractor(instanceToInstanceMappings);
  const locationExtractor = new LocationChangeExtractor(instanceToInstanceMappings);
  const windowExtractor = new WindowChangeExtractor(instanceToInstanceMappings);
  const devtoolsExtractor = new DevtoolsIndicatorExtractor(nodevtoolsToDevtoolsMappings);
  const headlessExtractor = new HeadlessIndicatorExtractor(headedToHeadlessMappings);
  const browserstackExtractor = new BrowserstackIndicatorExtractor(localToBrowserstack);

  for (const profileType of ['local', 'browserstack']) {
    const profileTypeDir = `${BrowserProfiler.dataDir}/profiled-doms/${profileType}`;
    const dirNames = await Fs.promises.readdir(profileTypeDir);

    for (const profileName of dirNames) {
      if (!browserIds.some(y => profileName.includes(y))) continue;
      const domDir = Path.join(profileTypeDir, profileName);

      console.log('EXTRACTING DOM PATHS', profileType, profileName);

      const contents = await readFile(`${domDir}/browser-dom-environment--https--1.json.gz`);
      const { data: dom } = JSON.parse(
        await new Promise<string>(resolve => gunzip(contents, x => resolve(x.toString()))),
      );
      const paths = extractPathsFromDom(dom);
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

  locationExtractor.setAsHandled(
    instanceExtractor.handledPatterns,
    windowExtractor.handledPatterns,
    devtoolsExtractor.handledPatterns,
    headlessExtractor.handledPatterns,
    browserstackExtractor.handledPatterns,
  );

  instanceExtractor.setAsHandled(
    locationExtractor.handledPatterns,
    windowExtractor.handledPatterns,
    devtoolsExtractor.handledPatterns,
    headlessExtractor.handledPatterns,
    browserstackExtractor.handledPatterns,
  );

  windowExtractor.setAsHandled(
    instanceExtractor.handledPatterns,
    locationExtractor.handledPatterns,
    devtoolsExtractor.handledPatterns,
    headlessExtractor.handledPatterns,
    browserstackExtractor.handledPatterns,
  );

  devtoolsExtractor.setAsHandled(
    instanceExtractor.handledPatterns,
    locationExtractor.handledPatterns,
    windowExtractor.handledPatterns,
    headlessExtractor.handledPatterns,
    browserstackExtractor.handledPatterns,
  );

  headlessExtractor.setAsHandled(
    instanceExtractor.handledPatterns,
    locationExtractor.handledPatterns,
    windowExtractor.handledPatterns,
    devtoolsExtractor.handledPatterns,
    browserstackExtractor.handledPatterns,
  );

  browserstackExtractor.setAsHandled(
    instanceExtractor.handledPatterns,
    locationExtractor.handledPatterns,
    windowExtractor.handledPatterns,
    devtoolsExtractor.handledPatterns,
    headlessExtractor.handledPatterns,
  );

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
    const filePath = Path.resolve(
      BrowserProfiler.dataDir,
      `dom-bridges/path-patterns/${fileName}.json`,
    );
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
