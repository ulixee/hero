import { IBrowserEmulator } from '@unblocked-web/emulator-spec/IBrowserEmulator';
import ITlsSettings from '@unblocked-web/emulator-spec/net/ITlsSettings';

export default function configureSessionTcp(
  browserEmulator: IBrowserEmulator,
  settings: ITlsSettings,
): void {
  const { browserName, browserVersion } = browserEmulator;
  settings.tlsClientHelloId = `${browserName}-${browserVersion.major}`;
}
