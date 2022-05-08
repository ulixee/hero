import { IBrowserEmulator } from '@unblocked/emulator-spec/IBrowserEmulator';
import ITlsSettings from '@unblocked/emulator-spec/net/ITlsSettings';

export default function configureSessionTcp(
  browserEmulator: IBrowserEmulator,
  settings: ITlsSettings,
): void {
  const { browserName, browserVersion } = browserEmulator;
  settings.tlsClientHelloId = `${browserName}-${browserVersion.major}`;
}
