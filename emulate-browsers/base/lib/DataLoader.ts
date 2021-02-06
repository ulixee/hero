import * as Fs from 'fs';

export default class DataLoader {
  private readonly dataDir: string;
  private readonly type: string;
  private dataMap: { [operatingSystemId: string]: any } = {};

  constructor(dataDir: string, type: string) {
    this.dataDir = dataDir;
    this.type = type;
  }

  public get(operatingSystemId: string) {
    if (!this.dataMap[operatingSystemId]) {
      const path = `${this.dataDir}/as-${operatingSystemId}/${this.type}.json`;
      const data = JSON.parse(Fs.readFileSync(path, 'utf8'));
      this.dataMap[operatingSystemId] = data;
    }
    return this.dataMap[operatingSystemId];
  }
}
