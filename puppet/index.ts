import PuppetChrome from '@secret-agent/puppet-chrome';
import { IBoundLog } from '@secret-agent/interfaces/ILog';
import Log from '@secret-agent/commons/Logger';
import IPuppetLauncher from '@secret-agent/interfaces/IPuppetLauncher';
import IPuppetBrowser from '@secret-agent/interfaces/IPuppetBrowser';
import IBrowserEngine from '@secret-agent/interfaces/IBrowserEngine';
import IPlugins from '@secret-agent/interfaces/IPlugins';
import IProxyConnectionOptions from '@secret-agent/interfaces/IProxyConnectionOptions';
import IPuppetLaunchArgs from '@secret-agent/interfaces/IPuppetLaunchArgs';
import IPuppetContext from '@secret-agent/interfaces/IPuppetContext';
import launchProcess from './lib/launchProcess';
import PuppetLaunchError from './lib/PuppetLaunchError';

const { log } = Log(module);

let puppBrowserCounter = 1;
export default class Puppet {
  public readonly id: number;
  public readonly browserEngine: IBrowserEngine;
  public supportsBrowserContextProxy: boolean;
  private readonly launcher: IPuppetLauncher;
  private isShuttingDown = false;
  private isStarted = false;
  private browser: IPuppetBrowser;

  constructor(browserEngine: IBrowserEngine, args: IPuppetLaunchArgs = {}) {
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

  public async start(): Promise<Puppet> {
    try {
      this.isStarted = true;

      if (this.browserEngine.verifyLaunchable) {
        await this.browserEngine.verifyLaunchable();
      }

      const launchedProcess = await launchProcess(
        this.browserEngine.executablePath,
        this.browserEngine.launchArguments,
      );

      this.browser = await this.launcher.createPuppet(launchedProcess, this.browserEngine);

      const features = await this.browser.getFeatures();
      this.supportsBrowserContextProxy = features?.supportsPerBrowserContextProxy ?? false;

      return this;
    } catch (err) {
      const launchError = this.launcher.translateLaunchError(err);
      throw new PuppetLaunchError(
        launchError.message,
        launchError.stack,
        launchError.isSandboxError,
      );
    }
  }

  public isSameEngine(other: Puppet): boolean {
    return (
      this.browserEngine.executablePath === other.browserEngine.executablePath &&
      this.browserEngine.launchArguments.toString() ===
        other.browserEngine.launchArguments.toString()
    );
  }

  public newContext(
    plugins: IPlugins,
    logger: IBoundLog,
    proxy?: IProxyConnectionOptions,
  ): Promise<IPuppetContext> {
    if (!this.isStarted || !this.browser) {
      throw new Error('This Puppet instance has not had start() called on it');
    }
    if (this.isShuttingDown) throw new Error('Shutting down');
    return this.browser.newContext(plugins, logger, proxy);
  }

  public async close() {
    if (this.isShuttingDown || !this.isStarted) return;
    this.isShuttingDown = true;
    log.stats('Puppet.Closing');

    try {
      await this.browser?.close();
    } catch (error) {
      log.error('Puppet.Closing:Error', { sessionId: null, error });
    } finally {
      log.stats('Puppet.closed');
    }
  }
}
