import PuppetChrome from '@secret-agent/puppet-chrome';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import Log from '@secret-agent/commons/Logger';
import IPuppetLauncher from '@secret-agent/puppet-interfaces/IPuppetLauncher';
import IPuppetBrowser from '@secret-agent/puppet-interfaces/IPuppetBrowser';
import IBrowserEmulationSettings from '@secret-agent/puppet-interfaces/IBrowserEmulationSettings';
import IBrowserEngine from '@secret-agent/core-interfaces/IBrowserEngine';
import { existsSync } from 'fs';
import launchProcess from './lib/launchProcess';
import { validateHostRequirements } from './lib/validateHostDependencies';
import { EngineFetcher } from './lib/EngineFetcher';

const { log } = Log(module);

let puppBrowserCounter = 1;
export default class Puppet {
  public readonly id: number;
  public readonly engine: IBrowserEngine;
  public isShuttingDown: boolean;
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

  public start(
    args: ILaunchArgs = {
      showBrowser: false,
      pipeBrowserIo: false,
    },
  ): Promise<IPuppetBrowser | Error> {
    if (this.browserOrError) {
      return this.browserOrError;
    }
    this.isShuttingDown = false;

    let launcher: IPuppetLauncher;
    if (this.engine.browser === 'chrome' || this.engine.browser === 'chromium') {
      launcher = PuppetChrome;
    }

    this.browserOrError = this.launchEngine(launcher, args).catch(err => err);
    return this.browserOrError;
  }

  public async newContext(emulation: IBrowserEmulationSettings, logger: IBoundLog) {
    const browser = await this.browserOrError;
    if (browser instanceof Error) throw browser;
    if (this.isShuttingDown) throw new Error('Shutting down');
    return browser.newContext(emulation, logger);
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
      const { pipeBrowserIo, proxyPort, showBrowser } = args;
      const launchArgs = launcher.getLaunchArgs({ showBrowser, proxyPort });

      if (this.engine.extraLaunchArgs?.length) {
        launchArgs.push(...this.engine.extraLaunchArgs);
      }
      const launchedProcess = await launchProcess(executablePath, launchArgs, {}, pipeBrowserIo);
      return launcher.createPuppet(launchedProcess, this.engine);
    } catch (err) {
      // exists, but can't launch, try to launch
      await validateHostRequirements(this.engine.executablePath);

      throw launcher.translateLaunchError(err);
    }
  }

  private async noExecutableAtPathError(executablePath: string): Promise<Error> {
    const engineFetcher = new EngineFetcher(
      this.engine.browser,
      this.engine.version,
      this.engine.executablePathEnvVar,
    );

    let remedyMessage = `No executable exists at "${executablePath}"`;

    // If we tried using stock downloaded browser, suggest further installation directions
    if (executablePath === engineFetcher.executablePath) {
      const installCommand = await engineFetcher.getPendingInstallCommand();
      if (installCommand) {
        remedyMessage = `Please run the following command:
-------------- APT INSTALL NEEDED ---------------
-------------------------------------------------

${installCommand}

-------------------------------------------------
`;
      } else {
        const majorBrowserVersion = this.engine.version.split('.').shift();
        remedyMessage = `Please re-install the browser engine:
-------------- NPM INSTALL ----------------------
-------------------------------------------------

 npm install @secret-agent/emulate-chrome-${majorBrowserVersion}

-------------------------------------------------
`;
      }
    }

    return new Error(`Failed to launch ${this.engine.browser} ${this.engine.version}:

${remedyMessage}`);
  }
}

interface ILaunchArgs {
  proxyPort?: number;
  showBrowser?: boolean;
  pipeBrowserIo?: boolean;
}
