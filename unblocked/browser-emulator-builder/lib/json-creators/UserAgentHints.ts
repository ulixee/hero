import * as Fs from 'fs';
import BrowserProfiler from '@unblocked-web/browser-profiler';
import type IProfile from '@double-agent/collect-http-ua-hints/interfaces/IProfile';
import Config from './Config';
import EmulatorData from '../EmulatorData';

export default class UserAgentHintsJson {
  private readonly browserId: string;
  private readonly dataByOsId: { [osId: string]: any } = {};

  constructor(config: Config, userAgentIds: string[]) {
    for (const userAgentId of userAgentIds) {
      const { browserId, operatingSystemId } =
        BrowserProfiler.extractMetaFromUserAgentId(userAgentId);
      const profile = BrowserProfiler.getProfile<IProfile>('http-ua-hints', userAgentId);
      this.browserId = browserId;
      this.dataByOsId[operatingSystemId] = profile.data;
    }
  }

  public save(dataDir: string): void {
    for (const [osId, data] of Object.entries(this.dataByOsId)) {
      const dataOsDir = EmulatorData.getEmulatorDataOsDir(dataDir, osId);
      if (!Fs.existsSync(dataOsDir)) Fs.mkdirSync(dataOsDir, { recursive: true });

      const dataString = JSON.stringify({ voices: data }, null, 2);
      Fs.writeFileSync(`${dataOsDir}/userAgentData.json`, `${dataString}`);
    }
  }
}
