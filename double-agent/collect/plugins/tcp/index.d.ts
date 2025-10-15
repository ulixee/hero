import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import Plugin from '@double-agent/collect/lib/Plugin';
export default class TcpPlugin extends Plugin {
    private tracker;
    initialize(): void;
    extractData(ctx: IRequestContext): Promise<void>;
}
