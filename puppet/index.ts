import PuppetChrome from '@ulixee/hero-puppet-chrome';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import Log from '@ulixee/commons/lib/Logger';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import IPuppetLauncher from '@ulixee/hero-interfaces/IPuppetLauncher';
import IPuppetBrowser from '@ulixee/hero-interfaces/IPuppetBrowser';
import IBrowserEngine from '@ulixee/hero-interfaces/IBrowserEngine';
import ICorePlugins from '@ulixee/hero-interfaces/ICorePlugins';
import IProxyConnectionOptions from '@ulixee/hero-interfaces/IProxyConnectionOptions';
import IPuppetLaunchArgs from '@ulixee/hero-interfaces/IPuppetLaunchArgs';
import IPuppetContext from '@ulixee/hero-interfaces/IPuppetContext';
import IDevtoolsSession from '@ulixee/hero-interfaces/IDevtoolsSession';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import BrowserProcess from './lib/BrowserProcess';
import PuppetLaunchError from './lib/PuppetLaunchError';

const { log } = Log(module);

let puppBrowserCounter = 1;
export default class Puppet extends TypedEventEmitter<{ close: void }> {
  public get browserId(): string {
    return this.browser?.id;
  }

  public readonly id: number;
  public readonly browserEngine: IBrowserEngine;
  public supportsBrowserContextProxy: boolean;
  public isReady = new Resolvable<void | Error>();
  public isStarted = false;
  private readonly launcher: IPuppetLauncher;
  private isShuttingDown: Promise<Error | void>;
  private browser: IPuppetBrowser;

  constructor(browserEngine: IBrowserEngine, args: IPuppetLaunchArgs = {}) {
    super();
    this.browserEngine = browserEngine;
    this.id = puppBrowserCounter;
    if (browserEngine.name === 'chrome') {
      if (browserEngine.isHeaded) args.showBrowser = true;
      PuppetChrome.getLaunchArgs(args, browserEngine);
      this.launcher = PuppetChrome;
    } else {
      throw new Error(`No Puppet launcher available for ${this.browserEngine.name}`);
    }
    puppBrowserCounter += 1;
  }

  public async start(
    attachToDevtools?: (session: IDevtoolsSession) => Promise<any>,
  ): Promise<Puppet> {
    const parentLogId = log.info('Puppet.Starting', {
      sessionId: null,
      name: this.browserEngine.name,
      fullVersion: this.browserEngine.fullVersion,
    });
    if (this.isStarted) {
      await this.isReady.promise;
      return this;
    }
    try {
      this.isStarted = true;

      if (this.browserEngine.verifyLaunchable) {
        await this.browserEngine.verifyLaunchable();
      }

      const launchedProcess = new BrowserProcess(this.browserEngine);
      const hasError = await launchedProcess.hasLaunchError;
      if (hasError) throw hasError;
      launchedProcess.on('close', () => {
        this.emit('close');
        this.removeAllListeners();
      });

      this.browser = await this.launcher.createPuppet(launchedProcess, this.browserEngine);
      this.browser.onDevtoolsPanelAttached = attachToDevtools;

      this.supportsBrowserContextProxy = this.browser.majorVersion >= 85;

      this.isReady.resolve();
      log.stats('Puppet.Started', {
        sessionId: null,
        parentLogId,
      });
      return this;
    } catch (err) {
      const launchError = this.launcher.translateLaunchError(err);
      const puppetLaunchError = new PuppetLaunchError(
        launchError.message,
        launchError.stack,
        launchError.isSandboxError,
      );
      this.isReady.reject(puppetLaunchError);
      log.stats('Puppet.LaunchError', {
        puppetLaunchError,
        sessionId: null,
        parentLogId,
      });
      await this.isReady.promise;
    }
  }

  public async newContext(
    plugins: ICorePlugins,
    logger: IBoundLog,
    proxy?: IProxyConnectionOptions,
    isIncognito = true,
  ): Promise<IPuppetContext> {
    if (!this.isReady) throw new CanceledPromiseError('This Puppet has been shut down');
    await this.isReady.promise;
    if (!this.browser) {
      throw new Error('This Puppet instance has not had start() called on it');
    }
    if (this.isShuttingDown) throw new Error('Shutting down');
    return this.browser.newContext(plugins, logger, proxy, isIncognito);
  }

  public async close(): Promise<void | Error> {
    if (!this.isStarted) return;
    if (this.isShuttingDown) return this.isShuttingDown;

    const parentLogId = log.stats('Puppet.Closing');

    try {
      // if we started to get ready, clear out now
      this.isStarted = false;
      if (this.isReady) {
        const err = await this.isReady.catch(startError => startError);
        this.isReady = null;
        if (err) return;
      }

      this.isShuttingDown = this.browser?.close();
      await this.isShuttingDown;
    } catch (error) {
      log.error('Puppet.Closing:Error', { parentLogId, sessionId: null, error });
    } finally {
      this.emit('close');
      this.removeAllListeners();
      log.stats('Puppet.Closed', { parentLogId, sessionId: null });
    }
  }
}
