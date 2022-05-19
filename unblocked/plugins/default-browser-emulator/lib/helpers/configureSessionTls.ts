import IEmulationProfile from '@unblocked-web/specifications/plugin/IEmulationProfile';
import ITlsSettings from '@unblocked-web/specifications/agent/net/ITlsSettings';

export default function configureSessionTcp(
  emulationProfile: IEmulationProfile,
  settings: ITlsSettings,
): void {
  const { browserName, browserVersion } = emulationProfile.userAgentOption;
  settings.tlsClientHelloId = `${browserName}-${browserVersion.major}`;
}
