import IDevtoolsSession from '@ulixee/hero-interfaces/IDevtoolsSession';
import BrowserEmulator from '../../index';
import IUserAgentData from '../../interfaces/IUserAgentData';

export default async function setUserAgent(
  emulator: BrowserEmulator,
  devtools: IDevtoolsSession,
  userAgentData: IUserAgentData,
) {
  const userAgentMetadata = userAgentData
    ? {
        brands: userAgentData.brands,
        fullVersion: userAgentData.uaFullVersion,
        platform: userAgentData.platform,
        platformVersion: userAgentData.platformVersion,
        architecture: 'x86',
        model: '',
        mobile: false,
      }
    : undefined;
  await devtools.send('Emulation.setUserAgentOverride', {
    userAgent: emulator.userAgentString,
    acceptLanguage: emulator.locale,
    platform: emulator.operatingSystemPlatform,
    userAgentMetadata,
  });
}
