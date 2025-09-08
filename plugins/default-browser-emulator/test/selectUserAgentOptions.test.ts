import selectUserAgentOption from '../lib/helpers/selectUserAgentOption';
import DataLoader from '../lib/DataLoader';
import DefaultBrowserEmulator, { defaultBrowserEngine } from '../index';
import UserAgentOptions from '../lib/UserAgentOptions';
import BrowserEngineOptions from '../lib/BrowserEngineOptions';

const dataLoader = new DataLoader();
const browserEngineOptions = new BrowserEngineOptions(
  dataLoader,
  process.env.ULX_DEFAULT_BROWSER_ID ?? process.env.ULX_DEFAULT_BROWSER_ID,
);
const userAgentOptions = new UserAgentOptions(dataLoader, browserEngineOptions);

test('should support choosing a specific useragent', async () => {
  const options = selectUserAgentOption(
    `~ chrome >= ${defaultBrowserEngine.version.major} && chrome < ${
      Number(defaultBrowserEngine.version.major) + 1
    }`,
    userAgentOptions,
  );
  expect(options.browserVersion.major).toBe(defaultBrowserEngine.version.major);
});

test('should support choosing a specific OS', async () => {
  const options = selectUserAgentOption('~ mac & chrome >= 88', userAgentOptions);
  expect(parseInt(options.browserVersion.major, 10)).toBeGreaterThanOrEqual(88);
  expect(options.operatingSystemCleanName).toBe('mac-os');
});

test('it should find correct browser meta', async () => {
  const browserMeta = DefaultBrowserEmulator.selectBrowserMeta(
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 12_4_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${defaultBrowserEngine.version.major}.0.4324.182 Safari/537.36`,
  );
  const data = dataLoader.as(browserMeta.userAgentOption) as any;
  const asOsId = data.osDataDir.split('/').pop();
  expect(asOsId).toEqual('as-mac-os-12');
});

test('should throw an error for a non-installed pattern', async () => {
  try {
    expect(selectUserAgentOption('~ mac & chrome >= 500000', userAgentOptions)).not.toBeTruthy();
  } catch (err) {
    expect(err.message).toMatch('No installed UserAgent');
  }
});
