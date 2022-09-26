import * as Fs from 'fs';
import BrowserProfiler from '@unblocked-web/browser-profiler';
import RealUserAgents from '@unblocked-web/real-user-agents';
import { IProfileDataByProtocol } from '@double-agent/collect-browser-dom-environment/interfaces/IProfile';
import IBaseProfile from '@double-agent/collect/interfaces/IBaseProfile';

interface IUserAgentOption {
  browserName: string;
  browserVersion: IVersion;
  operatingSystemName: string;
  operatingSystemVersion: IVersion;
  operatingSystemPlatform: string;
  strings: string[];
}

interface IVersion {
  major: string;
  minor: string;
  patch?: string;
}

export default class UserAgentOptionsJson {
  private byUserAgentId: { [id: string]: IUserAgentOption } = {};

  public add(browserId: string, browserEngineId: string, userAgentIds: string[]): void {
    for (const userAgentId of userAgentIds) {
      const { operatingSystemId } = BrowserProfiler.extractMetaFromUserAgentId(userAgentId);
      const profile = BrowserProfiler.getProfile<IBaseProfile<IProfileDataByProtocol>>(
        'browser-dom-environment',
        userAgentId,
      );
      const window = profile.data.https.window;
      const operatingSystemPlatform = window.navigator.platform._$value;
      for (const userAgent of RealUserAgents.where({ browserId, operatingSystemId })) {
        for (const userAgentString of userAgent.strings) {
          this.byUserAgentId[userAgentId] ??= {
            browserName: userAgent.browser.name.toLowerCase().replace(/[^a-z]+/, '-'),
            browserVersion: userAgent.browser.version,
            operatingSystemPlatform,
            operatingSystemName: userAgent.operatingSystem.name
              .toLowerCase()
              .replace(/[^a-z]+/, '-'),
            operatingSystemVersion: userAgent.operatingSystem.version,
            strings: [],
          };
          if (!this.byUserAgentId[userAgentId].strings.includes(userAgentString)) {
            this.byUserAgentId[userAgentId].strings.push(userAgentString);
          }
        }
      }
    }
  }

  public save(dataDir: string): void {
    const userAgentOptions = Object.values(this.byUserAgentId);

    if (!Fs.existsSync(dataDir)) Fs.mkdirSync(dataDir, { recursive: true });
    const dataString = JSON.stringify(userAgentOptions, null, 2);
    Fs.writeFileSync(`${dataDir}/userAgentOptions.json`, `${dataString}\n`);
  }
}
