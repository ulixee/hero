import { IBrowserEmulator } from '@unblocked/emulator-spec/IBrowserEmulator';
import IDnsSettings from '@unblocked/emulator-spec/net/IDnsSettings';

export default function configureSessionDns(
  emulator: IBrowserEmulator,
  settings: IDnsSettings,
): void {
  settings.dnsOverTlsConnection = null;
}
