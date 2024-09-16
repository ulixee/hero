import { emulatorDataDir } from '../paths';

export default class EmulatorData {
  public static get emulatorsDirPath(): string {
    return emulatorDataDir;
  }

  public static getEmulatorDir(browserId: string): string {
    const emulatorId = this.extractBrowserEngineId(browserId);
    return `${this.emulatorsDirPath}/as-${emulatorId}`;
  }

  public static getEmulatorDataOsDir(baseDataDir: string, operatingSystemId: string): string {
    return `${baseDataDir}/as-${operatingSystemId}`;
  }

  public static extractBrowserEngineId(browserId: string): string {
    return browserId.replace('chromium', 'chrome');
  }
}
