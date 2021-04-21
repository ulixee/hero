import PuppetChrome from '@secret-agent/puppet-chrome';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import Log from '@secret-agent/commons/Logger';
import IPuppetLauncher from '@secret-agent/core-interfaces/IPuppetLauncher';
import IPuppetBrowser from '@secret-agent/core-interfaces/IPuppetBrowser';
import IBrowserEngine from '@secret-agent/core-interfaces/IBrowserEngine';
import { existsSync } from 'fs';
import Resolvable from '@secret-agent/commons/Resolvable';
import IBrowserEmulator from '@secret-agent/core-interfaces/IBrowserEmulator';
import IProxyConnectionOptions from '@secret-agent/core-interfaces/IProxyConnectionOptions';
import launchProcess from './lib/launchProcess';
import { validateHostRequirements } from './lib/validateHostDependencies';
import { EngineFetcher } from './lib/EngineFetcher';
import PuppetLaunchError from './lib/PuppetLaunchError';

const { log } = Log(module);

let puppBrowserCounter = 1;
export default class Puppet {
  public readonly id: number;
  public readonly engine: IBrowserEngine;
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

  constructor(engine: IBrowserEngine) {
    this.engine = engine;
    this.isShuttingDown = false;
    this.id = puppBrowserCounter;
    this.browserOrError = null;
    puppBrowserCounter += 1;
  }

  public start(args: ILaunchArgs = {}): Promise<IPuppetBrowser | Error> {
    if (this.browserOrError) {
      return this.browserOrError;
    }
    this.isShuttingDown = false;

    let launcher: IPuppetLauncher;
    if (this.engine.name === 'chrome') {
      launcher = PuppetChrome;
    }

    this.browserOrError = this.launchEngine(launcher, args).catch(err => err);
    return this.browserOrError;
  }

  public async newContext(
    emulator: IBrowserEmulator,
    logger: IBoundLog,
    proxy?: IProxyConnectionOptions,
  ) {
    const browser = await this.browserOrError;
    if (browser instanceof Error) throw browser;
    if (this.isShuttingDown) throw new Error('Shutting down');
    return browser.newContext(emulator, logger, proxy);
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
    args: ILaunchArgs,
  ): Promise<IPuppetBrowser> {
    const executablePath = this.engine.executablePath;

    if (!existsSync(executablePath)) {
      throw await this.noExecutableAtPathError(executablePath);
    }

    try {
      const launchArgs = launcher.getLaunchArgs(args);

      // exists, but can't launch, try to launch
      await validateHostRequirements(this.engine);

      if (this.engine.extraLaunchArgs?.length) {
        launchArgs.push(...this.engine.extraLaunchArgs);
      }
      const launchedProcess = await launchProcess(executablePath, launchArgs, {});

      const browser = await launcher.createPuppet(launchedProcess, this.engine);

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

  private noExecutableAtPathError(executablePath: string): Error {
    const engineFetcher = new EngineFetcher(this.engine.name, this.engine.fullVersion);

    let remedyMessage = `No executable exists at "${executablePath}"`;

    // If this is the default install path, suggest further installation directions
    if (executablePath === engineFetcher.executablePath) {
      const majorBrowserVersion = this.engine.fullVersion.split('.').shift();
      remedyMessage = `Please re-install the browser engine:
-------------------------------------------------
-------------- NPM INSTALL ----------------------
-------------------------------------------------

 npm install @secret-agent/emulate-${this.engine.name}-${majorBrowserVersion}

-------------------------------------------------
`;
    }

    return new Error(`Failed to launch ${this.engine.name} ${this.engine.fullVersion}:

${remedyMessage}`);
  }
}

export interface ILaunchArgs {
  proxyPort?: number;
  showBrowser?: boolean;
  disableDevtools?: boolean;
  disableGpu?: boolean;
  noChromeSandbox?: boolean;
}
