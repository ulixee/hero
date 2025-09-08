export = DomExtractor;
declare function DomExtractor(selfName: any, pageMeta?: {}): this;
declare class DomExtractor {
    constructor(selfName: any, pageMeta?: {});
    run: (obj: any, parentPath: any, extractKeys?: any[]) => Promise<string>;
    runAndSave: () => Promise<void>;
}
