export default class UlixeeConfig {
    readonly directoryPath: string;
    static get global(): UlixeeConfig;
    static isCacheEnabled: boolean;
    private static globalConfigDirectory;
    private static globalConfig;
    private static configDirectoryName;
    private static cachedConfigLocations;
    private static cachedConfigObjects;
    datastoreOutDir?: string;
    private get configPath();
    constructor(directoryPath: string);
    save(): Promise<void>;
    private getData;
    static load(runtimeLocation?: IRuntimeLocation): UlixeeConfig;
    static findConfigDirectory(runtimeLocation?: IRuntimeLocation, defaultToGlobal?: boolean): string;
    private static useRuntimeLocationDefaults;
    private static getLocationKey;
    private static traverseDirectories;
    private static hasConfigDirectory;
}
export interface IUlixeeConfig {
    datastoreOutDir?: string;
}
export interface IRuntimeLocation {
    workingDirectory: string;
    entrypoint: string;
}
