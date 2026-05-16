import IUserAgent from '../interfaces/IUserAgent';
import IOperatingSystemVersion from '../interfaces/IOperatingSystemVersion';
export default class UserAgent implements IUserAgent {
    static filePath: string;
    static byId: IUserAgentsById;
    id: string;
    pattern: string;
    operatingSystemId: string;
    operatingSystemVersion: IOperatingSystemVersion;
    browserId: string;
    browserBaseVersion: [major: number, minor: number, patch: number, patch?: number];
    marketshare: number;
    stablePatchVersions: number[];
    allPatchVersions: number[];
    uaClientHintsPlatformVersions: string[];
    constructor(entry: IUserAgent);
    get browserName(): string;
    get operatingSystemName(): string;
    static parse(object: {
        pattern: string;
    }, patchVersion: number | string, osVersion: string): string;
    static load(object: IUserAgent): UserAgent;
    static all(): IUserAgentsById;
}
interface IUserAgentsById {
    [id: string]: UserAgent;
}
export {};
