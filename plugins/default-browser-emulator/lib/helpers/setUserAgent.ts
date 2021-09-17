import IDevtoolsSession from '@ulixee/hero-interfaces/IDevtoolsSession';
import BrowserEmulator from '../../index';

export default async function setUserAgent(emulator: BrowserEmulator, devtools: IDevtoolsSession) {
  // Determine the full user agent string, strip the "Headless" part
  const ua = emulator.userAgentString;

  // Full version number from Chrome
  const chromeVersion = ua.match(/Chrome\/([\d|.]+)/)[1];

  let platform = '';
  let platformVersion = '';

  if (emulator.operatingSystemName === 'mac-os') {
    platform = 'Mac OS X';
    platformVersion = ua.match(/Mac OS X ([^)]+)/)[1];
  } else if (emulator.operatingSystemName === 'windows') {
    platform = 'Windows';
    platformVersion = ua.match(/Windows .*?([\d|.]+);/)[1];
  }

  await devtools.send('Network.setUserAgentOverride', {
    userAgent: emulator.userAgentString,
    acceptLanguage: emulator.locale,
    platform: emulator.operatingSystemPlatform,
    userAgentMetadata: {
      brands: createBrands(emulator.browserVersion.major),
      fullVersion: chromeVersion,
      platform,
      platformVersion,
      architecture: 'x86',
      model: '',
      mobile: false,
    },
  });
}

function createBrands(majorBrowserVersion: string) {
  // Source in C++: https://source.chromium.org/chromium/chromium/src/+/master:components/embedder_support/user_agent_utils.cc;l=55-100
  const seed = majorBrowserVersion;

  const order = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ][Number(seed) % 6];
  const escapedChars = [' ', ' ', ';'];

  const greaseyBrand = `${escapedChars[order[0]]}Not${escapedChars[order[1]]}A${
    escapedChars[order[2]]
  }Brand`;

  const brands = [];
  brands[order[0]] = {
    brand: greaseyBrand,
    version: '99',
  };
  brands[order[1]] = {
    brand: 'Chromium',
    version: seed,
  };
  brands[order[2]] = {
    brand: 'Google Chrome',
    version: seed,
  };
  return brands;
}
