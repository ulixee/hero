import Plugin from '@double-agent/collect/lib/Plugin';
import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
export default class HttpHeadersPlugin extends Plugin {
    initialize(): void;
    start(ctx: IRequestContext): void;
    onConnection(ctx: IRequestContext): void;
}
