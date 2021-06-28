import { DnsOverTlsProviders, IBrowserEmulator } from '@secret-agent/plugin-utils';
import IDnsSettings from '@secret-agent/interfaces/IDnsSettings';

export default function configureSessionDns(emulator: IBrowserEmulator, settings: IDnsSettings) {
  settings.dnsOverTlsConnection = DnsOverTlsProviders.Cloudflare;
}
