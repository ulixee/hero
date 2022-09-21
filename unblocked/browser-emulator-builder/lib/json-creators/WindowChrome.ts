import * as Fs from 'fs';
import BrowserProfiler from '@unblocked-web/browser-profiler';
import { IProfileDataByProtocol } from '@double-agent/collect-browser-dom-environment/interfaces/IProfile';
import * as Path from 'path';
import IBaseProfile from '@double-agent/collect/interfaces/IBaseProfile';
import Config from './Config';
import EmulatorData from '../EmulatorData';

const localProfilesDir = Path.join(BrowserProfiler.dataDir, 'profiled-doms/local');

export default class WindowChromeJson {
  private readonly dataByOsId: { [osId: string]: any } = {};
  private readonly browserId: string;

  constructor(config: Config, userAgentIds: string[]) {
    this.browserId = config.browserId;

    let localHeadedChromeProperty: any = null;
    for (const userAgentId of userAgentIds) {
      const profile = BrowserProfiler.getProfile<IBaseProfile<IProfileDataByProtocol>>(
        'browser-dom-environment',
        userAgentId,
      );
      const { operatingSystemId } = BrowserProfiler.extractMetaFromUserAgentId(userAgentId);

      if (!localHeadedChromeProperty) {
        const headedLocalDom = Fs.readdirSync(localProfilesDir).find(x =>
          x.endsWith(`${config.browserId}--headed-devtools`),
        );
        if (headedLocalDom) {
          const localDomPath = `${localProfilesDir}/${headedLocalDom}/browser-dom-environment--https--1.json`;
          const { data } = JSON.parse(Fs.readFileSync(localDomPath, 'utf8'));
          localHeadedChromeProperty = data.window.chrome;
        }
      }

      const window = profile.data.https.window;

      if (window.chrome) {
        const keys = Object.keys(window);
        const index = keys.indexOf('chrome');
        const prevProperty = keys[index - 1];

        if (localHeadedChromeProperty) {
          window.chrome.runtime = localHeadedChromeProperty.runtime;
        }
        this.dataByOsId[operatingSystemId] = {
          chrome: window.chrome,
          prevProperty,
        };
      }
    }
  }

  public save(dataDir: string): void {
    for (const [osId, data] of Object.entries(this.dataByOsId)) {
      const dataOsDir = EmulatorData.getEmulatorDataOsDir(dataDir, osId);
      if (!Fs.existsSync(dataOsDir)) Fs.mkdirSync(dataOsDir, { recursive: true });

      const dataString = JSON.stringify(data, null, 2);
      Fs.writeFileSync(`${dataOsDir}/window-chrome.json`, `${dataString}\n`);
    }
  }
}
