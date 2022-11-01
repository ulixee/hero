import * as Fs from 'fs';
import BrowserProfiler from '@ulixee/unblocked-browser-profiler';
import IProfile from '@double-agent/collect-tls-clienthello/interfaces/IProfile';
import Config from './Config';
import EmulatorData from '../EmulatorData';

export default class ClienthelloJson {
  private readonly browserId: string;
  private readonly dataByOsId: { [osId: string]: any } = {};

  constructor(config: Config, userAgentIds: string[]) {
    for (const userAgentId of userAgentIds) {
      const profile = BrowserProfiler.getProfile<IProfile>('tls-clienthello', userAgentId);
      const { browserId, operatingSystemId } =
        BrowserProfiler.extractMetaFromUserAgentId(userAgentId);
      const { version, ciphers, compressionMethods, extensions } = profile.data.clientHello;
      this.browserId = browserId;
      this.dataByOsId[operatingSystemId] = { version, ciphers, compressionMethods, extensions };
    }
  }

  public save(dataDir: string): void {
    for (const [osId, data] of Object.entries(this.dataByOsId)) {
      const dataOsDir = EmulatorData.getEmulatorDataOsDir(dataDir, osId);
      if (!Fs.existsSync(dataOsDir)) Fs.mkdirSync(dataOsDir, { recursive: true });

      const dataString = JSON.stringify(data, null, 2);
      Fs.writeFileSync(`${dataOsDir}/clienthello.json`, `${dataString}\n`);
    }
  }
}
