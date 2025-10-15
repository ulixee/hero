import IBridgeType from '../interfaces/IBridgeType';
export declare function extractDirGroupsMap(bridge: [IBridgeType, IBridgeType], baseDir: string): {
    [name: string]: {
        [key: string]: string;
    };
};
export declare function pathIsPatternMatch(path: string, pattern: string): boolean;
