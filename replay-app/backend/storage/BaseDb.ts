import * as Fs from 'fs';
import { app } from 'electron';

export default abstract class BaseDb<T> {
  protected readonly allData: T;
  private readonly path: string;

  protected constructor(readonly tableName: string, defaultData: T) {
    const dbDir = app.getPath('userData');
    this.path = `${dbDir}/${tableName}.json`;
    if (Fs.existsSync(this.path)) {
      this.allData = JSON.parse(Fs.readFileSync(this.path, 'utf-8'));
    } else {
      this.allData = defaultData;
      this.persist();
    }
    console.log(`Loaded ${tableName} DB: ${this.path}`);
  }

  public persist() {
    // don't overwrite existing file in case we bail half way through
    Fs.writeFileSync(`${this.path}.tmp`, JSON.stringify(this.allData, null, 2));
    Fs.renameSync(`${this.path}.tmp`, this.path);
  }
}
