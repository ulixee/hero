import { TraceMap } from '@jridgewell/trace-mapping';
import ISourceCodeLocation from '../interfaces/ISourceCodeLocation';
export declare class SourceMapSupport {
    private static sourceMapCache;
    private static resolvedPathCache;
    private static cacheKeys;
    private static stackPathsToClear;
    static clearStackPath(stackPath: string): void;
    static resetCache(): void;
    static clearCache(filepath: string): void;
    static install(): void;
    static getSourceFile(filename: string): {
        path: string;
        content?: string;
    };
    static getOriginalSourcePosition(position: ISourceCodeLocation, includeContent?: boolean): ISourceCodeLocation & {
        name?: string;
        content?: string;
    };
    static retrieveSourceMap(source: string, overrideSourceRoot?: string): {
        url: string;
        map: TraceMap;
        rawMap: any;
    };
    static getCacheKey(pathOrFileUrl: any): string;
    private static resolvePath;
    private static prepareStackTrace;
}
