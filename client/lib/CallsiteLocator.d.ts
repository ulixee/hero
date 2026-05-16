import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';
export default class CallsiteLocator {
    readonly entrypoint: string;
    static readonly ignoreModulePaths: string[];
    static readonly ignoreModulePathFragments: string[];
    constructor(entrypoint?: string);
    getCurrent(): ISourceCodeLocation[];
}
