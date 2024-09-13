import * as Fs from 'fs';
import BrowserProfiler from '@ulixee/unblocked-browser-profiler';
import type IProfile from '@double-agent/collect-browser-fonts/interfaces/IProfile';
import Config from './Config';
import EmulatorData from '../EmulatorData';

export default class FontsJson {
  private readonly browserId: string;

  private readonly dataByOsId: { [osId: string]: string[] } = {};

  constructor(config: Config, userAgentIds: string[]) {
    for (const userAgentId of userAgentIds) {
      const { browserId, operatingSystemId } =
        BrowserProfiler.extractMetaFromUserAgentId(userAgentId);
      const profile = BrowserProfiler.getProfile<IProfile>('browser-fonts', userAgentId);
      this.browserId = browserId;
      this.dataByOsId[operatingSystemId] = profile.data.fonts;
    }
  }

  public save(dataDir: string): void {
    for (const [osId, fonts] of Object.entries(this.dataByOsId)) {
      const dataOsDir = EmulatorData.getEmulatorDataOsDir(dataDir, osId);
      if (!Fs.existsSync(dataOsDir)) Fs.mkdirSync(dataOsDir, { recursive: true });

      const dataString = JSON.stringify({ fonts }, null, 2);
      Fs.writeFileSync(`${dataOsDir}/browser-fonts.json`, `${dataString}`);
    }
  }
}
