import * as Os from 'os';
import * as Fs from 'fs';
import * as Path from 'path';
import ICoreConfigureOptions from '@ulixee/hero-interfaces/ICoreConfigureOptions';
import { LocationTrigger } from '@ulixee/hero-interfaces/Location';
import Log, { hasBeenLoggedSymbol } from '@ulixee/commons/lib/Logger';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import {
  IHumanEmulatorClass,
  IBrowserEmulatorClass,
  ICorePluginClass,
} from '@ulixee/hero-interfaces/ICorePlugin';
import { PluginTypes } from '@ulixee/hero-interfaces/IPluginTypes';
import DefaultBrowserEmulator from '@ulixee/default-browser-emulator';
import DefaultHumanEmulator from '@ulixee/default-human-emulator';
import extractPlugins from '@ulixee/hero-plugin-utils/lib/utils/extractPlugins';
import requirePlugins from '@ulixee/hero-plugin-utils/lib/utils/requirePlugins';
import { IPluginClass } from '@ulixee/hero-interfaces/IPlugin';
import ConnectionToClient from './connections/ConnectionToClient';
import Session from './lib/Session';
import Tab from './lib/Tab';
import GlobalPool from './lib/GlobalPool';
import Signals = NodeJS.Signals;

const { log } = Log(module);
let dataDir = process.env.HERO_DATA_DIR || Path.join(Os.tmpdir(), '.ulixee'); // transferred to static variable below class definition

export { GlobalPool, Tab, Session, LocationTrigger };

export default class Core {
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

  public static allowDynamicPluginLoading = true;
  public static isClosing: Promise<void>;
  private static wasManuallyStarted = false;
  private static isStarting = false;

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

  public static async start(
    options: ICoreConfigureOptions = {},
    isExplicitlyStarted = true,
  ): Promise<void> {
    if (this.isStarting) return;
    const startLogId = log.info('Core.start', {
      options,
      isExplicitlyStarted,
      sessionId: null,
    });
    this.isClosing = null;
    this.isStarting = true;
    if (isExplicitlyStarted) this.wasManuallyStarted = true;

    const { localProxyPortStart, maxConcurrentClientCount } = options;

    if (maxConcurrentClientCount !== undefined)
      GlobalPool.maxConcurrentClientCount = maxConcurrentClientCount;

    if (localProxyPortStart !== undefined)
      GlobalPool.localProxyPortStart = options.localProxyPortStart;

    if (options.dataDir !== undefined) {
      Core.dataDir = options.dataDir;
    }

    await GlobalPool.start();

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

    this.isStarting = false;
    const logid = log.info('Core.shutdown');
    const shutDownErrors: Error[] = [];
    try {
      await Promise.all(this.connections.map(x => x.disconnect())).catch(error =>
        shutDownErrors.push(error),
      );
      await GlobalPool.close().catch(error => shutDownErrors.push(error));

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
    if (
      Core.wasManuallyStarted ||
      this.connections.some(x => x.isActive()) ||
      Session.hasKeepAliveSessions()
    )
      return;

    Core.shutdown().catch(error => {
      log.error('Core.autoShutdown', {
        error,
        sessionId: null,
      });
    });
  }

  public static get dataDir(): string {
    return dataDir;
  }

  public static set dataDir(dir: string) {
    const absoluteDataDir = Path.isAbsolute(dir) ? dir : Path.join(process.cwd(), dir);
    if (!Fs.existsSync(`${absoluteDataDir}`)) {
      Fs.mkdirSync(`${absoluteDataDir}`, { recursive: true });
    }
    dataDir = absoluteDataDir;
  }
}

Core.dataDir = dataDir;

['exit', 'SIGTERM', 'SIGINT', 'SIGQUIT'].forEach(name => {
  process.once(name as Signals, async () => {
    await Core.shutdown();
    process.exit(0);
  });
});

if (process.env.NODE_ENV !== 'test') {
  process.on('uncaughtExceptionMonitor', async (error: Error) => {
    await Core.logUnhandledError(error, true);
    await Core.shutdown();
  });
  process.on('unhandledRejection', async (error: Error) => {
    await Core.logUnhandledError(error, false);
  });
}
