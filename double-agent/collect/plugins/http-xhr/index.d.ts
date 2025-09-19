import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import Plugin from '@double-agent/collect/lib/Plugin';
export default class HttpHeadersPlugin extends Plugin {
    initialize(): void;
    run(ctx: IRequestContext): void;
    savePreflightHeaders(ctx: IRequestContext): void;
    saveHeaders(ctx: IRequestContext): void;
    axiosJs({ res }: {
        res: any;
    }): void;
    axiosSourceMap({ res }: {
        res: any;
    }): void;
}
