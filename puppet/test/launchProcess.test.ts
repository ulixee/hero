import Chrome80 from '@secret-agent/emulate-chrome-80';
import Chrome83 from '@secret-agent/emulate-chrome-83';
import Puppet from '../index';
import { getExecutablePath } from '../lib/browserPaths';

describe.each([
  [Chrome80.engine.browser, Chrome80.engine.revision],
  [Chrome83.engine.browser, Chrome83.engine.revision],
])('launchProcess for %s@%s', (browserEngine: string, revision: string) => {
  const engineExecutablePath = getExecutablePath(browserEngine, revision);
  const defaultBrowserOptions = {
    engine: { browser: browserEngine, revision },
    engineExecutablePath,
  };
  const defaultContextOptions = {
    userAgent: 'Page tests',
    acceptLanguage: 'en',
    platform: 'Linux',
    proxyPassword: '',
  };

  it('should reject all promises when browser is closed', async () => {
    const browser = await new Puppet(defaultBrowserOptions);
    await browser.start();
    const page = await (await browser.newContext(defaultContextOptions)).newPage();
    let error = null;
    const neverResolves = page.evaluate(`new Promise(r => {})`).catch(e => (error = e));
    await page.evaluate(`new Promise(f => setTimeout(f, 0))`);
    await browser.close();
    await neverResolves;
    expect(error.message).toContain('Protocol error');
  });

  it('should reject if executable path is invalid', async () => {
    const browser = new Puppet({
      engine: defaultBrowserOptions.engine,
      engineExecutablePath: 'random-invalid-path',
    });
    expect(browser.start.bind(browser)).toThrow('Failed to launch');
  });

  it('should be callable twice', async () => {
    const browser = await new Puppet(defaultBrowserOptions);
    await Promise.all([browser.close(), browser.close()]);
    await expect(browser.close()).resolves.toBe(undefined);
  });
});
