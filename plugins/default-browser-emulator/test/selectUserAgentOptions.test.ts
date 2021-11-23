import selectUserAgentOption from '../lib/helpers/selectUserAgentOption';
import DataLoader from '../lib/DataLoader';

const dataLoader = new DataLoader(`${__dirname}/..`);

test('should support choosing a specific useragent', async () => {
  const options = selectUserAgentOption(
    '~ chrome >= 88 && chrome < 89',
    dataLoader.userAgentOptions,
  );
  expect(options.browserVersion.major).toBe('88');
});

test('should support choosing a specific OS', async () => {
  const options = selectUserAgentOption('~ mac & chrome >= 88', dataLoader.userAgentOptions);
  expect(parseInt(options.browserVersion.major, 10)).toBeGreaterThanOrEqual(88);
  expect(options.operatingSystemName).toBe('mac-os');
});

test('should throw an error for a non-installed pattern', async () => {
  try {
    expect(
      selectUserAgentOption('~ mac & chrome >= 500000', dataLoader.userAgentOptions),
    ).not.toBeTruthy();
  } catch (err) {
    expect(err.message).toMatch('No installed UserAgent');
  }
});
