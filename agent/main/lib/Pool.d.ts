import { MitmProxy } from '@ulixee/unblocked-agent-mitm';
import IBrowserEngine from '@ulixee/unblocked-specification/agent/browser/IBrowserEngine';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { ICertificateStore } from '@ulixee/unblocked-agent-mitm/interfaces/ICertificateGenerator';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IBrowserUserConfig from '@ulixee/unblocked-specification/agent/browser/IBrowserUserConfig';
import { IHooksProvider } from '@ulixee/unblocked-specification/agent/hooks/IHooks';
import { IUnblockedPluginClass, PluginConfigs } from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import Browser from './Browser';
import Agent, { IAgentCreateOptions } from './Agent';
interface ICreatePoolOptions {
    maxConcurrentAgents?: number;
    maxConcurrentAgentsPerBrowser?: number;
    certificateStore?: ICertificateStore;
    defaultBrowserEngine?: IBrowserEngine;
    plugins?: IUnblockedPluginClass[];
    pluginConfigs?: PluginConfigs;
    dataDir?: string;
    logger?: IBoundLog;
}
export default class Pool extends TypedEventEmitter<{
    'agent-created': {
        agent: Agent;
    };
    'browser-launched': {
        browser: Browser;
    };
    'browser-has-no-open-windows': {
        browser: Browser;
    };
    'all-browsers-closed': void;
}> {
    #private;
    readonly options: ICreatePoolOptions;
    get hasAvailability(): boolean;
    get activeAgentsCount(): number;
    maxConcurrentAgents: number;
    maxConcurrentAgentsPerBrowser: number;
    readonly browsersById: Map<string, Browser>;
    readonly agentsById: Map<string, Agent>;
    sharedMitmProxy: MitmProxy;
    plugins: IUnblockedPluginClass[];
    pluginConfigs: PluginConfigs;
    protected logger: IBoundLog;
    private readonly agentsByBrowserId;
    private readonly browserIdByAgentId;
    private isClosing;
    private mitmStartPromise;
    private browserCreationQueue;
    private events;
    private certificateGenerator;
    constructor(options?: ICreatePoolOptions);
    start(): Promise<void>;
    createAgent(options?: IAgentCreateOptions): Agent;
    waitForAvailability(agent: Agent): Promise<void>;
    createMitmProxy(): Promise<MitmProxy>;
    getBrowser(engine: IBrowserEngine, agentId: string, hooks: IHooksProvider & {
        profile?: IEmulationProfile;
    }, launchArgs?: IBrowserUserConfig): Promise<Browser>;
    close(): Promise<void>;
    protected registerActiveAgent(agent: Agent): void;
    private onSession;
    private onAgentClosed;
    private startSharedMitm;
    private onBrowserClosed;
    private watchForContextPagesClosed;
    private checkForInactiveBrowserEngine;
}
export {};
