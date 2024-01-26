import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Log, { hasBeenLoggedSymbol } from '@ulixee/commons/lib/Logger';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import DefaultBrowserEmulator from '@ulixee/default-browser-emulator';
import DefaultHumanEmulator from '@ulixee/default-human-emulator';
import ICoreConfigureOptions from '@ulixee/hero-interfaces/ICoreConfigureOptions';
import { ICorePluginClass } from '@ulixee/hero-interfaces/ICorePlugin';
import { IPluginClass } from '@ulixee/hero-interfaces/IPlugin';
import { PluginTypes } from '@ulixee/hero-interfaces/IPluginTypes';
import extractPlugins from '@ulixee/hero-plugin-utils/lib/utils/extractPlugins';
import requirePlugins from '@ulixee/hero-plugin-utils/lib/utils/requirePlugins';
import ITransport from '@ulixee/net/interfaces/ITransport';
import EmittingTransportToClient from '@ulixee/net/lib/EmittingTransportToClient';
import BrowserContext from '@ulixee/unblocked-agent/lib/BrowserContext';
import Pool from '@ulixee/unblocked-agent/lib/Pool';
import { LocationTrigger } from '@ulixee/unblocked-specification/agent/browser/Location';
import { IUnblockedPluginClass } from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
import * as Fs from 'fs';
import * as Path from 'path';
import ConnectionToHeroClient from './connections/ConnectionToHeroClient';
import DefaultSessionRegistry from './dbs/DefaultSessionRegistry';
import NetworkDb from './dbs/NetworkDb';
import * as Env from './env';
import ISessionRegistry from './interfaces/ISessionRegistry';
import Session from './lib/Session';
import Tab from './lib/Tab';

const { log } = Log(module);

export { Tab, Session, LocationTrigger };

export type THeroCoreEvents = Pick<
  Pool['EventTypes'],
  'browser-has-no-open-windows' | 'browser-launched' | 'all-browsers-closed'
>;

export default class HeroCore extends TypedEventEmitter<THeroCoreEvents & { close: void }> {
  public static allowDynamicPluginLoading = true;
  public static defaultCorePluginsById: { [id: string]: ICorePluginClass } = {};
  public static events = new TypedEventEmitter<THeroCoreEvents>();
  public static defaultUnblockedPlugins: IUnblockedPluginClass[] = [
    DefaultBrowserEmulator,
    DefaultHumanEmulator,
  ];

  public static onShutdown: () => void;

  public static dataDir = Env.dataDir;
  public static instances: HeroCore[] = [];
  private static didRegisterSignals: boolean;
  private static idCounter = 0;
  private static isShuttingDown: Promise<any>;

  public get defaultUnblockedPlugins(): IUnblockedPluginClass[] {
    if (this.pool) return this.pool.plugins;
  }

  public set defaultUnblockedPlugins(value) {
    this.pool.plugins = value;
  }

  public get dataDir(): string {
    return this.options.dataDir;
  }

  public sessionRegistry: ISessionRegistry;
  public readonly connections = new Set<ConnectionToHeroClient>();

  public corePluginsById: { [id: string]: ICorePluginClass } = {};

  public readonly pool: Pool;
  public id: number;

  public isClosing: Promise<void>;
  public clearIdleConnectionsAfterMillis = -1;

  private isStarting: Promise<void>;

  private networkDb: NetworkDb;
  private utilityBrowserContext: Promise<BrowserContext>;

  constructor(readonly options: ICoreConfigureOptions = {}) {
    super();
    bindFunctions(this);
    this.id = HeroCore.idCounter++;
    HeroCore.instances.push(this);

    options.dataDir ??= HeroCore.dataDir;

    if (!Path.isAbsolute(options.dataDir)) {
      options.dataDir = Path.join(process.cwd(), options.dataDir);
    }

    try {
      Fs.mkdirSync(`${options.dataDir}`, { recursive: true });
    } catch {}

    this.sessionRegistry =
      options.sessionRegistry ??
      new DefaultSessionRegistry(Path.join(this.dataDir, 'hero-sessions'));
    this.networkDb = new NetworkDb(this.dataDir);
    this.corePluginsById = { ...(HeroCore.defaultCorePluginsById ?? {}) };

    this.pool = new Pool({
      certificateStore: this.networkDb.certificates,
      dataDir: this.dataDir,
      logger: log.createChild(module),
      maxConcurrentAgents: options.maxConcurrentClientCount,
      maxConcurrentAgentsPerBrowser: options.maxConcurrentClientsPerBrowser,
      plugins: options.defaultUnblockedPlugins ?? HeroCore.defaultUnblockedPlugins,
    });

    this.pool.addEventEmitter(this, [
      'all-browsers-closed',
      'browser-has-no-open-windows',
      'browser-launched',
    ]);
    this.pool.addEventEmitter(HeroCore.events, [
      'all-browsers-closed',
      'browser-has-no-open-windows',
      'browser-launched',
    ]);
  }

  public addConnection(transportToClient?: ITransport): ConnectionToHeroClient {
    transportToClient ??= new EmittingTransportToClient();
    const connection = new ConnectionToHeroClient(transportToClient, this);
    connection.once('disconnected', () => this.connections.delete(connection));
    this.connections.add(connection);
    return connection;
  }

  public getUtilityContext(): Promise<BrowserContext> {
    if (this.utilityBrowserContext) return this.utilityBrowserContext;

    this.utilityBrowserContext = this.pool
      .getBrowser(
        DefaultBrowserEmulator.default(),
        {},
        {
          showChrome: false,
        },
      )
      .then(browser => browser.newContext({ logger: log as IBoundLog, isIncognito: true }));

    return this.utilityBrowserContext;
  }

  public async start(): Promise<void> {
    if (this.isStarting) return this.isStarting;

    HeroCore.registerSignals(this.options.shouldShutdownOnSignals);
    const startLogId = log.info('Core.start', {
      options: this.options,
      sessionId: null,
    });
    this.isClosing = null;
    this.isStarting = this.pool.start();
    await this.isStarting;

    log.info('Core started', {
      sessionId: null,
      parentLogId: startLogId,
      dataDir: this.dataDir,
    });
  }

  public async close(): Promise<void> {
    if (this.isClosing) return this.isClosing;

    const isClosing = new Resolvable<void>();
    this.isClosing = isClosing.promise;

    this.isStarting = null;
    const idx = HeroCore.instances.indexOf(this);
    if (idx >= 0) HeroCore.instances.splice(idx, 1);
    const logid = log.info('Core.shutdown');
    let shutDownErrors: (Error | null)[] = [];
    try {
      shutDownErrors = await Promise.all([
        ...[...this.connections].map(x => x.disconnect().catch(err => err)),
        this.utilityBrowserContext?.then(x => x.close()).catch(err => err),
        this.pool?.close().catch(err => err),
      ]);
      shutDownErrors = shutDownErrors.filter(Boolean);

      this.utilityBrowserContext = null;
      this.networkDb?.close();
      await this.sessionRegistry?.shutdown().catch(err => {
        if (err) shutDownErrors.push(err);
      });

      isClosing.resolve();
    } catch (error) {
      isClosing.reject(error);
    } finally {
      this.emit('close');
      log.info('Core.shutdownComplete', {
        parentLogId: logid,
        sessionId: null,
        errors: shutDownErrors.length ? shutDownErrors : undefined,
      });
    }
    return isClosing.promise;
  }

  public use(PluginObject: string | ICorePluginClass | { [name: string]: IPluginClass }): void {
    let Plugins: IPluginClass[];
    if (typeof PluginObject === 'string') {
      Plugins = requirePlugins(PluginObject as string);
    } else {
      Plugins = extractPlugins(PluginObject as any);
    }

    for (const Plugin of Plugins) {
      if (Plugin.type === PluginTypes.CorePlugin) {
        this.corePluginsById[Plugin.id] = Plugin;
      }
    }
  }

  public static async start(options: ICoreConfigureOptions = {}): Promise<HeroCore> {
    // this method only creates a single core. To create multiple, you can create them individually, but you usually want a single core
    if (this.instances.length > 0) {
      return this.instances[0];
    }
    const core = new HeroCore(options);
    await core.start();
    return core;
  }

  public static addConnection(transportToClient?: ITransport): ConnectionToHeroClient {
    if (!this.instances.length) {
      new HeroCore();
    }
    return this.instances[0].addConnection(transportToClient);
  }

  public static async shutdown(): Promise<any> {
    if (this.isShuttingDown) return this.isShuttingDown;
    ShutdownHandler.unregister(this.shutdown);
    this.isShuttingDown = Promise.allSettled(this.instances.map(x => x.close()));
    await this.isShuttingDown;
    if (this.onShutdown) this.onShutdown();
  }

  public static use(
    PluginObject: string | ICorePluginClass | { [name: string]: IPluginClass },
  ): void {
    let Plugins: IPluginClass[];
    if (typeof PluginObject === 'string') {
      Plugins = requirePlugins(PluginObject as string);
    } else {
      Plugins = extractPlugins(PluginObject as any);
    }

    for (const Plugin of Plugins) {
      if (Plugin.type === PluginTypes.CorePlugin) {
        this.defaultCorePluginsById[Plugin.id] = Plugin;
      }
    }
  }

  private static registerSignals(shouldShutdownOnSignals = true): void {
    if (this.didRegisterSignals) return;
    this.didRegisterSignals = true;
    if (!shouldShutdownOnSignals) ShutdownHandler.disableSignals = true;
    this.shutdown = this.shutdown.bind(this);
    ShutdownHandler.register(this.shutdown);

    if (process.env.NODE_ENV !== 'test') {
      process.on('uncaughtExceptionMonitor', (error: Error, origin) => {
        if (!error || error[hasBeenLoggedSymbol]) return;
        log.error('UnhandledError(fatal)', { error, origin, sessionId: null });
      });
      process.on('unhandledRejection', (error: Error) => {
        if (!error || error[hasBeenLoggedSymbol]) return;
        log.error('UnhandledRejection', { error, sessionId: null });
      });
    }
  }
}
