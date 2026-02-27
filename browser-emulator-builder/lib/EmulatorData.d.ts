export default class EmulatorData {
    static get emulatorsDirPath(): string;
    static getEmulatorDir(browserId: string): string;
    static getEmulatorDataOsDir(baseDataDir: string, operatingSystemId: string): string;
    static extractBrowserEngineId(browserId: string): string;
}
