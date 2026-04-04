import IOperatingSystem from '../interfaces/IOperatingSystem';
import IOperatingSystemVersion from '../interfaces/IOperatingSystemVersion';
export declare function createOsName(name: string): string;
export declare function getOsNameFromId(osId: string): string;
export declare function getOsVersionFromOsId(osId: string): IOperatingSystemVersion;
export declare function createOsId(os: Pick<IOperatingSystem, 'name' | 'version'>): string;
export declare function createOsIdFromUserAgentString(userAgentString: string): string;
export declare function createOsVersion(osName: string, majorVersionOrVersionString: string, minorVersion: string): IOperatingSystemVersion;
export declare function convertMacOsVersionString(versionString: string): string;
