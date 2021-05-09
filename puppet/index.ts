import PuppetChrome from '@secret-agent/puppet-chrome';
import { IBoundLog } from '@secret-agent/interfaces/ILog';
import Log from '@secret-agent/commons/Logger';
import IPuppetLauncher from '@secret-agent/interfaces/IPuppetLauncher';
import IPuppetBrowser from '@secret-agent/interfaces/IPuppetBrowser';
import IBrowserEngine from '@secret-agent/interfaces/IBrowserEngine';
import Resolvable from '@secret-agent/commons/Resolvable';
import IPlugins from '@secret-agent/interfaces/IPlugins';
import IProxyConnectionOptions from '@secret-agent/interfaces/IProxyConnectionOptions';
import IPuppetLaunchArgs from '@secret-agent/interfaces/IPuppetLaunchArgs';
import launchProcess from './lib/launchProcess';
import PuppetLaunchError from './lib/PuppetLaunchError';

const { log } = Log(module);

let puppBrowserCounter = 1;
export default class Puppet {
  public readonly id: number;
  public readonly browserEngine: IBrowserEngine;
  public isShuttingDown: boolean;
  public get supportsBrowserContextProxy(): Promise<boolean> {
    return this.browserFeaturesPromise.promise;
  }

  private browserFeaturesPromise = new Resolvable<boolean>();
  private browserOrError: Promise<IPuppetBrowser | Error>;

  public get isReady(): Promise<IPuppetBrowser> {
    return this.browserOrError.then(x => {
      if (x instanceof Error) throw x;
      return x;
    });
  }

  constructor(browserEngine: IBrowserEngine) {
    this.browserEngine = browserEngine;
    this.isShuttingDown = false;
    this.id = puppBrowserCounter;
    this.browserOrError = null;
    puppBrowserCounter += 1;
  }

  public start(args: IPuppetLaunchArgs = {}): Promise<IPuppetBrowser | Error> {
    if (this.browserOrError) {
      return this.browserOrError;
    }
    this.isShuttingDown = false;

    let launcher: IPuppetLauncher;
    if (this.browserEngine.name === 'chrome') {
      launcher = PuppetChrome;
    }

    this.browserOrError = this.launchEngine(launcher, args).catch(err => err);
    return this.browserOrError;
  }

  public async newContext(
    plugins: IPlugins,
    logger: IBoundLog,
    proxy?: IProxyConnectionOptions,
  ) {
    const browser = await this.browserOrError;
    if (browser instanceof Error) throw browser;
    if (this.isShuttingDown) throw new Error('Shutting down');
    return browser.newContext(plugins, logger, proxy);
  }

  public async close() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    log.stats('Puppet.Closing');

    const browserPromise = this.browserOrError;
    this.browserOrError = null;

    try {
      const browser = await browserPromise;
      if (browser && !(browser instanceof Error)) await browser.close();
    } catch (error) {
      log.error('Puppet.Closing:Error', { sessionId: null, error });
    }
  }

  private async launchEngine(
    launcher: IPuppetLauncher,
    args: IPuppetLaunchArgs,
  ): Promise<IPuppetBrowser> {
    try {
      const launchArgs = launcher.getLaunchArgs(args, this.browserEngine);

      if (this.browserEngine.verifyLaunchable) await this.browserEngine.verifyLaunchable();

      const launchedProcess = await launchProcess(this.browserEngine.executablePath, launchArgs, {});

      const browser = await launcher.createPuppet(launchedProcess, this.browserEngine);

      const features = await browser.getFeatures();

      this.browserFeaturesPromise.resolve(features?.supportsPerBrowserContextProxy);
      return browser;
    } catch (err) {
      const launchError = launcher.translateLaunchError(err);
      throw new PuppetLaunchError(
        launchError.message,
        launchError.stack,
        launchError.isSandboxError,
      );
    }
  }
}
