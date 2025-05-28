import ISourceCodeLocation from '../interfaces/ISourceCodeLocation';
export default class Callsite {
    static getEntrypoint(): string;
    static getSourceCodeLocation(priorToFilename?: string, endFilename?: string): ISourceCodeLocation[];
    private static customStacktrace;
}
