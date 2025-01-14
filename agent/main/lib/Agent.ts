import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Log from '@ulixee/commons/lib/Logger';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import '@ulixee/commons/lib/SourceMapSupport';
import { RequestSession } from '@ulixee/unblocked-agent-mitm';
import MitmProxy from '@ulixee/unblocked-agent-mitm/lib/MitmProxy';
import { IHooksProvider } from '@ulixee/unblocked-specification/agent/hooks/IHooks';
import IEmulationProfile, {
  IEmulationOptions,
} from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import {
  IUnblockedPluginClass,
  PluginConfigs,
} from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
import { nanoid } from 'nanoid';
import env from '../env';
import ICommandMarker from '../interfaces/ICommandMarker';
import IProxyConnectionOptions from '../interfaces/IProxyConnectionOptions';
import Browser from './Browser';
import BrowserContext from './BrowserContext';
import Page from './Page';
import Plugins from './Plugins';
import Pool from './Pool';

const { log } = Log(module);

export interface IAgentCreateOptions extends Omit<IEmulationProfile, keyof IEmulationOptions> {
  id?: string;
  plugins?: IUnblockedPluginClass[];
  pluginConfigs?: PluginConfigs;
  commandMarker?: ICommandMarker;
}

export default class Agent extends TypedEventEmitter<{ close: void }> {
  public readonly id: string;
  public browserContext: BrowserContext;
  public readonly mitmRequestSession: RequestSession;
  public readonly logger: IBoundLog;
  public readonly plugins: Plugins;

  public get emulationProfile(): IEmulationProfile {
    return this.plugins.profile;
  }

  public get isIncognito(): boolean {
    return this.plugins.profile.options.disableIncognito !== true;
  }

  private isOpen: Resolvable<BrowserContext>;
  private isClosing: Resolvable<void>;
  private events = new EventSubscriber();
  private readonly enableMitm: boolean = true;
  private readonly closeBrowserOnClose: boolean = false;
  private isolatedMitm: MitmProxy;

  private secretKey = nanoid();

  private get proxyConnectionInfo(): IProxyConnectionOptions {
    if (!this.enableMitm) {
      if (!this.emulationProfile.upstreamProxyUrl) return null;
      const url = new URL(this.emulationProfile.upstreamProxyUrl);
      return { address: url.origin, username: url.username, password: url.password };
    }
    if (this.isolatedMitm) {
      // don't use password for an isolated mitm proxy
      return { address: `localhost:${this.isolatedMitm.port}` };
    }
    return { address: null, password: this.id };
  }

  constructor(
    private readonly options: IAgentCreateOptions = {},
    readonly pool?: Pool,
  ) {
    super();
    this.id = options.id ?? nanoid();
    if (!this.pool) {
      this.pool = new Pool({ maxConcurrentAgents: 1 });
      this.events.once(this, 'close', () => this.pool.close());
      this.closeBrowserOnClose = true;
    }

    this.logger =
      options.logger?.createChild(module) ??
      log.createChild(module, {
        sessionId: this.id,
      });

    this.plugins = new Plugins(options, options.plugins, options.pluginConfigs);
    this.mitmRequestSession = new RequestSession(
      this.id,
      this.plugins,
      this.logger,
      this.plugins.profile.upstreamProxyUrl,
      this.plugins.profile.upstreamProxyUseLocalDns,
    );
    this.enableMitm = !env.disableMitm && !this.plugins.profile.options.disableMitm;

    this.logger.info('Agent created', {
      id: this.id,
      incognito: this.isIncognito,
      hasHooks: !!this.plugins.hasHooks,
      browserEngine: this.plugins.profile.browserEngine
        ? { fullVersion: this.plugins.profile.browserEngine.fullVersion }
        : 'unassigned',
    });
  }

  public async open(): Promise<BrowserContext> {
    if (this.isOpen) return this.isOpen.promise;
    this.isOpen = new Resolvable();
    try {
      if (!this.options.browserEngine)
        throw new Error('A browserEngine is required to create a new Agent instance.');

      const pool = this.pool;
      await pool.waitForAvailability(this);
      const browser = await pool.getBrowser(
        this.options.browserEngine,
        this.id,
        this.plugins,
        this.plugins.profile.options,
      );
      if (this.closeBrowserOnClose) {
        this.events.once(this, 'close', () => browser.close());
      }
      this.events.once(browser, 'close', () => this.close());

      if (this.enableMitm) {
        if (browser.supportsBrowserContextProxy && this.isIncognito) {
          const mitmProxy = await pool.createMitmProxy();
          this.isolatedMitm = mitmProxy;
          // register session will automatically close with the request session
          mitmProxy.registerSession(this.mitmRequestSession, true);
        } else {
          pool.sharedMitmProxy.registerSession(this.mitmRequestSession, false);
        }
      }

      this.logger.info('Agent Opening in Pool', {
        id: this.id,
        browserId: browser.id,
        mitmEnabled: this.enableMitm,
        usingIsolatedMitm: !!this.isolatedMitm,
        isIncognito: this.isIncognito,
      });

      const context = await this.createBrowserContext(browser);
      this.isOpen?.resolve(context);
      return context;
    } catch (err) {
      const openPromise = this.isOpen;
      await this.close();
      if (openPromise) {
        openPromise.reject(err);
      }
      return openPromise;
    }
  }

  public async newPage(): Promise<Page> {
    if (!this.browserContext) await this.open();
    return this.browserContext.newPage();
  }

  public hook(hooks: IHooksProvider): this {
    this.plugins.hook(hooks);
    return this;
  }

  public async close(): Promise<void> {
    if (this.isClosing) return this.isClosing;

    const id = this.logger.info('Agent.Closing');
    this.isClosing = new Resolvable();
    try {
      await this.browserContext?.close();
    } catch (error) {
      this.logger.warn('Agent.CloseBrowserContextError', { error });
    }

    try {
      this.mitmRequestSession.close();
    } catch (error) {
      this.logger.warn('Agent.CloseMitmRequestSessionError', { error });
    }

    try {
      this.isolatedMitm?.close();
    } catch (error) {
      this.logger.warn('Agent.CloseIsolatedError', { error });
    }

    try {
      this.emit('close');
      this.events.close();
      this.plugins.onClose();
      this.cleanup();
    } catch (error) {
      this.logger.warn('Agent.CloseError', { parentLogId: id, error });
    } finally {
      this.logger.stats('Agent.Closed', { parentLogId: id });
      this.isClosing.resolve();
    }
    return this.isClosing;
  }

  protected async createBrowserContext(browser: Browser): Promise<BrowserContext> {
    this.browserContext = await browser.newContext({
      logger: this.logger,
      proxy: this.proxyConnectionInfo,
      hooks: this.plugins,
      isIncognito: this.isIncognito,
      commandMarker: this.options.commandMarker,
      secretKey: this.secretKey,
    });
    this.events.once(this.browserContext, 'close', () => this.close());

    if (this.enableMitm) {
      // hook request session to browserContext (this is how RequestSession subscribes to new page creations)
      this.plugins.hook(this.mitmRequestSession);
      const requestSession = this.mitmRequestSession;
      this.browserContext.resources.connectToMitm(requestSession);
      await this.plugins.onHttpAgentInitialized(requestSession.requestAgent);
    } else {
      await this.plugins.onHttpAgentInitialized(null);
    }

    return this.browserContext;
  }

  private cleanup(): void {
    this.browserContext = null;
    this.isOpen = null;
    this.isolatedMitm = null;
    this.options.commandMarker = null;
  }
}
