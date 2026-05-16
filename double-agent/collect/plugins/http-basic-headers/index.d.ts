import Plugin from '@double-agent/collect/lib/Plugin';
import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
export default class HttpHeadersPlugin extends Plugin {
    initialize(): void;
    linkToNextPage(ctx: IRequestContext): void;
    showGotoNextPage(ctx: IRequestContext): void;
    saveAndLinkToNextPage(ctx: IRequestContext): void;
    saveAndPostToNextPage(ctx: IRequestContext): void;
    saveSetCookiesAndLinkToNextPage(ctx: IRequestContext): void;
    cleanCookiesAndLinkToNextPage(ctx: IRequestContext): void;
    saveAndRedirectToNextPage(ctx: IRequestContext): void;
    saveAndUseJsToLoadNextPage(ctx: IRequestContext): void;
}
