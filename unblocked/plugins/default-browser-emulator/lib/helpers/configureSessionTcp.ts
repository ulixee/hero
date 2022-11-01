import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import ITcpSettings from '@ulixee/unblocked-specification/agent/net/ITcpSettings';
import getTcpSettingsForOs from '../utils/getTcpSettingsForOs';

export default function configureSessionTcp(
  emulationProfile: IEmulationProfile,
  settings: ITcpSettings,
): void {
  const { operatingSystemName, operatingSystemVersion } = emulationProfile.userAgentOption;
  const tcpSettings = getTcpSettingsForOs(operatingSystemName, operatingSystemVersion);
  if (tcpSettings) {
    settings.tcpTtl = tcpSettings.ttl;
    settings.tcpWindowSize = tcpSettings.windowSize;
  }
}
