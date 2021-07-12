import { IBrowserEmulator } from '@secret-agent/interfaces/ICorePlugin';
import ITlsSettings from '@secret-agent/interfaces/ITlsSettings';

export default function configureSessionTcp(
  browserEmulator: IBrowserEmulator,
  settings: ITlsSettings,
) {
  const { browserName, browserVersion } = browserEmulator;
  settings.tlsClientHelloId = `${browserName}-${browserVersion.major}`;
}
