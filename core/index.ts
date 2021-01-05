import ICoreConfigureOptions from '@secret-agent/core-interfaces/ICoreConfigureOptions';
import { LocationTrigger } from '@secret-agent/core-interfaces/Location';
import Log from '@secret-agent/commons/Logger';
import { createReplayServer } from '@secret-agent/session-state/api';
import ISessionReplayServer from '@secret-agent/session-state/interfaces/ISessionReplayServer';
import CoreServerConnection from './lib/CoreServerConnection';
import RemoteServer from './lib/RemoteServer';
import Session from './lib/Session';
import Tab from './lib/Tab';
import GlobalPool from './lib/GlobalPool';
import Signals = NodeJS.Signals;

const { log } = Log(module);

export { GlobalPool, Tab, Session, LocationTrigger, RemoteServer };

export default class Core {
  public static replayServer: Promise<ISessionReplayServer> = null;
  public static readonly connections: CoreServerConnection[] = [];
  private static wasManuallyStarted = false;
  private static isClosing = false;

  public static addConnection(): CoreServerConnection {
    const connection = new CoreServerConnection();
    connection.on('close', this.checkForAutoShutdown.bind(this));
    this.connections.push(connection);
    return connection;
  }

  public static async start(
    options: ICoreConfigureOptions = {},
    isExplicitlyStarted = true,
  ): Promise<void> {
    log.info('Core.start');
    this.isClosing = false;
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

    const shouldStartReplayServer = Boolean(JSON.parse(process.env.SA_SHOW_REPLAY ?? 'true'));
    if (options?.replayServerPort !== undefined || shouldStartReplayServer) {
      await this.startReplayServer(options.replayServerPort);
    }
  }

  public static async shutdown(force = false): Promise<void> {
    if (this.isClosing) return;
    this.isClosing = true;
    log.info('Core.shutdown');
    await Promise.all(this.connections.map(x => x.disconnect()));

    const promises: Promise<any>[] = [GlobalPool.close()];
    if (this.replayServer) {
      promises.push(this.replayServer.then(x => x.close(!force)));
    }
    this.replayServer = null;
    this.wasManuallyStarted = false;
    await Promise.all(promises);
  }

  public static logUnhandledError(clientError: Error, fatalError = false): void {
    if (fatalError) {
      log.error('UnhandledError(fatal)', { clientError, sessionId: null });
    } else {
      log.error('UnhandledErrorOrRejection', { clientError, sessionId: null });
    }
  }

  public static startReplayServer(port?: number): void {
    if (this.replayServer) return;
    this.replayServer = createReplayServer(port);
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
