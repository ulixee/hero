import { BrowserUtils, TestLogger, Helpers } from '@ulixee/unblocked-agent-testing/index';
import { Browser } from '../index';

afterEach(Helpers.afterEach);
beforeEach(async () => {
  TestLogger.testNumber += 1;
});

describe('launchProcess', () => {
  it('should reject all promises when browser is closed', async () => {
    const browser = new Browser(BrowserUtils.browserEngineOptions);
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
});
