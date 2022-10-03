import '@ulixee/commons/lib/SourceMapSupport';
import BrowserProfiler from '@unblocked-web/browser-profiler';
import * as stableChromeVersions from '@unblocked-web/real-user-agents/data/stableChromeVersions.json';
import * as Fs from 'fs';
import * as Path from 'path';
import ConfigJson from '../lib/json-creators/Config';
import ClienthelloJson from '../lib/json-creators/Clienthello';
import CodecsJson from '../lib/json-creators/Codecs';
import DomPolyfillJson from '../lib/json-creators/DomPolyfill';
import HeadersJson from '../lib/json-creators/Headers';
import WindowChromeJson from '../lib/json-creators/WindowChrome';
import WindowFramingJson from '../lib/json-creators/WindowFraming';
import WindowNavigatorJson from '../lib/json-creators/WindowNavigator';
import Http2SessionJson from '../lib/json-creators/Http2Session';
import EmulatorData from '../lib/EmulatorData';
import { emulatorDataDir } from '../paths';
import SpeechSynthesisJson from '../lib/json-creators/SpeechSynthesis';

const userAgentIdsByBrowserId: { [browserId: string]: string[] } = {};

for (const userAgentId of BrowserProfiler.userAgentIds) {
  const { browserId } = BrowserProfiler.extractMetaFromUserAgentId(userAgentId);
  userAgentIdsByBrowserId[browserId] = userAgentIdsByBrowserId[browserId] || [];
  userAgentIdsByBrowserId[browserId].push(userAgentId);
}

const forceRedoDom = process.argv[2] === 'force';

async function generate(): Promise<void> {
  const chromeEngines = stableChromeVersions.filter(x => x.majorVersion >= 94);

  for (const browserId of Object.keys(userAgentIdsByBrowserId).sort(
    (a, b) => Number(a.split('-').slice(1).join('.')) - Number(b.split('-').slice(1).join('.')),
  )) {
    if (!browserId.startsWith('chrome') && !browserId.startsWith('safari')) continue;

    console.log('--------------------------------------------------');
    console.log(`GENERATING ${browserId}`);
    const browserEngineId = EmulatorData.extractBrowserEngineId(browserId);
    const browserEngineOption = chromeEngines.find(x => x.id === browserEngineId);
    const config = new ConfigJson(browserId, browserEngineId, browserEngineOption as any);
    const userAgentIds = userAgentIdsByBrowserId[browserId];
    const browserDir = EmulatorData.getEmulatorDir(browserId);

    console.log('- Clienthello');
    new ClienthelloJson(config, userAgentIds).save(browserDir);

    console.log('- Headers');
    new HeadersJson(config, userAgentIds).save(browserDir);

    console.log('- Http2');
    new Http2SessionJson(config, userAgentIds).save(browserDir);

    if (config.browserEngineOption) {
      console.log('- Codecs');
      new CodecsJson(config, userAgentIds).save(browserDir);

      console.log('- Speech');
      new SpeechSynthesisJson(config, userAgentIds).save(browserDir);

      console.log('- WindowChrome');
      new WindowChromeJson(config, userAgentIds).save(browserDir);

      console.log('- WindowFraming');
      new WindowFramingJson(config, userAgentIds).save(browserDir);

      console.log('- WindowNavigator');
      new WindowNavigatorJson(config, userAgentIds).save(browserDir);

      const hasAllPolyfills = DomPolyfillJson.hasAllDomPolyfills(
        browserId,
        browserDir,
        userAgentIds,
      );
      if (!hasAllPolyfills || forceRedoDom) {
        new DomPolyfillJson(config, userAgentIds).save(browserDir);
      }
    }

    config.save(browserDir);
  }

  await Fs.promises.writeFile(
    Path.resolve(emulatorDataDir, `browserEngineOptions.json`),
    JSON.stringify(chromeEngines, null, 2),
  );
}

generate().catch(console.error);
