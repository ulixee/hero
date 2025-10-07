import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import ICorePlugin, { ISessionSummary } from '@ulixee/hero-interfaces/ICorePlugin';
import ICorePluginCreateOptions from '@ulixee/hero-interfaces/ICorePluginCreateOptions';
import IBrowserEngine from '@ulixee/unblocked-specification/agent/browser/IBrowserEngine';
import ICorePlugins from '@ulixee/hero-interfaces/ICorePlugins';
export default class CorePlugin implements ICorePlugin {
    static id: string;
    static type: "CorePlugin";
    readonly id: string;
    readonly sessionSummary: ISessionSummary;
    protected readonly browserEngine: IBrowserEngine;
    protected readonly plugins: ICorePlugins;
    protected readonly logger: IBoundLog;
    constructor({ emulationProfile, corePlugins, logger, sessionSummary }: ICorePluginCreateOptions);
}
