import * as Fs from 'fs';
import * as Path from 'path';
import ICoreConfigureOptions from '@ulixee/hero-interfaces/ICoreConfigureOptions';
import { LocationTrigger } from '@unblocked-web/emulator-spec/browser/Location';
import Log, { hasBeenLoggedSymbol } from '@ulixee/commons/lib/Logger';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { ICorePluginClass } from '@ulixee/hero-interfaces/ICorePlugin';
import { PluginTypes } from '@ulixee/hero-interfaces/IPluginTypes';
import DefaultBrowserEmulator from '@unblocked-web/default-browser-emulator';
import DefaultHumanEmulator from '@unblocked-web/default-human-emulator';
import extractPlugins from '@ulixee/hero-plugin-utils/lib/utils/extractPlugins';
import requirePlugins from '@ulixee/hero-plugin-utils/lib/utils/requirePlugins';
import { IPluginClass } from '@ulixee/hero-interfaces/IPlugin';
import ConnectionToClient from './connections/ConnectionToClient';
import Session from './lib/Session';
import Tab from './lib/Tab';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import { IHumanEmulatorClass } from '@unblocked-web/emulator-spec/IHumanEmulator';
import { IBrowserEmulatorClass } from '@unblocked-web/emulator-spec/IBrowserEmulator';
import { dataDir } from './env';
import NetworkDb from './dbs/NetworkDb';
import Pool from '@unblocked-web/secret-agent/lib/Pool';
import CorePlugins from './lib/CorePlugins';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import SessionsDb from './dbs/SessionsDb';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import BrowserContext from '@unblocked-web/secret-agent/lib/BrowserContext';

const { log } = Log(module);

export { Tab, Session, LocationTrigger };

export default class Core {
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
    > & {
      'session-created': { session: Session };
    }
  >();

  public static readonly connections: ConnectionToClient[] = [];

  public static pluginMap: {
    humanEmulatorsById: { [id: string]: IHumanEmulatorClass };
    browserEmulatorsById: { [id: string]: IBrowserEmulatorClass };
    corePluginsById: { [id: string]: ICorePluginClass };
  } = {
    humanEmulatorsById: {
      [DefaultHumanEmulator.id]: DefaultHumanEmulator,
    },
    browserEmulatorsById: {
      [DefaultBrowserEmulator.id]: DefaultBrowserEmulator,
    },
    corePluginsById: {},
  };

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
  private static networkDb: NetworkDb;
  private static utilityBrowserContext: Promise<BrowserContext>;

  public static addConnection(): ConnectionToClient {
    const connection = new ConnectionToClient();
    connection.on('close', () => {
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
      if (Plugin.type === PluginTypes.HumanEmulator) {
        this.pluginMap.humanEmulatorsById[Plugin.id] = Plugin as IHumanEmulatorClass;
      } else if (Plugin.type === PluginTypes.BrowserEmulator) {
        this.pluginMap.browserEmulatorsById[Plugin.id] = Plugin as IBrowserEmulatorClass;
      } else if (Plugin.type === PluginTypes.CorePlugin) {
        this.pluginMap.corePluginsById[Plugin.id] = Plugin;
      }
    }
  }

  public static getUtilityContext(): Promise<BrowserContext> {
    if (this.utilityBrowserContext) return this.utilityBrowserContext;

    const corePlugins = new CorePlugins({}, log);

    this.utilityBrowserContext = this.pool
      .getBrowser(corePlugins.browserEngine, corePlugins, {
        showChrome: false,
      })
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

    this.pool = new Pool({
      certificateStore: this.networkDb.certificates,
      dataDir: Core.dataDir,
      logger: log.createChild(module),
      maxConcurrentAgents: maxConcurrentClientCount,
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
