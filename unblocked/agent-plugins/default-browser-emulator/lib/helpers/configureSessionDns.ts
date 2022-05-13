import IDnsSettings from '@unblocked-web/emulator-spec/net/IDnsSettings';
import IEmulatorProfile from '@unblocked-web/emulator-spec/emulator/IEmulatorProfile';

export default function configureSessionDns(
  emulatorProfile: IEmulatorProfile,
  settings: IDnsSettings,
): void {
  settings.dnsOverTlsConnection = null;
}
