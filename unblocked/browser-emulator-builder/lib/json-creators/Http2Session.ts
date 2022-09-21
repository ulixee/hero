import * as Fs from 'fs';
import BrowserProfiler from '@unblocked-web/browser-profiler';
import type IHttp2SessionProfile from '@double-agent/collect-http2-session/interfaces/IProfile';
import Config from './Config';
import EmulatorData from '../EmulatorData';

export default class Http2SessionJson {
  private readonly browserId: string;
  private readonly dataByOsId: { [osId: string]: any } = {};

  constructor(config: Config, userAgentIds: string[]) {
    for (const userAgentId of userAgentIds) {
      const { browserId, operatingSystemId } = BrowserProfiler.extractMetaFromUserAgentId(userAgentId);
      const profile = BrowserProfiler.getProfile<IHttp2SessionProfile>('http2-session', userAgentId);
      this.browserId = browserId;
      let settings: object;
      let ping: string;
      let initialWindowSize: number;
      let firstFrameWindowSize: number;
      for (const session of profile.data.sessions) {
        for (const activity of session.activity) {
          if (activity.type === 'ping') ping = activity.data;
          if (activity.type === 'remoteSettings') settings = activity.data.settings;
          if (activity.data?.remoteWindowSize && !initialWindowSize) {
            initialWindowSize = activity.data.remoteWindowSize;
          }
          if (!firstFrameWindowSize && activity.type === 'stream') {
            firstFrameWindowSize = activity.data.remoteWindowSize;
          }
        }
      }
      this.dataByOsId[operatingSystemId] = {
        settings,
        ping,
        initialWindowSize,
        firstFrameWindowSize,
      };
    }
  }

  public save(dataDir: string): void {
    for (const [osId, data] of Object.entries(this.dataByOsId)) {
      const dataOsDir = EmulatorData.getEmulatorDataOsDir(dataDir, osId);
      if (!Fs.existsSync(dataOsDir)) Fs.mkdirSync(dataOsDir, { recursive: true });

      const dataString = JSON.stringify(data, null, 2);
      Fs.writeFileSync(`${dataOsDir}/http2-session.json`, `${dataString}`);
    }
  }
}
