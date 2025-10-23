import Resolvable from '@ulixee/commons/lib/Resolvable';
import { ILifecycleEvents, INavigationLoader } from '@ulixee/unblocked-specification/agent/browser/IFrame';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
export declare class NavigationLoader {
    readonly id: string;
    get isNavigationComplete(): boolean;
    readonly lifecycle: ILifecycleEvents;
    navigationResolver: Resolvable<string | Error>;
    url: string;
    private afterStoppedLoadingTimeout;
    private logger;
    constructor(id: string, logger: IBoundLog);
    setNavigationResult(result?: Error | string): void;
    clearStoppedLoading(): void;
    onStoppedLoading(): void;
    onLifecycleEvent(name: string): void;
    markLoaded(): void;
    toJSON(): INavigationLoader;
}
