import * as Fs from 'fs';

const ALL = 'ALL';

export default class AdvancedDataLoader {
  private readonly dataDir: string;
  private readonly type: string;
  private readonly isOsSpecific: boolean;
  private browserIds: string[];
  private dataMap: {
    [browserId: string]: {
      [operatingSystemId: string]: any
    }
  } = {};

  constructor(dataDir: string, type: string, isOsSpecific: boolean) {
    this.dataDir = dataDir;
    this.type = type;
    this.isOsSpecific = isOsSpecific;
  }

  public get all() {
    if (this.isOsSpecific) {
      throw new Error('Cannot call all() on OS-specific data.');
    }
    return this.getBrowserIds().map(browserId => this.get(browserId));
  }

  public get(browserId: string, operatingSystemId?: string) {
    this.dataMap[browserId] = this.dataMap[browserId] || {};

    if (!this.dataMap[browserId][operatingSystemId || ALL]) {
      const path = this.getPath(browserId, operatingSystemId);
      const data = JSON.parse(Fs.readFileSync(path, 'utf8'));
      this.dataMap[browserId][operatingSystemId || ALL] = data;
    }

    return this.dataMap[browserId][operatingSystemId || ALL];
  }

  private getPath(browserId: string, operatingSystemId: string) {
    const name = browserId.match(/([a-z]+-[0-9]+)/)[1];
    let dirPath = `${this.dataDir}/${name}`;
    if (operatingSystemId) dirPath += `/as-${operatingSystemId}`;

    return `${dirPath}/${this.type}.json`;
  }

  private getBrowserIds() {
    if (!this.browserIds) {
      this.browserIds = Fs.readdirSync(this.dataDir)
        .filter(x => {
          return Fs.lstatSync(`${this.dataDir}/${x}`).isDirectory();
        })
        .map(x => `${x}-0`);
    }
    return this.browserIds;
  }
}
