import IStableChromeVersion from '../interfaces/IStableChromeVersion';
export default function loadData(): Promise<IRealUserAgentsData>;
export interface IRealUserAgentsData {
    userAgents: {
        id: string;
        string: string;
        osId: string;
    }[];
    chromiumBuildVersions: string[];
    stableChromeVersions: IStableChromeVersion[];
    windowsPlatformVersions: {
        [osId: string]: string;
    };
    browserReleaseDates: IReleaseDates;
    browserDescriptions: {
        [name: string]: string;
    };
    osReleaseDates: IReleaseDates;
    osDescriptions: {
        [name: string]: string;
    };
    marketshare: {
        byOsId: {
            [osId: string]: number;
        };
        byBrowserId: {
            [browserId: string]: number;
        };
    };
    darwinToMacOsVersionMap: {
        [version: string]: string;
    };
    macOsNameToVersionMap: {
        [name: string]: string;
    };
    macOsVersionAliasMap: {
        [version: string]: string;
    };
    winOsNameToVersionMap: {
        [name: string]: string;
    };
    windowsToWindowsVersionMap: {
        [version: string]: string;
    };
}
export interface IReleaseDates {
    [key: string]: string;
}
export interface IStatcounterMarketshare {
    fromMonthYear: string;
    toMonthYear: string;
    lastModified: string;
    results: {
        [key: string]: [lastMonth: string, thisMonth: string];
    };
}
