import PuppetChrome from '@secret-agent/puppet-chrome';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import Log from '@secret-agent/commons/Logger';
import IPuppetLauncher from '@secret-agent/puppet-interfaces/IPuppetLauncher';
import IPuppetBrowser from '@secret-agent/puppet-interfaces/IPuppetBrowser';
import IBrowserEmulationSettings from '@secret-agent/puppet-interfaces/IBrowserEmulationSettings';
import IBrowserEngine from '@secret-agent/core-interfaces/IBrowserEngine';
import launchProcess from './lib/launchProcess';

const { log } = Log(module);

let puppBrowserCounter = 1;
export default class Puppet {
  public readonly id: number;
  public readonly engine: IBrowserEngine;
  public isShuttingDown: boolean;
  private browser: Promise<IPuppetBrowser>;

  constructor(engine: IBrowserEngine) {
    this.engine = engine;
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
    const launchedProcess = launchProcess(
      this.engine.executablePath,
      launchArgs,
      {},
      pipeBrowserIo,
    );
    this.browser = launcher.createPuppet(launchedProcess, this.engine.revision);
  }

  public async newContext(emulation: IBrowserEmulationSettings, logger: IBoundLog) {
    const browser = await this.browser;
    if (this.isShuttingDown) throw new Error('Shutting down');
    return browser.newContext(emulation, logger);
  }

  public async close() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    log.stats('Puppet.Closing');

    const browserPromise = this.browser;
    this.browser = null;

    try {
      const browser = await browserPromise;
      if (browser) await browser.close();
    } catch (error) {
      log.error('Puppet.Closing:Error', { sessionId: null, error });
    }
  }
}
