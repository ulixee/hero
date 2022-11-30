import * as Fs from 'fs';
import * as Path from 'path';
import ICoreConfigureOptions from '@ulixee/hero-interfaces/ICoreConfigureOptions';
import { LocationTrigger } from '@ulixee/unblocked-specification/agent/browser/Location';
import Log, { hasBeenLoggedSymbol } from '@ulixee/commons/lib/Logger';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { ICorePluginClass } from '@ulixee/hero-interfaces/ICorePlugin';
import { PluginTypes } from '@ulixee/hero-interfaces/IPluginTypes';
import extractPlugins from '@ulixee/hero-plugin-utils/lib/utils/extractPlugins';
import requirePlugins from '@ulixee/hero-plugin-utils/lib/utils/requirePlugins';
import { IPluginClass } from '@ulixee/hero-interfaces/IPlugin';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import Pool from '@ulixee/unblocked-agent/lib/Pool';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import BrowserContext from '@ulixee/unblocked-agent/lib/BrowserContext';
import DefaultBrowserEmulator from '@ulixee/default-browser-emulator';
import DefaultHumanEmulator from '@ulixee/default-human-emulator';
import { IUnblockedPluginClass } from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
import ITransportToClient from '@ulixee/net/interfaces/ITransportToClient';
import EmittingTransportToClient from '@ulixee/net/lib/EmittingTransportToClient';
import SessionsDb from './dbs/SessionsDb';
import NetworkDb from './dbs/NetworkDb';
import { dataDir } from './env';
import Tab from './lib/Tab';
import Session from './lib/Session';
import ConnectionToHeroClient from './connections/ConnectionToHeroClient';

const { log } = Log(module);

export { Tab, Session, LocationTrigger };

export default class Core {
  public static get defaultUnblockedPlugins(): IUnblockedPluginClass[] {
    if (this.pool) return this.pool.plugins;
    return this._defaultUnblockedPlugins;
  }

  public static set defaultUnblockedPlugins(value) {
    this._defaultUnblockedPlugins = value;
    if (this.pool) this.pool.plugins = value;
  }

  public static get dataDir(): string {
    return this._dataDir;
  }

  public static set dataDir(dir: string) {
    const absoluteDataDir = Path.isAbsolute(dir) ? dir : Path.join(process.cwd(), dir);
    if (!Fs.existsSync(`${absoluteDataDir}`)) {
      Fs.mkdirSync(`${absoluteDataDir}`, { recursive: true });
    }
    this._dataDir = absoluteDataDir;
  }

  public static events = new TypedEventEmitter<
    Pick<
      Pool['EventTypes'],
      'browser-has-no-open-windows' | 'browser-launched' | 'all-browsers-closed'
    >
  >();

  public static readonly connections = new Set<ConnectionToHeroClient>();

  public static corePluginsById: { [id: string]: ICorePluginClass } = {};

  public static onShutdown: () => void;
  public static pool: Pool;

  public static allowDynamicPluginLoading = true;
  public static isClosing: Promise<void>;
  public static clearIdleConnectionsAfterMillis = -1;

  private static isStarting = false;
  private static didRegisterSignals = false;
  private static _dataDir: string = dataDir;
  private static _defaultUnblockedPlugins: IUnblockedPluginClass[] = [
    DefaultBrowserEmulator,
    DefaultHumanEmulator,
  ];

  private static networkDb: NetworkDb;
  private static utilityBrowserContext: Promise<BrowserContext>;

  public static addConnection(transportToClient?: ITransportToClient<any>): ConnectionToHeroClient {
    transportToClient ??= new EmittingTransportToClient();
    const connection = new ConnectionToHeroClient(
      transportToClient,
      this.clearIdleConnectionsAfterMillis,
    );
    connection.once('disconnected', () => this.connections.delete(connection));
    this.connections.add(connection);
    return connection;
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
        this.corePluginsById[Plugin.id] = Plugin;
      }
    }
  }

  public static getUtilityContext(): Promise<BrowserContext> {
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

  public static async start(options: ICoreConfigureOptions = {}): Promise<void> {
    if (this.isStarting) return;
    const startLogId = log.info('Core.start', {
      options,
      sessionId: null,
    });
    this.isClosing = null;
    this.isStarting = true;

    this.registerSignals(options.shouldShutdownOnSignals);

    const { maxConcurrentClientCount } = options;

    if (options.dataDir !== undefined) {
      Core.dataDir = options.dataDir;
    }
    this.networkDb = new NetworkDb();
    if (options.defaultUnblockedPlugins)
      this.defaultUnblockedPlugins = options.defaultUnblockedPlugins;

    this.pool = new Pool({
      certificateStore: this.networkDb.certificates,
      dataDir: Core.dataDir,
      logger: log.createChild(module),
      maxConcurrentAgents: maxConcurrentClientCount,
      plugins: this.defaultUnblockedPlugins,
    });

    // @ts-ignore
    this.pool.addEventEmitter(this.events, [
      'all-browsers-closed',
      'browser-has-no-open-windows',
      'browser-launched',
    ]);

    await this.pool.start();

    log.info('Core started', {
      sessionId: null,
      parentLogId: startLogId,
      dataDir: Core.dataDir,
    });
  }

  public static async shutdown(): Promise<void> {
    if (this.isClosing) return this.isClosing;

    const isClosing = new Resolvable<void>();
    this.isClosing = isClosing.promise;
    ShutdownHandler.unregister(this.shutdown);

    this.isStarting = false;
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
      SessionsDb.shutdown();

      if (this.onShutdown) this.onShutdown();
      await ShutdownHandler.run();
      isClosing.resolve();
    } catch (error) {
      isClosing.reject(error);
    } finally {
      log.info('Core.shutdownComplete', {
        parentLogId: logid,
        sessionId: null,
        errors: shutDownErrors.length ? shutDownErrors : undefined,
      });
    }
    return isClosing.promise;
  }

  private static registerSignals(shouldShutdownOnSignals = true): void {
    if (this.didRegisterSignals) return;
    this.didRegisterSignals = true;
    if (!shouldShutdownOnSignals) ShutdownHandler.disableSignals = true;
    this.shutdown = this.shutdown.bind(this);
    ShutdownHandler.register(this.shutdown);

    if (process.env.NODE_ENV !== 'test') {
      process.on('uncaughtExceptionMonitor', async (error: Error) => {
        if (!error || error[hasBeenLoggedSymbol]) return;
        log.error('UnhandledError(fatal)', { error, sessionId: null });
        if (shouldShutdownOnSignals) await ShutdownHandler.run();
      });
      process.on('unhandledRejection', (error: Error) => {
        if (!error || error[hasBeenLoggedSymbol]) return;
        log.error('UnhandledRejection', { error, sessionId: null });
      });
    }
  }
}
