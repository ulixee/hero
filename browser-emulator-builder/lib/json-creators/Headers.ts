import * as Fs from 'fs';
import BrowserProfiler from '@ulixee/unblocked-browser-profiler';
import IBasicHeadersProfile from '@double-agent/collect-http-basic-headers/interfaces/IProfile';
import {
  isOfficialDefaultValueKey,
  isOfficialHeader,
} from '@double-agent/analyze/lib/headers/Utils';
import IHeaderDataPage from '@double-agent/collect/interfaces/IHeaderDataPage';
import Config from './Config';

export default class HeadersJson {
  private readonly browserId: string;
  private data: {
    [protocol: string]: {
      [resource: string]: {
        originTypes: string[];
        method: string;
        isRedirect: boolean;
        order: string[];
        defaults: { [header: string]: string[] };
      }[];
    };
  } = {};

  constructor(config: Config, userAgentIds: string[]) {
    this.browserId = config.browserId;

    for (const userAgentId of userAgentIds) {
      const profile = BrowserProfiler.getProfile<IBasicHeadersProfile>('http-basic-headers', userAgentId);
      this.processResources(profile.data);

      const ws = BrowserProfiler.getProfile('http-websockets', userAgentId);
      this.processResources(ws.data);

      const xhr = BrowserProfiler.getProfile('http-xhr', userAgentId);
      this.processResources(xhr.data);

      const assets = BrowserProfiler.getProfile('http-assets', userAgentId);
      this.processResources(assets.data);
    }
  }

  public save(dataDir: string): void {
    if (!Fs.existsSync(dataDir)) Fs.mkdirSync(dataDir, { recursive: true });

    const dataString = JSON.stringify(this.data, null, 2);
    Fs.writeFileSync(`${dataDir}/headers.json`, `${dataString}\n`);
  }

  private processResources(data: IHeaderDataPage[]): void {
    for (const entry of data) {
      const defaultKeys = entry.rawHeaders
        .filter(x => isOfficialHeader(x[0].toLowerCase()))
        .map(x => x[0]);
      const { resourceType, protocol } = entry;
      if (!this.data[protocol]) this.data[protocol] = {};

      const protocolResources = this.data[protocol];
      if (!protocolResources[resourceType]) protocolResources[resourceType] = [];

      const resourceList = protocolResources[resourceType];

      const defaults = {};
      for (const key of defaultKeys) {
        if (isOfficialDefaultValueKey(key)) {
          const rawHeader = entry.rawHeaders.find(x => x[0] === key);
          if (rawHeader) {
            defaults[key] = defaults[key] || [];
            defaults[key].push(rawHeader[1]);
          }
        }
      }

      const existing = resourceList.find(
        x => x.method === entry.method && x.isRedirect === entry.isRedirect && x.order.toString() === defaultKeys.toString(),
      );

      if (!existing) {
        resourceList.push({
          originTypes: [entry.originType],
          method: entry.method,
          isRedirect: entry.isRedirect,
          order: defaultKeys,
          defaults,
        });
      } else {
        if (!existing.originTypes.includes(entry.originType)) {
          existing.originTypes.push(entry.originType);
        }

        for (const [key, value] of Object.entries(defaults)) {
          if (!existing.defaults[key]) existing.defaults[key] = [];
          if (!existing.defaults[key].includes(value[0])) {
            existing.defaults[key].push(value[0]);
          }
        }
      }
    }
  }
}
