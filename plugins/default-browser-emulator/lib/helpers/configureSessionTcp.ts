import { IBrowserEmulator } from '@secret-agent/interfaces/IPluginBrowserEmulator';
import ITcpSettings from '@secret-agent/interfaces/ITcpSettings';
import getTcpSettingsForOs from '../utils/getTcpSettingsForOs';

export default function configureSessionTcp(
  browserEmulator: IBrowserEmulator,
  settings: ITcpSettings,
) {
  const { operatingSystemName, operatingSystemVersion } = browserEmulator;
  const tcpSettings = getTcpSettingsForOs(operatingSystemName, operatingSystemVersion);
  if (tcpSettings) {
    settings.tcpTtl = tcpSettings.ttl;
    settings.tcpWindowSize = tcpSettings.windowSize;
  }
}
