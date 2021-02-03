import ICoreConfigureOptions from '@secret-agent/core-interfaces/ICoreConfigureOptions';
import { LocationTrigger } from '@secret-agent/core-interfaces/Location';
import Log from '@secret-agent/commons/Logger';
import ConnectionToClient from './server/ConnectionToClient';
import CoreServer from './server';
import Session from './lib/Session';
import Tab from './lib/Tab';
import GlobalPool from './lib/GlobalPool';
import Signals = NodeJS.Signals;

const { log } = Log(module);

export { GlobalPool, Tab, Session, LocationTrigger };

export default class Core {
  public static server = new CoreServer();
  public static readonly connections: ConnectionToClient[] = [];

  public static onShutdown: () => void;

  private static wasManuallyStarted = false;
  private static isClosing = false;
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
    this.isClosing = false;
    this.isStarting = true;
    if (isExplicitlyStarted) this.wasManuallyStarted = true;

    const {
      localProxyPortStart,
      sessionsDir,
      browserEmulatorIds,
      maxConcurrentAgentsCount,
    } = options;

    if (maxConcurrentAgentsCount !== undefined)
      GlobalPool.maxConcurrentAgentsCount = maxConcurrentAgentsCount;

    if (localProxyPortStart !== undefined)
      GlobalPool.localProxyPortStart = options.localProxyPortStart;

    if (sessionsDir !== undefined) {
      GlobalPool.sessionsDir = options.sessionsDir;
    }

    await GlobalPool.start(browserEmulatorIds);

    await this.server.listen({ port: options.coreServerPort });

    const host = await this.server.address;

    log.info('Core started', {
      coreHost: await Core.server.address,
      sessionId: null,
      parentLogId: startLogId,
    });
    // if started as a subprocess, send back the host
    if (process.send) process.send(host);
  }

  public static async shutdown(force = false): Promise<void> {
    if (this.isClosing) return;
    this.isClosing = true;
    this.isStarting = false;
    const logid = log.info('Core.shutdown');

    await Promise.all(this.connections.map(x => x.disconnect()));
    await GlobalPool.close();
    await this.server.close(!force);

    this.wasManuallyStarted = false;
    if (Core.onShutdown) Core.onShutdown();

    log.info('Core.shutdownComplete', { parentLogId: logid, sessionId: null });
  }

  public static logUnhandledError(clientError: Error, fatalError = false): void {
    if (fatalError) {
      log.error('UnhandledError(fatal)', { clientError, sessionId: null });
    } else {
      if ((clientError as any).handled) return;
      log.error('UnhandledErrorOrRejection', { clientError, sessionId: null });
    }
  }

  private static checkForAutoShutdown(): void {
    if (Core.wasManuallyStarted || this.connections.some(x => x.isActive())) return;

    Core.shutdown().catch(error => {
      log.error('Core.autoShutdown', {
        error,
        sessionId: null,
      });
    });
  }
}

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
