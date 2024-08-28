import Log from '@ulixee/commons/lib/Logger';
import { MitmProxy } from '@ulixee/unblocked-agent-mitm';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import IBrowserEngine from '@ulixee/unblocked-specification/agent/browser/IBrowserEngine';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Queue from '@ulixee/commons/lib/Queue';
import ICertificateGenerator, {
  ICertificateStore,
} from '@ulixee/unblocked-agent-mitm/interfaces/ICertificateGenerator';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import IBrowserUserConfig from '@ulixee/unblocked-specification/agent/browser/IBrowserUserConfig';
import IDevtoolsSession from '@ulixee/unblocked-specification/agent/browser/IDevtoolsSession';
import { IHooksProvider } from '@ulixee/unblocked-specification/agent/hooks/IHooks';
import {
  IUnblockedPluginClass,
  UnblockedPluginConfig,
} from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import IRegisteredEventListener from '@ulixee/commons/interfaces/IRegisteredEventListener';
import Browser from './Browser';
import Agent, { IAgentCreateOptions } from './Agent';
import env from '../env';

const { log } = Log(module);

interface ICreatePoolOptions {
  maxConcurrentAgents?: number;
  maxConcurrentAgentsPerBrowser?: number;
  certificateStore?: ICertificateStore;
  defaultBrowserEngine?: IBrowserEngine;
  plugins?: IUnblockedPluginClass[];
  pluginConfigs?: UnblockedPluginConfig;
  dataDir?: string;
  logger?: IBoundLog;
}

export default class Pool extends TypedEventEmitter<{
  'agent-created': { agent: Agent };
  'browser-launched': { browser: Browser };
  'browser-has-no-open-windows': { browser: Browser };
  'all-browsers-closed': void;
}> {
  public get hasAvailability(): boolean {
    return this.activeAgentsCount < this.maxConcurrentAgents;
  }

  public get activeAgentsCount(): number {
    return this.#activeAgentsCount;
  }

  public maxConcurrentAgents = 10;
  public maxConcurrentAgentsPerBrowser = 10;
  public readonly browsersById = new Map<string, Browser>();
  public readonly agentsById = new Map<string, Agent>();
  public sharedMitmProxy: MitmProxy;
  public plugins: IUnblockedPluginClass[] = [];
  public pluginConfigs: UnblockedPluginConfig = {};

  #activeAgentsCount = 0;
  #waitingForAvailability: {
    agent: Agent;
    promise: IResolvablePromise<void>;
  }[] = [];

  protected logger: IBoundLog;
  private readonly agentsByBrowserId: { [browserId: string]: number } = {};
  private readonly browserIdByAgentId: { [agentId: string]: string } = {};

  private isClosing: Resolvable<void>;
  private mitmStartPromise: Promise<MitmProxy>;

  private browserCreationQueue = new Queue(`BROWSER_CREATION_Q`, 1);
  private events = new EventSubscriber();
  private certificateGenerator: ICertificateGenerator;

  constructor(readonly options: ICreatePoolOptions = {}) {
    super();
    this.maxConcurrentAgents = options.maxConcurrentAgents ?? 10;
    this.maxConcurrentAgentsPerBrowser = options.maxConcurrentAgentsPerBrowser ?? 10;
    this.plugins = options.plugins ?? [];
    this.logger = options.logger?.createChild(module) ?? log.createChild(module, {});
  }

  public async start(): Promise<void> {
    if (this.isClosing) await this.isClosing;
    this.isClosing = null;
    this.logger.info('Pool.start');
    await this.startSharedMitm();
  }

  public createAgent(options?: IAgentCreateOptions): Agent {
    options ??= {};
    if (this.options.defaultBrowserEngine) {
      options.browserEngine ??= {
        ...this.options.defaultBrowserEngine,
        launchArguments: [...this.options.defaultBrowserEngine.launchArguments],
      };
    }
    options.plugins ??= [...this.plugins];
    options.pluginConfigs ??= structuredClone(this.pluginConfigs);
    const agent = new Agent(options, this);
    this.agentsById.set(agent.id, agent);
    this.emit('agent-created', { agent });
    return agent;
  }

  public async waitForAvailability(agent: Agent): Promise<void> {
    this.logger.info('Pool.waitForAvailability', {
      maxConcurrentAgents: this.maxConcurrentAgents,
      activeAgentsCount: this.activeAgentsCount,
      waitingForAvailability: this.#waitingForAvailability.length,
    });

    if (this.hasAvailability) {
      this.registerActiveAgent(agent);
      return;
    }

    const resolvablePromise = new Resolvable<void>();
    this.#waitingForAvailability.push({
      agent,
      promise: resolvablePromise,
    });
    await resolvablePromise.promise;
  }

  public async createMitmProxy(): Promise<MitmProxy> {
    this.certificateGenerator ??= MitmProxy.createCertificateGenerator(
      this.options.certificateStore,
      this.options.dataDir,
    );
    return await MitmProxy.start(this.certificateGenerator);
  }

  public async getBrowser(
    engine: IBrowserEngine,
    agentId: string,
    hooks: IHooksProvider & { profile?: IEmulationProfile },
    launchArgs?: IBrowserUserConfig,
  ): Promise<Browser> {
    return await this.browserCreationQueue.run(async () => {
      launchArgs ??= {};
      // You can't proxy browser contexts if the top level proxy isn't enabled
      const needsBrowserLevelProxy =
        launchArgs.disableMitm !== true || !!hooks.profile?.upstreamProxyUrl;
      if (!this.sharedMitmProxy && needsBrowserLevelProxy) await this.start();

      if (needsBrowserLevelProxy) {
        launchArgs.proxyPort ??= this.sharedMitmProxy?.port;
      }
      const browser = new Browser(engine, hooks, launchArgs);

      for (const existingBrowser of this.browsersById.values()) {
        const agents = this.agentsByBrowserId[existingBrowser.id] ?? 0;
        if (agents < this.maxConcurrentAgentsPerBrowser && existingBrowser.isEqualEngine(engine)) {
          this.agentsByBrowserId[existingBrowser.id] ??= 0;
          this.agentsByBrowserId[existingBrowser.id] += 1;
          this.browserIdByAgentId[agentId] = existingBrowser.id;
          return existingBrowser;
        }
      }

      this.agentsByBrowserId[browser.id] ??= 0;
      this.agentsByBrowserId[browser.id] += 1;
      this.browserIdByAgentId[agentId] = browser.id;
      // ensure enough listeners is possible
      browser.setMaxListeners(this.maxConcurrentAgents * 5);
      this.browsersById.set(browser.id, browser);

      const contextEvent = this.events.on(
        browser,
        'new-context',
        this.watchForContextPagesClosed.bind(this),
      );
      this.events.on(browser, 'new-session', this.onSession.bind(this));
      this.events.once(browser, 'close', () => this.onBrowserClosed(browser.id, contextEvent));

      await browser.launch();
      this.emit('browser-launched', { browser });

      return browser;
    });
  }

  public async close(): Promise<void> {
    if (this.isClosing) return this.isClosing.promise;
    this.isClosing = new Resolvable<void>();
    try {
      const logId = log.stats('Pool.Closing', {
        sessionId: null,
        browsers: this.browsersById.size,
      });
      for (const { promise } of this.#waitingForAvailability) {
        promise.reject(new CanceledPromiseError('Agent pool shutting down'), true);
      }
      this.#waitingForAvailability.length = 0;
      this.browserCreationQueue.stop(new CanceledPromiseError('Browser pool shutting down'));

      const closePromises: Promise<Error | void>[] = [];

      for (const agent of this.agentsById.values()) {
        closePromises.push(agent.close().catch(err => err));
      }
      for (const browser of this.browsersById.values()) {
        closePromises.push(browser.close().catch(err => err));
      }
      this.browsersById.clear();

      if (this.mitmStartPromise) {
        this.mitmStartPromise.then(x => x.close()).catch(err => err);
        this.mitmStartPromise = null;
      }

      if (this.sharedMitmProxy) {
        this.sharedMitmProxy.close();
        this.sharedMitmProxy = null;
      }

      if (this.certificateGenerator) {
        this.certificateGenerator.close();
        this.certificateGenerator = null;
      }

      try {
        const errors = await Promise.all(closePromises);
        this.events.close();
        log.stats('Pool.Closed', {
          parentLogId: logId,
          sessionId: null,
          errors: errors.filter(Boolean),
        });
      } catch (error) {
        log.error('Error in Pool.Close', { parentLogId: logId, sessionId: null, error });
      }
    } finally {
      this.isClosing.resolve();
    }
  }

  protected registerActiveAgent(agent: Agent): void {
    this.#activeAgentsCount += 1;
    try {
      this.events.once(agent, 'close', this.onAgentClosed.bind(this, agent.id));
    } catch (err) {
      this.#activeAgentsCount -= 1;

      throw err;
    }
  }

  private onSession(args: { session: IDevtoolsSession }): void {
    args?.session?.setMaxListeners(this.maxConcurrentAgentsPerBrowser + 1);
  }

  private onAgentClosed(closedAgentId: string): void {
    this.#activeAgentsCount -= 1;
    this.agentsById.delete(closedAgentId);
    const browserId = this.browserIdByAgentId[closedAgentId];
    if (this.agentsByBrowserId[browserId]) {
      this.agentsByBrowserId[browserId] -= 1;
      if (this.agentsByBrowserId[browserId] === 0) {
        delete this.agentsByBrowserId[browserId];
      }
      delete this.browserIdByAgentId[closedAgentId];
    }

    this.logger.info('Pool.ReleasingAgent', {
      maxConcurrentAgents: this.maxConcurrentAgents,
      activeAgentsCount: this.activeAgentsCount,
      waitingForAvailability: this.#waitingForAvailability.length,
    });
    if (!this.#waitingForAvailability.length || !this.hasAvailability) {
      return;
    }

    while (this.#waitingForAvailability.length && this.hasAvailability) {
      const { agent, promise } = this.#waitingForAvailability.shift();

      this.registerActiveAgent(agent);
      promise.resolve();
    }
  }

  private async startSharedMitm(): Promise<void> {
    if (this.sharedMitmProxy || env.disableMitm === true) return;
    if (this.mitmStartPromise) {
      await this.mitmStartPromise;
    } else {
      this.mitmStartPromise = this.createMitmProxy();
      this.certificateGenerator ??= MitmProxy.createCertificateGenerator(
        this.options.certificateStore,
        this.options.dataDir,
      );
      this.sharedMitmProxy = await this.mitmStartPromise;
    }
  }

  private async onBrowserClosed(
    browserId: string,
    contextEvent: IRegisteredEventListener,
  ): Promise<void> {
    if (this.isClosing) return;
    for (const agent of this.agentsById.values()) {
      if (agent.browserContext?.browserId === browserId) await agent.close();
    }

    if (contextEvent) this.events.off(contextEvent);
    this.logger.info('Browser.closed', {
      engine: this.browsersById.get(browserId)?.engine,
      browserId,
    });
    this.browsersById.delete(browserId);
    if (this.browsersById.size === 0) {
      this.emit('all-browsers-closed');
    }
  }

  private watchForContextPagesClosed(event: Browser['EventTypes']['new-context']): void {
    const browserContext = event.context;

    const registeredEvent = this.events.on(
      browserContext,
      'all-pages-closed',
      this.checkForInactiveBrowserEngine.bind(this, browserContext.browser.id),
    );
    this.events.once(browserContext, 'close', () => this.events.off(registeredEvent));
  }

  private checkForInactiveBrowserEngine(browserId: string): void {
    let hasWindows = false;
    for (const agent of this.agentsById.values()) {
      if (agent.browserContext?.browserId === browserId) {
        hasWindows = agent.browserContext.pagesById.size > 0;
        if (hasWindows) break;
      }
    }

    this.logger.info('Browser.allPagesClosed', {
      browserId,
      engineHasOtherOpenPages: hasWindows,
    });
    if (hasWindows) return;

    const browser = this.browsersById.get(browserId);
    if (browser) {
      this.emit('browser-has-no-open-windows', { browser });
    }
  }
}
