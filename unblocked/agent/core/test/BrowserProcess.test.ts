import { BrowserUtils, TestLogger, Helpers } from '@ulixee/unblocked-agent-testing/index';
import { Browser } from '../index';
import * as Os from 'os';
import BrowserLaunchError from '../errors/BrowserLaunchError';

afterEach(Helpers.afterEach);
beforeEach(async () => {
  TestLogger.testNumber += 1;
});

describe('launchProcess', () => {
  it('should reject all promises when browser is closed', async () => {
    const browserEngine = { ...BrowserUtils.defaultBrowserEngine };
    const browser = new Browser(browserEngine);
    Helpers.needsClosing.push(browser);
    await browser.launch();
    const logger = TestLogger.forTest(module);
    const context = await browser.newContext({ logger });
    const page = await context.newPage();
    let error = null;
    const neverResolves = page.evaluate(`new Promise(r => {})`).catch(e => (error = e));
    await page.evaluate(`new Promise(f => setTimeout(f, 0))`);
    await browser.close();
    await neverResolves;
    expect(error.message).toContain('Cancel Pending Promise');
  });

  it('should reject if executable path is invalid', async () => {
    const browserEngine = { ...BrowserUtils.defaultBrowserEngine };
    browserEngine.executablePath = 'random-invalid-path';
    const browser = new Browser(browserEngine);
    Helpers.needsClosing.push(browser);
    await expect(browser.launch()).rejects.toThrowError('Failed to launch');
  });

  it('should be callable twice', async () => {
    const browser = new Browser(BrowserUtils.browserEngineOptions);
    Helpers.needsClosing.push(browser);
    await browser.launch();
    await Promise.all([browser.close(), browser.close()]);
    await expect(browser.close()).resolves.toBe(undefined);
  });

  it('should throw a friendly error if its headed and there is no xserver on linux running', async () => {
    if (Os.platform() !== 'linux') return;
    process.env.REMOTE = undefined;
    const browser = new Browser(
      { ...BrowserUtils.browserEngineOptions, launchArguments: [] },
      {},
      { showChrome: true },
    );
    Helpers.needsClosing.push(browser);
    const error = await browser.launch().catch(e => e);
    expect(error).toBeInstanceOf(BrowserLaunchError);
    if (browser.majorVersion > 97) {
      expect(error.stack).toMatch(
        /Looks like you launched Headed Chrome without an XServer running./,
      );
      expect(error.stack).toMatch(/xvfb-run/);
    }
  });
});
