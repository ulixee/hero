import { IBrowserEmulator } from '@ulixee/hero-interfaces/ICorePlugin';
import ITlsSettings from '@ulixee/hero-interfaces/ITlsSettings';

export default function configureSessionTcp(
  browserEmulator: IBrowserEmulator,
  settings: ITlsSettings,
) {
  const { browserName, browserVersion } = browserEmulator;
  settings.tlsClientHelloId = `${browserName}-${browserVersion.major}`;
}
