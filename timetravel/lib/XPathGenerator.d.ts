import DomNode from './DomNode';
import { IDomFrameContext } from './DomRebuilder';
export default class XPathGenerator {
    readonly domContext: IDomFrameContext;
    constructor(domContext: IDomFrameContext);
    getTagPath(domNode: DomNode, includeLastTagIndex?: boolean): string;
    count(path: string): string;
    countTagsWithText(tag: string, text: string): string;
    textContent(path: string): string;
    attributeSelector(basePath: string, domNode: DomNode): string;
    getIdPath(domNode: DomNode): string;
    private getNodeRelativePath;
    static createEvaluateExpression(xpaths: string[]): string;
}
