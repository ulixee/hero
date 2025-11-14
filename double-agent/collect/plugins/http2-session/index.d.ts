import Plugin from '@double-agent/collect/lib/Plugin';
import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
export default class Http2SessionPlugin extends Plugin {
    initialize(): void;
    load(ctx: IRequestContext): Promise<void>;
    wait(ctx: IRequestContext): Promise<void>;
    private saveSessions;
}
