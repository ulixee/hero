import IDevtoolsSession from '@unblocked-web/emulator-spec/browser/IDevtoolsSession';
import IUserAgentData from '../../interfaces/IUserAgentData';
import IEmulatorProfile from '@unblocked-web/emulator-spec/emulator/IEmulatorProfile';

export default async function setUserAgent(
  emulatorProfile: IEmulatorProfile,
  devtools: IDevtoolsSession,
  userAgentData: IUserAgentData,
): Promise<void> {
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
    userAgent: emulatorProfile.userAgentOption.string,
    acceptLanguage: emulatorProfile.locale,
    platform: emulatorProfile.userAgentOption.operatingSystemPlatform,
    userAgentMetadata,
  });
}
