import IDevtoolsSession from '@ulixee/unblocked-specification/agent/browser/IDevtoolsSession';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import IUserAgentData from '../../interfaces/IUserAgentData';

export default async function setUserAgent(
  emulationProfile: IEmulationProfile,
  devtools: IDevtoolsSession,
  userAgentData: IUserAgentData,
): Promise<void> {
  const userAgentMetadata = userAgentData
    ? {
        brands: userAgentData.brands,
        fullVersion: userAgentData.uaFullVersion,
        fullVersionList: userAgentData.fullVersionList,
        platform: userAgentData.platform,
        platformVersion: userAgentData.platformVersion,
        architecture: 'x86',
        model: '',
        mobile: false,
      }
    : undefined;
  await devtools.send('Emulation.setUserAgentOverride', {
    userAgent: emulationProfile.userAgentOption.string,
    acceptLanguage: emulationProfile.locale,
    platform: emulationProfile.windowNavigatorPlatform,
    userAgentMetadata,
  });
}
