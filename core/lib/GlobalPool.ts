import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import { createPromise } from '@ulixee/commons/lib/utils';
import Log from '@ulixee/commons/lib/Logger';
import { MitmProxy } from '@ulixee/hero-mitm';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import Puppet from '@ulixee/hero-puppet';
import IBrowserEngine from '@ulixee/hero-interfaces/IBrowserEngine';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import IPuppetLaunchArgs from '@ulixee/hero-interfaces/IPuppetLaunchArgs';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import SessionsDb from '../dbs/SessionsDb';
import Session from './Session';
import DevtoolsPreferences from './DevtoolsPreferences';
import CorePlugins from './CorePlugins';
import Core from '../index';
import IPuppetContext from '@ulixee/hero-interfaces/IPuppetContext';

const { log } = Log(module);
export const disableMitm = Boolean(JSON.parse(process.env.HERO_DISABLE_MITM ?? 'false'));

export default class GlobalPool {
  public static maxConcurrentClientCount = 10;
  public static localProxyPortStart = 0;
  public static get activeSessionCount(): number {
    return this._activeSessionCount;
  }

  public static get hasAvailability(): boolean {
    return this.activeSessionCount < GlobalPool.maxConcurrentClientCount;
  }

  public static events = new TypedEventEmitter<{
    'session-created': { session: Session };
    'browser-launched': { puppet: Puppet };
    'browser-has-no-open-windows': { puppet: Puppet };
    'all-browsers-closed': void;
  }>();

  private static isClosing = false;
  private static defaultLaunchArgs: IPuppetLaunchArgs;
  private static _activeSessionCount = 0;
  private static puppets: Puppet[] = [];
  private static mitmServer: MitmProxy;
  private static mitmStartPromise: Promise<MitmProxy>;
  private static waitingForAvailability: {
    options: ISessionCreateOptions;
    promise: IResolvablePromise<Session>;
  }[] = [];

  public static async start(): Promise<void> {
    this.isClosing = false;
    log.info('StartingGlobalPool', {
      sessionId: null,
    });
    await this.startMitm();
  }

  public static async createSession(options: ISessionCreateOptions): Promise<Session> {
    log.info('AcquiringChrome', {
      sessionId: null,
      activeSessionCount: this.activeSessionCount,
      waitingForAvailability: this.waitingForAvailability.length,
      maxConcurrentClientCount: this.maxConcurrentClientCount,
    });

    if (!this.hasAvailability) {
      const resolvablePromise = createPromise<Session>();
      this.waitingForAvailability.push({ options, promise: resolvablePromise });
      return await resolvablePromise.promise;
    }
    return await this.createSessionNow(options);
  }

  public static close(): Promise<void> {
    if (this.isClosing) return Promise.resolve();
    this.isClosing = true;
    const logId = log.stats('GlobalPool.Closing', {
      sessionId: null,
      puppets: this.puppets.length,
      waitingForAvailability: this.waitingForAvailability.length,
    });

    for (const { promise } of this.waitingForAvailability) {
      promise.reject(new CanceledPromiseError('Puppet pool shutting down'));
    }
    this.waitingForAvailability.length = 0;
    const closePromises: Promise<any>[] = [];
    while (this.puppets.length) {
      const puppetBrowser = this.puppets.shift();
      closePromises.push(puppetBrowser.close().catch(err => err));
    }
    MitmProxy.close();
    if (this.mitmStartPromise) {
      this.mitmStartPromise.then(x => x.close()).catch(() => null);
      this.mitmStartPromise = null;
    }
    if (this.mitmServer) {
      this.mitmServer.close();
      this.mitmServer = null;
    }
    SessionsDb.shutdown();
    return Promise.all(closePromises)
      .then(() => {
        log.stats('GlobalPool.Closed', { parentLogId: logId, sessionId: null });
        return null;
      })
      .catch(error => {
        log.error('Error in GlobalPoolShutdown', { parentLogId: logId, sessionId: null, error });
      });
  }

  public static async getPuppet(plugins: CorePlugins): Promise<Puppet> {
    const args = this.getPuppetLaunchArgs();
    const browserEngine = plugins.browserEngine;
    const puppet = new Puppet(browserEngine, args);
    await plugins.onBrowserLaunchConfiguration(browserEngine.launchArguments);

    const existing = this.puppets.find(x =>
      this.isSameEngine(puppet.browserEngine, x.browserEngine),
    );
    if (existing) return Promise.resolve(existing);

    this.puppets.push(puppet);
    puppet.once('close', this.onEngineClosed.bind(this, puppet));
    const browserDir = browserEngine.executablePath.split(browserEngine.fullVersion).shift();

    const preferencesInterceptor = new DevtoolsPreferences(
      `${browserDir}/devtoolsPreferences.json`,
    );

    await puppet.start(preferencesInterceptor.installOnConnect);
    this.events.emit('browser-launched', { puppet });

    return puppet;
  }

  private static async startMitm(): Promise<void> {
    if (this.mitmServer || disableMitm === true) return;
    if (this.mitmStartPromise) await this.mitmStartPromise;
    else {
      this.mitmStartPromise = MitmProxy.start(this.localProxyPortStart, Core.dataDir);
      this.mitmServer = await this.mitmStartPromise;
    }
  }

  private static async createSessionNow(options: ISessionCreateOptions): Promise<Session> {
    await this.startMitm();

    this._activeSessionCount += 1;
    try {
      const session = new Session(options);
      this.events.emit('session-created', { session });

      const puppet = await this.getPuppet(session.plugins);

      if (disableMitm !== true) {
        await session.registerWithMitm(this.mitmServer, puppet.supportsBrowserContextProxy);
      }

      const sessionId = session.id;
      const browserContext = await puppet.newContext(
        session.plugins,
        log.createChild(module, {
          sessionId,
        }),
        session.getMitmProxy(),
        session.useIncognitoContext(),
      );
      await session.initialize(browserContext);

      session.on('all-tabs-closed', this.checkForInactiveBrowserEngine.bind(this, session));
      session.once(
        'closed',
        ev => (ev.waitForPromise = this.closeBrowserContext(browserContext, sessionId)),
      );
      session.once('closing', this.releaseConnection.bind(this));
      return session;
    } catch (err) {
      this._activeSessionCount -= 1;
      throw err;
    }
  }

  private static async closeBrowserContext(
    browserContext: IPuppetContext,
    sessionId: string,
  ): Promise<void> {
    try {
      await browserContext.close();
    } catch (error) {
      log.error('Session.CloseBrowserContextError', { error, sessionId });
    }
  }

  private static async onEngineClosed(puppet: Puppet): Promise<void> {
    if (this.isClosing) return;
    for (const session of Session.sessionsWithBrowserId(puppet.browserId)) {
      await session.close();
    }
    log.info('PuppetEngine.closed', {
      engine: puppet.browserEngine,
      browserId: puppet.browserId,
      sessionId: null,
    });
    const idx = this.puppets.indexOf(puppet);
    if (idx >= 0) this.puppets.splice(idx, 1);
    if (this.puppets.length === 0) {
      this.events.emit('all-browsers-closed');
    }
  }

  private static checkForInactiveBrowserEngine(session: Session): void {
    const browserId = session.browserContext.browserId;
    const sessionsUsingEngine = Session.sessionsWithBrowserId(browserId);
    const hasWindows = sessionsUsingEngine.some(x => x.tabsById.size > 0);

    log.info('Session.allTabsClosed', {
      sessionId: session.id,
      engineHasOtherOpenTabs: hasWindows,
    });
    if (hasWindows) return;

    const puppet = this.puppets.find(x =>
      this.isSameEngine(session.browserEngine, x.browserEngine),
    );

    if (puppet) {
      this.events.emit('browser-has-no-open-windows', { puppet });
    }
  }

  private static releaseConnection(): void {
    this._activeSessionCount -= 1;

    const wasTransferred = this.resolveWaitingConnection();
    if (!wasTransferred) {
      log.info('ReleasingChrome', {
        sessionId: null,
        activeSessionCount: this.activeSessionCount,
        waitingForAvailability: this.waitingForAvailability.length,
      });
    }
  }

  private static resolveWaitingConnection(): boolean {
    if (!this.waitingForAvailability.length) {
      return false;
    }
    const { options, promise } = this.waitingForAvailability.shift();

    this.createSessionNow(options)
      .then(session => promise.resolve(session))
      .catch(error => promise.reject(error));

    log.info('TransferredChromeToWaitingAcquirer');
    return true;
  }

  private static getPuppetLaunchArgs(): IPuppetLaunchArgs {
    this.defaultLaunchArgs ??= {
      showBrowser: Boolean(
        JSON.parse(process.env.HERO_SHOW_BROWSER ?? process.env.SHOW_BROWSER ?? 'false'),
      ),
      disableDevtools: Boolean(JSON.parse(process.env.HERO_DISABLE_DEVTOOLS ?? 'false')),
      noChromeSandbox: Boolean(JSON.parse(process.env.HERO_NO_CHROME_SANDBOX ?? 'false')),
      disableGpu: Boolean(JSON.parse(process.env.HERO_DISABLE_GPU ?? 'false')),
      enableMitm: !disableMitm,
    };
    return {
      ...this.defaultLaunchArgs,
      proxyPort: this.mitmServer?.port,
    };
  }

  private static isSameEngine(engineA: IBrowserEngine, engineB: IBrowserEngine): boolean {
    return (
      engineA.executablePath === engineB.executablePath &&
      engineA.launchArguments.toString() === engineB.launchArguments.toString()
    );
  }
}
