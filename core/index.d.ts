import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ICoreConfigureOptions from '@ulixee/hero-interfaces/ICoreConfigureOptions';
import { ICorePluginClass } from '@ulixee/hero-interfaces/ICorePlugin';
import { IPluginClass } from '@ulixee/hero-interfaces/IPlugin';
import ITransport from '@ulixee/net/interfaces/ITransport';
import BrowserContext from '@ulixee/unblocked-agent/lib/BrowserContext';
import Pool from '@ulixee/unblocked-agent/lib/Pool';
import { LocationTrigger } from '@ulixee/unblocked-specification/agent/browser/Location';
import { IUnblockedPluginClass } from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
import ConnectionToHeroClient from './connections/ConnectionToHeroClient';
import ISessionRegistry from './interfaces/ISessionRegistry';
import Session from './lib/Session';
import Tab from './lib/Tab';
export { Tab, Session, LocationTrigger };
export type THeroCoreEvents = Pick<Pool['EventTypes'], 'browser-has-no-open-windows' | 'browser-launched' | 'all-browsers-closed'>;
export default class HeroCore extends TypedEventEmitter<THeroCoreEvents & {
    close: void;
}> {
    readonly options: ICoreConfigureOptions;
    static allowDynamicPluginLoading: boolean;
    static defaultCorePluginsById: {
        [id: string]: ICorePluginClass;
    };
    static events: TypedEventEmitter<THeroCoreEvents>;
    static defaultUnblockedPlugins: IUnblockedPluginClass[];
    static onShutdown: () => void;
    static dataDir: string;
    static instances: HeroCore[];
    private static didRegisterSignals;
    private static idCounter;
    private static isShuttingDown;
    get defaultUnblockedPlugins(): IUnblockedPluginClass[];
    set defaultUnblockedPlugins(value: IUnblockedPluginClass[]);
    get dataDir(): string;
    sessionRegistry: ISessionRegistry;
    readonly connections: Set<ConnectionToHeroClient>;
    corePluginsById: {
        [id: string]: ICorePluginClass;
    };
    readonly pool: Pool;
    id: number;
    isClosing: Promise<void>;
    clearIdleConnectionsAfterMillis: number;
    private isStarting;
    private networkDb;
    private utilityBrowserContext;
    constructor(options?: ICoreConfigureOptions);
    addConnection(transportToClient?: ITransport): ConnectionToHeroClient;
    getUtilityContext(): Promise<BrowserContext>;
    start(): Promise<void>;
    close(): Promise<void>;
    use(PluginObject: string | ICorePluginClass | {
        [name: string]: IPluginClass;
    }): void;
    static start(options?: ICoreConfigureOptions): Promise<HeroCore>;
    static addConnection(transportToClient?: ITransport): ConnectionToHeroClient;
    static shutdown(): Promise<any>;
    static use(PluginObject: string | ICorePluginClass | {
        [name: string]: IPluginClass;
    }): void;
    private static registerSignals;
}
