import Plugin from '@double-agent/collect/lib/Plugin';
import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
export default class HttpHeadersPlugin extends Plugin {
    initialize(): void;
    sendDocument(ctx: IRequestContext): void;
    savePreflightHeaders(ctx: IRequestContext): void;
    saveHeadersAndSendAsset(ctx: IRequestContext): void;
}
