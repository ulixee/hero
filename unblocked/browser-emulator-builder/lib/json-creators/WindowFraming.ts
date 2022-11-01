import * as Fs from 'fs';
import BrowserProfiler from '@ulixee/unblocked-browser-profiler';
import IDomProfile from '@double-agent/collect-browser-dom-environment/interfaces/IProfile';
import Config from './Config';
import EmulatorData from '../EmulatorData';

export default class WindowFraming {
  private readonly data: IWindowFraming;
  private readonly dataByOsId: { [osId: string]: IWindowFraming } = {};
  private readonly browserId: string;

  constructor(config: Config, userAgentIds: string[]) {
    this.browserId = config.browserId;

    for (const userAgentId of userAgentIds) {
      const profile = BrowserProfiler.getProfile<IDomProfile>('browser-dom-environment', userAgentId);
      const { operatingSystemId } = BrowserProfiler.extractMetaFromUserAgentId(userAgentId);
      const window = (profile.data as any).https.window;
      const screenGapTop = Number(window.screen.availTop._$value);
      const screenGapLeft = Number(window.screen.availLeft._$value);
      const screenGapBottom =
        window.screen.height._$value - window.screen.availHeight._$value - screenGapTop;
      const screenGapRight =
        window.screen.width._$value - window.screen.availWidth._$value - screenGapLeft;
      const frameBorderWidth = window.outerWidth._$value - window.innerWidth._$value;
      const frameBorderHeight = window.outerHeight._$value - window.innerHeight._$value;

      const framing = {
        screenGapLeft,
        screenGapTop,
        screenGapRight,
        screenGapBottom,
        frameBorderWidth,
        frameBorderHeight,
      };

      const minimumFraming = this.data || { ...framing };

      if (framing.screenGapLeft > minimumFraming.screenGapLeft) {
        minimumFraming.screenGapLeft = framing.screenGapLeft;
      }
      if (framing.screenGapTop > minimumFraming.screenGapTop) {
        minimumFraming.screenGapTop = framing.screenGapTop;
      }
      if (framing.screenGapRight > minimumFraming.screenGapRight) {
        minimumFraming.screenGapRight = framing.screenGapRight;
      }
      if (framing.screenGapBottom > minimumFraming.screenGapBottom) {
        minimumFraming.screenGapBottom = framing.screenGapBottom;
      }
      if (framing.frameBorderWidth > minimumFraming.frameBorderWidth) {
        minimumFraming.frameBorderWidth = framing.frameBorderWidth;
      }
      if (framing.frameBorderHeight > minimumFraming.frameBorderHeight) {
        minimumFraming.frameBorderHeight = framing.frameBorderHeight;
      }

      this.data = minimumFraming;
      this.dataByOsId[operatingSystemId] = framing;
    }
  }

  public save(dataDir: string): void {
    for (const [osId, data] of Object.entries(this.dataByOsId)) {
      const dataOsDir = EmulatorData.getEmulatorDataOsDir(dataDir, osId);
      if (!Fs.existsSync(dataOsDir)) Fs.mkdirSync(dataOsDir, { recursive: true });
      Fs.writeFileSync(`${dataOsDir}/window-framing.json`, JSON.stringify(data, null, 2));
    }
    {
      if (!Fs.existsSync(dataDir)) Fs.mkdirSync(dataDir, { recursive: true });
      const dataString = JSON.stringify(this.data, null, 2);
      Fs.writeFileSync(`${dataDir}/window-base-framing.json`, `${dataString}\n`);
    }
  }
}

interface IWindowFraming {
  screenGapLeft: number;
  screenGapTop: number;
  screenGapRight: number;
  screenGapBottom: number;
  frameBorderWidth: number;
  frameBorderHeight: number;
}
