import Log from '@secret-agent/commons/Logger';
import puppeteer, { LaunchOptions } from 'puppeteer';
import Session from './Session';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';

const { log } = Log(module);

let puppBrowserCounter = 1;

export default class ChromeCore {
  public readonly id: number;
  public isStarted: boolean;
  public isShuttingDown: boolean;
  public readonly isShowingBrowser = !!process.env.SHOW_BROWSER;
  private puppBrowserPromise: Promise<puppeteer.Browser>;
  private readonly sessionsById: { [id: string]: Session } = {};

  public get activeSessions() {
    return Object.keys(this.sessionsById).length;
  }

  constructor() {
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
    this.puppBrowserPromise = new Promise(async (resolve, reject) => {
      let tickerInterval;
      let killTimer;
      try {
        log.info(null, 'StartingChromeCore', { id: this.id });

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
        options.userDataDir = '/tmp/core-engine';
        options.executablePath = process.env.CHROME_BIN || null;
        options.defaultViewport = null;

        options.args = puppeteer
          .defaultArgs()
          .filter(arg => !argsToSkip.includes(arg))
          .concat(options.args);

        log.info(null, 'ChromeStarting', { path: options.executablePath, args: options.args });

        tickerInterval = setInterval(
          () => log.info(null, 'ChromeStillStarting', { id: this.id }),
          5000,
        ).unref();
        killTimer = setTimeout(
          () => reject(new Error(`Could not launch puppeteer ${this.id}!`)),
          30000,
        ).unref();
        const puppBrowser = await puppeteer.launch(options);

        const pages = await puppBrowser.pages();
        await Promise.all(pages.map(async x => x.close())).catch(error => {
          log.warn('Error closing initial chrome browser page', error);
        });
        log.info(null, 'ChromeStarted', { id: this.id });
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

  public async isReady() {
    await this.puppBrowserPromise;
    return true;
  }

  public async createSession(ctxOptions: ICreateSessionOptions) {
    const puppBrowser = await this.getBrowser();
    if (this.isShuttingDown) {
      return;
    }
    const session = await Session.create(puppBrowser, this, ctxOptions);
    this.sessionsById[session.id] = session;
    return session;
  }

  public cleanupSession(sessionId: string) {
    delete this.sessionsById[sessionId];
  }

  public getSession(sessionId: string): Session {
    return this.sessionsById[sessionId];
  }

  public async close() {
    log.info(null, 'ClosingChrome');
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    this.isStarted = false;
    try {
      if (this.puppBrowserPromise) {
        const puppBrowser = await this.getBrowser();
        this.puppBrowserPromise = null;
        if (puppBrowser) await puppBrowser.close();
      }
    } catch (error) {
      log.error(null, 'ClosingChromeError', error);
    }
  }

  private async getBrowser() {
    return this.puppBrowserPromise;
  }
}
