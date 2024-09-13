import { readFileSync } from 'fs';
import OperatingSystem from './OperatingSystem';
import { getDataFilePath } from './paths';

export default class OperatingSystems {
  public static filePath = getDataFilePath('operatingSystemsById.json');
  private static internalById: IOperatingSystemById;

  public static all(): OperatingSystem[] {
    return Object.values(this.getById());
  }

  public static byId(id: string): OperatingSystem {
    return this.getById()[id];
  }

  private static getById(): IOperatingSystemById {
    if (!this.internalById) {
      this.internalById = JSON.parse(readFileSync(this.filePath, 'utf8'));
      for (const [id, value] of Object.entries(this.internalById)) {
        this.internalById[id] = OperatingSystem.load(value);
      }
    }
    return this.internalById;
  }
}

interface IOperatingSystemById {
  [id: string]: OperatingSystem;
}
