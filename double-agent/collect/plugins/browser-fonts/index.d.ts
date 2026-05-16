import Plugin from '@double-agent/collect/lib/Plugin';
import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
export default class BrowserFontsPlugin extends Plugin {
    initialize(): void;
    loadScript(ctx: IRequestContext): Promise<void>;
    save(ctx: IRequestContext): Promise<void>;
}
