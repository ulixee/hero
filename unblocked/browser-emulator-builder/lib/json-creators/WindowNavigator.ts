import * as Fs from 'fs';
import BrowserProfiler from '@unblocked-web/browser-profiler';
import IDomProfile from '@double-agent/collect-browser-dom-environment/interfaces/IProfile';
import Config from './Config';
import EmulatorData from '../EmulatorData';

export default class WindowNavigatorJson {
  private readonly dataByOsId: { [osId: string]: any } = {};
  private readonly browserId: string;

  constructor(config: Config, userAgentIds: string[]) {
    this.browserId = config.browserId;

    for (const userAgentId of userAgentIds) {
      const profile = BrowserProfiler.getProfile<IDomProfile>('browser-dom-environment', userAgentId);
      const { operatingSystemId } = BrowserProfiler.extractMetaFromUserAgentId(userAgentId);
      const window = (profile.data as any).https.window;

      if (window.navigator) {
        this.dataByOsId[operatingSystemId] = { navigator: window.navigator };
      }
    }
  }

  public save(dataDir: string): void {
    for (const [osId, data] of Object.entries(this.dataByOsId)) {
      const dataOsDir = EmulatorData.getEmulatorDataOsDir(dataDir, osId);
      if (!Fs.existsSync(dataOsDir)) Fs.mkdirSync(dataOsDir, { recursive: true });

      const dataString = JSON.stringify(data, null, 2);
      Fs.writeFileSync(`${dataOsDir}/window-navigator.json`, `${dataString}\n`);
    }
  }
}
