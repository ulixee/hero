import { IBrowserEmulator } from '@secret-agent/interfaces/IPluginBrowserEmulator';
import getTcpSettingsForOs from '../utils/getTcpSettingsForOs';

export default function configureSessionTcp(browserEmulator: IBrowserEmulator, settings) {
  const { operatingSystemName, operatingSystemVersion } = browserEmulator;
  const tcpSettings = getTcpSettingsForOs(operatingSystemName, operatingSystemVersion);
  if (tcpSettings) {
    settings.tcpTtl = tcpSettings.ttl;
    settings.tcpWindowSize = tcpSettings.windowSize;
  }
}
