// LOAD DATA
import { readFileSync } from 'fs';
import Browser from './Browser';
import { getDataFilePath } from './paths';

export default class Browsers {
  public static filePath = getDataFilePath('browsersById.json');

  private static internalById: IBrowserById;

  public static all(): Browser[] {
    return Object.values(this.getById());
  }

  public static byId(id: string): Browser {
    return this.getById()[id];
  }

  private static getById(): IBrowserById {
    if (!this.internalById) {
      this.internalById = JSON.parse(readFileSync(this.filePath, 'utf8'));
      for (const [id, value] of Object.entries(this.internalById)) {
        this.internalById[id] = Browser.load(value);
      }
    }
    return this.internalById;
  }
}

interface IBrowserById {
  [id: string]: Browser;
}
