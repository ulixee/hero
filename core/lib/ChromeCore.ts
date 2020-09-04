import Log from '@secret-agent/commons/Logger';
import launch from '@secret-agent/puppet-chrome';
import { Browser } from '@secret-agent/puppet-chrome/lib/Browser';

const { log } = Log(module);

let puppBrowserCounter = 1;

export default class ChromeCore {
  public readonly id: number;
  public isShuttingDown: boolean;
  public readonly executablePath: string;
  private browserPromise: Promise<Browser>;

  constructor(chromePath: string) {
    this.executablePath = chromePath;
    this.isShuttingDown = false;
    this.id = puppBrowserCounter;
    this.browserPromise = null;
    puppBrowserCounter += 1;
  }

  public start(proxyPort?: number) {
    if (this.browserPromise) {
      return;
    }
    this.isShuttingDown = false;
    this.browserPromise = launch({
      proxyPort,
      executablePath: this.executablePath,
      showBrowser: !!process.env.SHOW_BROWSER,
      dumpio: !!process.env.DEBUG,
    });
  }

  public async createContext() {
    const browser = await this.browserPromise;
    if (this.isShuttingDown) {
      return;
    }
    return await browser.newContext();
  }

  public async close() {
    log.info('ClosingChrome');
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    const browserPromise = this.browserPromise;
    this.browserPromise = null;

    try {
      const browser = await browserPromise;
      if (browser) await browser.close();
    } catch (error) {
      log.error('ClosingChromeError', { sessionId: null, error });
    }
  }
}
