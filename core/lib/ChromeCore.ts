import Log from '@secret-agent/commons/Logger';
import puppeteer, { LaunchOptions } from 'puppeteer-core';
import os from 'os';
import Path from 'path';

const { log } = Log(module);

let puppBrowserCounter = 1;

export default class ChromeCore {
  public readonly id: number;
  public isStarted: boolean;
  public isShuttingDown: boolean;
  public readonly isShowingBrowser = !!process.env.SHOW_BROWSER;
  public readonly executablePath: string;
  private puppBrowserPromise: Promise<puppeteer.Browser>;

  constructor(chromePath: string) {
    this.executablePath = chromePath;
    this.isStarted = false;
    this.isShuttingDown = false;
    this.id = puppBrowserCounter;
    this.puppBrowserPromise = null;
    puppBrowserCounter += 1;
  }

  // MAIN ////////////////////////////////////////////////////////////////////////////////////////////

  public start(proxyPort?: number) {
    if (this.puppBrowserPromise) {
      return;
    }
    this.isShuttingDown = false;
    this.puppBrowserPromise = new Promise<puppeteer.Browser>(async (resolve, reject) => {
      let tickerInterval;
      let killTimer;
      try {
        log.info('StartingChromeCore', { id: this.id, sessionId: null });

        const options: LaunchOptions = {
          args: [
            '--lang=en-US,en;q=0.9',
            '--disable-features=site-per-process',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--ignore-certificate-errors',
            '--allow-running-insecure-content',
            '--use-gl=swiftshader-webgl',
            '--use-gl=swiftshader',
            '--use-gl=osmesa',
            '--window-size=1920,1080',
            '--window-position=77,100',
            // don't leak private ip
            '--force-webrtc-ip-handling-policy=default_public_interface_only',
            // Use proxy for localhost URLs
            '--proxy-bypass-list=<-loopback>',
          ],
          handleSIGHUP: false,
          handleSIGINT: false,
          handleSIGTERM: false,
        };
        const argsToSkip = ['--disable-popup-blocking', 'about:blank'];

        if (this.isShowingBrowser) {
          argsToSkip.push('--headless');
          options.headless = false;
          options.devtools = true;
        }
        if (proxyPort) {
          options.args.push(`--proxy-server=localhost:${proxyPort}`);
        }
        options.ignoreDefaultArgs = true;
        options.ignoreHTTPSErrors = true;
        options.userDataDir = Path.join(os.tmpdir(), 'core-engine');
        options.executablePath = this.executablePath;
        options.defaultViewport = null;

        options.args = puppeteer
          .defaultArgs()
          .filter(arg => !argsToSkip.includes(arg))
          .concat(options.args);

        log.info('ChromeStarting', {
          path: options.executablePath,
          args: options.args,
          sessionId: null,
        });

        tickerInterval = setInterval(
          () => log.info('ChromeStillStarting', { id: this.id, sessionId: null }),
          5000,
        ).unref();
        killTimer = setTimeout(
          () => reject(new Error(`Could not launch puppeteer ${this.id}!`)),
          30000,
        ).unref();
        const puppBrowser = await puppeteer.launch(options);

        const pages = await puppBrowser.pages();
        await Promise.all(pages.map(async x => x.close())).catch(error => {
          log.warn('Error closing initial chrome browser page', { error, sessionId: null });
        });
        log.info('ChromeStarted', { id: this.id, sessionId: null });
        this.isStarted = true;
        resolve(puppBrowser);
      } catch (error) {
        reject(error);
      } finally {
        if (tickerInterval) clearInterval(tickerInterval);
        if (killTimer) clearTimeout(killTimer);
      }
    });
  }

  public async createContext() {
    const puppBrowser = await this.puppBrowserPromise;
    if (this.isShuttingDown) {
      return;
    }
    return await puppBrowser.createIncognitoBrowserContext();
  }

  public async close() {
    log.info('ClosingChrome');
    if (this.isShuttingDown) return;
    const browserPromise = this.puppBrowserPromise;

    this.isShuttingDown = true;
    this.isStarted = false;
    this.puppBrowserPromise = null;

    try {
      const puppBrowser = await browserPromise;
      if (puppBrowser) await puppBrowser.close();
    } catch (error) {
      log.error('ClosingChromeError', { sessionId: null, error });
    }
  }
}
