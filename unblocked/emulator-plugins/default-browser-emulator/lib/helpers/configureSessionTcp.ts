import { IBrowserEmulator } from '@unblocked-web/emulator-spec/IBrowserEmulator';
import ITcpSettings from '@unblocked-web/emulator-spec/net/ITcpSettings';
import getTcpSettingsForOs from '../utils/getTcpSettingsForOs';

export default function configureSessionTcp(
  browserEmulator: IBrowserEmulator,
  settings: ITcpSettings,
): void {
  const { operatingSystemName, operatingSystemVersion } = browserEmulator;
  const tcpSettings = getTcpSettingsForOs(operatingSystemName, operatingSystemVersion);
  if (tcpSettings) {
    settings.tcpTtl = tcpSettings.ttl;
    settings.tcpWindowSize = tcpSettings.windowSize;
  }
}
