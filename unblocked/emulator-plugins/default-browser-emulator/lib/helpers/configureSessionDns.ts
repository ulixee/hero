import { IBrowserEmulator } from '@unblocked-web/emulator-spec/IBrowserEmulator';
import IDnsSettings from '@unblocked-web/emulator-spec/net/IDnsSettings';

export default function configureSessionDns(
  emulator: IBrowserEmulator,
  settings: IDnsSettings,
): void {
  settings.dnsOverTlsConnection = null;
}
