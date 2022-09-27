import * as Fs from 'fs';
import BrowserProfiler from '@unblocked-web/browser-profiler';
import type IProfile from '@double-agent/collect-browser-speech/interfaces/IProfile';
import Config from './Config';
import EmulatorData from '../EmulatorData';

type IVoices = IProfile['data']['https']['voices'];

export default class SpeechSynthesisJson {
  private readonly browserId: string;
  private readonly dataByOsId: { [osId: string]: IVoices } = {};
  private readonly osDefaults: { [os: string]: IVoices } = {};

  constructor(config: Config, userAgentIds: string[]) {
    for (const userAgentId of userAgentIds) {
      const { browserId, operatingSystemId, operatingSystemName } =
        BrowserProfiler.extractMetaFromUserAgentId(userAgentId);
      const profile = BrowserProfiler.getProfile<IProfile>('browser-speech', userAgentId);
      this.browserId = browserId;
      const voices = profile.data.https.voices;
      if (voices?.length) {
        this.osDefaults[operatingSystemName] ??= voices;
      }
      this.dataByOsId[operatingSystemId] = profile.data.https.voices;
    }
  }

  public save(dataDir: string): void {
    for (const [osId, data] of Object.entries(this.dataByOsId)) {
      const dataOsDir = EmulatorData.getEmulatorDataOsDir(dataDir, osId);
      if (!Fs.existsSync(dataOsDir)) Fs.mkdirSync(dataOsDir, { recursive: true });

      const voices =
        data?.length > 0
          ? data
          : this.osDefaults[osId.startsWith('mac') ? 'mac-os' : 'windows'] ?? [];
      const dataString = JSON.stringify({ voices }, null, 2);
      Fs.writeFileSync(`${dataOsDir}/browser-speech.json`, `${dataString}`);
    }
  }
}
