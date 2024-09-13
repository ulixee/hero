import * as Fs from 'fs';
import BrowserProfiler from '@ulixee/unblocked-browser-profiler';
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
      if (!profile) continue;
      this.browserId = browserId;
      this.dataByOsId[operatingSystemId] = profile.data;
    }
  }

  public save(dataDir: string): void {
    for (const [osId, data] of Object.entries(this.dataByOsId)) {
      const dataOsDir = EmulatorData.getEmulatorDataOsDir(dataDir, osId);
      if (!Fs.existsSync(dataOsDir)) Fs.mkdirSync(dataOsDir, { recursive: true });

      const tested = new Set(data.testedHeaders);
      const documentHeaders: Record<string, string> = {};
      for (const doc of data.headers) {
        for (const [header, value] of doc.rawHeaders) {
          if (tested.has(header.toLowerCase())) {
            documentHeaders[header] = value;
          }
        }
      }

      const dataString = JSON.stringify(
        { jsHighEntropyHints: data.jsHighEntropyHints, documentHeaders },
        null,
        2,
      );
      Fs.writeFileSync(`${dataOsDir}/user-agent-hints.json`, `${dataString}`);
    }
  }
}
