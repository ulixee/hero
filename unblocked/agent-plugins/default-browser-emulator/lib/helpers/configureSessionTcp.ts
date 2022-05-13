import IEmulatorProfile from '@unblocked-web/emulator-spec/emulator/IEmulatorProfile';
import ITcpSettings from '@unblocked-web/emulator-spec/net/ITcpSettings';
import getTcpSettingsForOs from '../utils/getTcpSettingsForOs';

export default function configureSessionTcp(
  emulatorProfile: IEmulatorProfile,
  settings: ITcpSettings,
): void {
  const { operatingSystemName, operatingSystemVersion } = emulatorProfile.userAgentOption;
  const tcpSettings = getTcpSettingsForOs(operatingSystemName, operatingSystemVersion);
  if (tcpSettings) {
    settings.tcpTtl = tcpSettings.ttl;
    settings.tcpWindowSize = tcpSettings.windowSize;
  }
}
