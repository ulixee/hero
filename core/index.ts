import * as Fs from 'fs';
import * as Path from 'path';
import ICoreConfigureOptions from '@ulixee/hero-interfaces/ICoreConfigureOptions';
import { LocationTrigger } from '@unblocked-web/specifications/agent/browser/Location';
import Log, { hasBeenLoggedSymbol } from '@ulixee/commons/lib/Logger';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { ICorePluginClass } from '@ulixee/hero-interfaces/ICorePlugin';
import { PluginTypes } from '@ulixee/hero-interfaces/IPluginTypes';
import extractPlugins from '@ulixee/hero-plugin-utils/lib/utils/extractPlugins';
import requirePlugins from '@ulixee/hero-plugin-utils/lib/utils/requirePlugins';
import { IPluginClass } from '@ulixee/hero-interfaces/IPlugin';
import ConnectionToHeroClient from './connections/ConnectionToHeroClient';
import Session from './lib/Session';
import Tab from './lib/Tab';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import { dataDir } from './env';
import NetworkDb from './dbs/NetworkDb';
import Pool from '@unblocked-web/agent/lib/Pool';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import SessionsDb from './dbs/SessionsDb';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import BrowserContext from '@unblocked-web/agent/lib/BrowserContext';
import DefaultBrowserEmulator from '@unblocked-web/default-browser-emulator';
import DefaultHumanEmulator from '@unblocked-web/default-human-emulator';
import { IUnblockedPluginClass } from '@unblocked-web/specifications/plugin/IUnblockedPlugin';
import ITransportToClient from '@ulixee/net/interfaces/ITransportToClient';
import EmittingTransportToClient from '@ulixee/net/lib/EmittingTransportToClient';

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

  public static readonly connections: ConnectionToHeroClient[] = [];

  public static corePluginsById: { [id: string]: ICorePluginClass } = {};

  public static onShutdown: () => void;
  public static pool: Pool;

  public static allowDynamicPluginLoading = true;
  public static isClosing: Promise<void>;
  public static autoShutdownMillis = 5e3;

  private static wasManuallyStarted = false;
  private static isStarting = false;
  private static autoShutdownTimer: NodeJS.Timer;
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
    const connection = new ConnectionToHeroClient(transportToClient);
    connection.on('disconnected', () => {
      const idx = this.connections.indexOf(connection);
      if (idx >= 0) this.connections.splice(idx, 1);
      this.checkForAutoShutdown();
    });
    this.connections.push(connection);
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
        DefaultBrowserEmulator.defaultBrowserEngine(), // eslint-disable-line import/no-named-as-default-member
        {},
        {
          showChrome: false,
        },
      )
      .then(browser => browser.newContext({ logger: log as IBoundLog, isIncognito: true }));

    return this.utilityBrowserContext;
  }

  public static async start(
    options: ICoreConfigureOptions = {},
    isExplicitlyStarted = true,
  ): Promise<void> {
    if (isExplicitlyStarted) this.wasManuallyStarted = true;
    if (this.isStarting) return;
    const startLogId = log.info('Core.start', {
      options,
      isExplicitlyStarted,
      sessionId: null,
    });
    this.isClosing = null;
    this.isStarting = true;
    this.registerSignals();

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
    clearTimeout(this.autoShutdownTimer);

    const isClosing = new Resolvable<void>();
    this.isClosing = isClosing.promise;

    this.isStarting = false;
    const logid = log.info('Core.shutdown');
    let shutDownErrors: (Error | null)[] = [];
    try {
      shutDownErrors = await Promise.all([
        ...this.connections.map(x => x.disconnect().catch(err => err)),
        this.utilityBrowserContext?.then(x => x.close()).catch(err => err),
        this.pool?.close().catch(err => err),
      ]);
      shutDownErrors = shutDownErrors.filter(Boolean);

      this.utilityBrowserContext = null;
      this.networkDb?.close();
      SessionsDb.shutdown();

      this.wasManuallyStarted = false;
      if (this.onShutdown) this.onShutdown();
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

  public static logUnhandledError(clientError: Error, fatalError = false): void {
    if (!clientError || clientError[hasBeenLoggedSymbol]) return;
    if (fatalError) {
      log.error('UnhandledError(fatal)', { clientError, sessionId: null });
    } else if (!clientError[hasBeenLoggedSymbol]) {
      log.error('UnhandledErrorOrRejection', { clientError, sessionId: null });
    }
  }

  private static checkForAutoShutdown(): void {
    if (!this.shouldAutoShutdown()) return;

    clearTimeout(this.autoShutdownTimer);
    this.autoShutdownTimer = setTimeout(
      () => this.tryAutoShutdown(),
      this.autoShutdownMillis,
    ).unref();
  }

  private static tryAutoShutdown(): void {
    if (!this.shouldAutoShutdown()) return;

    this.shutdown().catch(error => {
      log.error('Core.autoShutdown', {
        error,
        sessionId: null,
      });
    });
  }

  private static shouldAutoShutdown(): boolean {
    return !(
      this.wasManuallyStarted ||
      this.connections.some(x => x.isActive()) ||
      Session.hasKeepAliveSessions()
    );
  }

  private static registerSignals(): void {
    if (this.didRegisterSignals) return;
    this.didRegisterSignals = true;
    ShutdownHandler.register(() => this.shutdown());

    if (process.env.NODE_ENV !== 'test') {
      process.on('uncaughtExceptionMonitor', async (error: Error) => {
        await this.logUnhandledError(error, true);
        await this.shutdown();
      });
      process.on('unhandledRejection', async (error: Error) => {
        await this.logUnhandledError(error, false);
      });
    }
  }
}
