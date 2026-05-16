import Plugin from '@double-agent/collect/lib/Plugin';
import IRequestTlsContext from '@double-agent/collect/interfaces/IRequestTlsContext';
export default class TlsClienthelloPlugin extends Plugin {
    initialize(): void;
    save(ctx: IRequestTlsContext): Promise<void>;
}
