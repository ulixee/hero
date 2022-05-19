import IDnsSettings from '@unblocked-web/specifications/agent/net/IDnsSettings';
import IEmulationProfile from '@unblocked-web/specifications/plugin/IEmulationProfile';

export default function configureSessionDns(
  emulationProfile: IEmulationProfile,
  settings: IDnsSettings,
): void {
  settings.dnsOverTlsConnection = null;
}
