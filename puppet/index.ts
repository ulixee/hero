import PuppetChrome from '@secret-agent/puppet-chrome';
import { debug } from '@secret-agent/commons/Debug';
import launchProcess from './lib/launchProcess';
import IPuppetLauncher from './interfaces/IPuppetLauncher';
import IPuppetBrowser from './interfaces/IPuppetBrowser';
import IBrowserEmulation from './interfaces/IBrowserEmulation';

const debugLauncher = debug(`puppet:launch`);

let puppBrowserCounter = 1;
export default class Puppet {
  public readonly id: number;
  public engine: { browser: string; revision: string };
  public isShuttingDown: boolean;
  public readonly executablePath: string;
  private browser: Promise<IPuppetBrowser>;

  constructor(startParams: {
    engine: { browser: string; revision: string };
    engineExecutablePath: string;
  }) {
    this.engine = startParams.engine;
    this.executablePath = startParams.engineExecutablePath;
    this.isShuttingDown = false;
    this.id = puppBrowserCounter;
    this.browser = null;
    puppBrowserCounter += 1;
  }

  public start(
    args: {
      proxyPort?: number;
      showBrowser?: boolean;
      pipeBrowserIo?: boolean;
    } = {
      showBrowser: false,
      pipeBrowserIo: false,
    },
  ) {
    if (this.browser) {
      return;
    }
    const { proxyPort, showBrowser, pipeBrowserIo } = args;
    this.isShuttingDown = false;

    let launcher: IPuppetLauncher;
    if (this.engine.browser === 'chrome' || this.engine.browser === 'chromium') {
      launcher = PuppetChrome;
    }

    const launchArgs = launcher.getLaunchArgs({ proxyPort, showBrowser });
    const launchedProcess = launchProcess(this.executablePath, launchArgs, {}, pipeBrowserIo);
    this.browser = launcher.createPuppet(launchedProcess, this.engine.revision);
  }

  public async newContext(emulation: IBrowserEmulation) {
    const browser = await this.browser;
    if (this.isShuttingDown) throw new Error('Shutting down');
    return browser.newContext(emulation);
  }

  public async close() {
    debugLauncher('Closing puppet browser');
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    const browserPromise = this.browser;
    this.browser = null;

    try {
      const browser = await browserPromise;
      if (browser) await browser.close();
    } catch (error) {
      debugLauncher('ClosingPuppetError', { sessionId: null, error });
    }
  }
}
