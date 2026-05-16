import IRequestContext from '../interfaces/IRequestContext';
import { DomainType } from './DomainUtils';
export default class Document {
    static clickElementSelector: string;
    static waitForElementSelector: string;
    private headTags;
    private bodyTags;
    private footerTags;
    private clickToNextPage;
    private ctx;
    constructor(ctx: IRequestContext);
    get html(): string;
    injectBodyTag(tag: string): void;
    injectHeadTag(tag: string): void;
    injectFooterTag(tag: string): void;
    addNextPageClick(): void;
    get clickElementId(): string;
    send(): void;
    redirectTo(location: string, domainType: DomainType): void;
    private generateHtml;
}
