import selectUserAgentOption from '../lib/helpers/selectUserAgentOption';
import DataLoader from '../lib/DataLoader';
import { defaultBrowserEngine } from '../index';
import UserAgentOptions from '../lib/UserAgentOptions';
import BrowserEngineOptions from '../lib/BrowserEngineOptions';

const dataLoader = new DataLoader(`${__dirname}/..`);
const browserEngineOptions = new BrowserEngineOptions(
  dataLoader,
  process.env.HERO_DEFAULT_BROWSER_ID,
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
  expect(options.operatingSystemName).toBe('mac-os');
});

test('should throw an error for a non-installed pattern', async () => {
  try {
    expect(selectUserAgentOption('~ mac & chrome >= 500000', userAgentOptions)).not.toBeTruthy();
  } catch (err) {
    expect(err.message).toMatch('No installed UserAgent');
  }
});
