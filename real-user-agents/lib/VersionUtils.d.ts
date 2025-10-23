export declare function findClosestVersionMatch(versionToMatch: string, versions: string[]): string;
export declare function getClosestNumberMatch(numToMatch: number, nums: number[]): number;
export declare function convertVersionsToTree(versions: string[]): IVersionTree;
export interface IVersionTree {
    [major: number]: {
        [minor: number]: number[];
    };
}
