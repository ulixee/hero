import * as browserstackIndicators from './data/path-patterns/browserstack-indicators.json';
import * as devtoolsIndicators from './data/path-patterns/devtools-indicators.json';
export declare function createUserAgentIdFromString(userAgentString: string): string;
export declare function createUserAgentIdFromIds(osId: string, browserId: string): string;
interface IProbeIdsMap {
    [pluginId: string]: {
        [checkSignature: string]: string;
    };
}
export default class Config {
    static userAgentIds: string[];
    static dataDir: string;
    static profilesDataDir: string;
    static collect: {
        port: number;
        domains: {
            MainDomain: string;
            SubDomain: string;
            TlsDomain: string;
            CrossDomain: string;
        };
        shouldGenerateProfiles: boolean;
        pluginStartingPort: number;
        pluginMaxPort: number;
        tcpNetworkDevice: string;
        tcpDebug: boolean;
        tlsPrintRaw: boolean;
        enableLetsEncrypt: boolean;
    };
    static runner: {
        assignmentsHost: string;
    };
    static readonly probesDataDir: string;
    static get probeIdsMap(): IProbeIdsMap;
    static get browserNames(): string[];
    static get osNames(): string[];
    static findUserAgentIdsByName(name: string): string[];
    static getProfilerIndicators(): typeof browserstackIndicators;
    static getDevtoolsIndicators(): typeof devtoolsIndicators;
    static isVariationPath(path: string): boolean;
    static shouldIgnorePathValue(path: string): boolean;
}
export declare function pathIsPatternMatch(path: string, pattern: string): boolean;
export {};
