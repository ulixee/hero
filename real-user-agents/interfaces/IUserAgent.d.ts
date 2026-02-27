import IOperatingSystemVersion from './IOperatingSystemVersion';
export default interface IUserAgent {
    id: string;
    pattern: string;
    browserBaseVersion: [major: number, minor: number, build: number, patch?: number];
    stablePatchVersions: number[];
    allPatchVersions: number[];
    operatingSystemVersion: IOperatingSystemVersion;
    uaClientHintsPlatformVersions: string[];
    operatingSystemId: string;
    browserId: string;
    marketshare: number;
}
