import Hero from '@ulixee/hero-fullstack';
import { Helpers } from '@ulixee/hero-testing';
import { defaultBrowserEngine } from '../index';

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('it should run uninstalled userAgent strings on the closest installed browser', async () => {
  const userAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.165 Safari/537.36';
  const hero = new Hero({ userAgent });
  Helpers.onClose(() => hero.close(), true);
  const meta = await hero.meta;

  expect(meta.userAgentString).toBe(userAgent);
  expect(meta.browserFullVersion).toBe(defaultBrowserEngine.fullVersion);
});

test('it should run pick an OS version for Chrome 90+ on mac 10.15.17', async () => {
  const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${defaultBrowserEngine.version.major}.0.3987.165 Safari/537.36`;
  const hero = new Hero({ userAgent });
  Helpers.onClose(() => hero.close(), true);
  const meta = await hero.meta;
  expect(meta.userAgentString).toBe(userAgent);
  expect(meta.browserFullVersion).toBe(defaultBrowserEngine.fullVersion);
  const osVersion = meta.operatingSystemVersion.split('.').map(Number);
  expect(osVersion[0]).toBeGreaterThanOrEqual(10);
  if (osVersion[0] === 10) {
    expect(osVersion[1]).toBeGreaterThan(15);
  }
  expect(meta.operatingSystemPlatform).toBe('MacIntel');
});
