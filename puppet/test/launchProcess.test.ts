import Chrome80 from '@secret-agent/emulate-chrome-80';
import ChromeLatest from '@secret-agent/emulate-chrome-latest';
import Log from '@secret-agent/commons/Logger';
import IBrowserEngine from '@secret-agent/interfaces/IBrowserEngine';
import Puppet from '../index';
import defaultEmulation from './_defaultEmulation';

const { log } = Log(module);

describe.each([[Chrome80.engine], [ChromeLatest.engine]])(
  'launchProcess for %s@%s',
  (browserEngine: IBrowserEngine) => {
    const defaultBrowserOptions = browserEngine;

    it('should reject all promises when browser is closed', async () => {
      const browser = await new Puppet(defaultBrowserOptions);
      await browser.start();
      const page = await (await browser.newContext(defaultEmulation, log)).newPage();
      let error = null;
      const neverResolves = page.evaluate(`new Promise(r => {})`).catch(e => (error = e));
      await page.evaluate(`new Promise(f => setTimeout(f, 0))`);
      await browser.close();
      await neverResolves;
      expect(error.message).toContain('Cancel Pending Promise');
    });

    it('should reject if executable path is invalid', async () => {
      const browser = new Puppet({
        ...defaultBrowserOptions,
        executablePath: 'random-invalid-path',
      });
      await browser.start();
      await expect(browser.isReady).rejects.toThrowError('Failed to launch');
    });

    it('should be callable twice', async () => {
      const browser = await new Puppet(defaultBrowserOptions);
      await Promise.all([browser.close(), browser.close()]);
      await expect(browser.close()).resolves.toBe(undefined);
    });
  },
);
