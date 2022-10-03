import { Helpers } from '@unblocked-web/plugins-testing';
import DefaultBrowserEmulator, { defaultBrowserEngine } from '../index';

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('it should run uninstalled userAgent strings on the closest installed browser', async () => {
  const userAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.165 Safari/537.36';

  const browserMeta = DefaultBrowserEmulator.selectBrowserMeta(userAgent);
  const userAgentOption = browserMeta.userAgentOption;

  expect(userAgentOption.string).toBe(userAgent);
  expect(userAgentOption.browserVersion.major).toBe(defaultBrowserEngine.version.major);
  expect(browserMeta.browserEngine.fullVersion.split('.')[0]).toBe(
    defaultBrowserEngine.majorVersion.toString(),
  );
});

test('it should run pick an OS version for Chrome 90+ on mac 10.15.17', async () => {
  const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${defaultBrowserEngine.version.major}.0.3987.165 Safari/537.36`;

  const browserMeta = DefaultBrowserEmulator.selectBrowserMeta(userAgent);
  const userAgentOption = browserMeta.userAgentOption;
  expect(userAgentOption.string).toBe(userAgent);
  expect(browserMeta.browserEngine.fullVersion.split('.')[0]).toBe(
    defaultBrowserEngine.majorVersion.toString(),
  );
  expect(userAgentOption.browserVersion.major).toBe(defaultBrowserEngine.version.major);
  const osVersion = userAgentOption.operatingSystemVersion;
  expect(Number(osVersion.major)).toBeGreaterThanOrEqual(10);
  if (Number(osVersion.major) === 10) {
    expect(Number(osVersion.minor)).toBeGreaterThan(15);
  }
  expect(browserMeta.userAgentOption.operatingSystemName).toBe('mac-os');
});
