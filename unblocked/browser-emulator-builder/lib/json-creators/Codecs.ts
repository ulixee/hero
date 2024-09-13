import * as Fs from 'fs';
import BrowserProfiler from '@ulixee/unblocked-browser-profiler';
import ICodecProfile from '@double-agent/collect-browser-codecs/interfaces/IProfile';
import Config from './Config';
import EmulatorData from '../EmulatorData';

export default class CodecsJson {
  private readonly browserId: string;
  private readonly dataByOsId: { [osId: string]: any } = {};

  constructor(config: Config, userAgentIds: string[]) {
    for (const userAgentId of userAgentIds) {
      const { browserId, operatingSystemId } = BrowserProfiler.extractMetaFromUserAgentId(userAgentId);
      const codecProfile = BrowserProfiler.getProfile<ICodecProfile>('browser-codecs', userAgentId);
      this.browserId = browserId;
      this.dataByOsId[operatingSystemId] = codecProfile.data;
    }
  }

  public save(dataDir: string): void {
    for (const [osId, data] of Object.entries(this.dataByOsId)) {
      const dataOsDir = EmulatorData.getEmulatorDataOsDir(dataDir, osId);
      if (!Fs.existsSync(dataOsDir)) Fs.mkdirSync(dataOsDir, { recursive: true });

      const dataString = JSON.stringify(data, null, 2);
      Fs.writeFileSync(`${dataOsDir}/codecs.json`, `${dataString}`);
    }
  }
}
