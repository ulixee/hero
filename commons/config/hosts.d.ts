import { TypedEventEmitter } from '../lib/eventUtils';
export default class UlixeeHostsConfig extends TypedEventEmitter<{
    change: void;
}> {
    #private;
    readonly directoryPath: string;
    static get global(): UlixeeHostsConfig;
    hostByVersion: IUlixeeHostsConfig['hostByVersion'];
    private get configPath();
    constructor(directoryPath: string);
    setVersionHost(version: string, host: string): void;
    hasHosts(): boolean;
    getVersionHost(version: string): string;
    checkLocalVersionHost(version: string, host: string): Promise<string>;
    private reload;
    private save;
}
export interface IUlixeeHostsConfig {
    hostByVersion: {
        [version: string]: IUlixeeHostConfig;
    };
}
export interface IUlixeeHostConfig {
    host: string;
    nodePath: string;
    cloudModulePath: string;
}
