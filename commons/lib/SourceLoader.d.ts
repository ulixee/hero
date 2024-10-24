import ISourceCodeLocation from '../interfaces/ISourceCodeLocation';
export default class SourceLoader {
    private static sourceLines;
    private static fileContentsCache;
    static resetCache(): void;
    static clearFileCache(filepath: string): void;
    static getSource(codeLocation: ISourceCodeLocation): ISourceCodeLocation & {
        code: string;
    };
    static getSourceLines(codeLocation: ISourceCodeLocation): string[];
    static getFileContents(filepath: string, cache?: boolean): string;
    static setFileContents(filepath: string, data: string): void;
}
