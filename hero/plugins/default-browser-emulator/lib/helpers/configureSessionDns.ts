import { IBrowserEmulator } from '@secret-agent/plugin-utils';
import IDnsSettings from '@secret-agent/interfaces/IDnsSettings';
import * as DnsOverTlsProviders from '../utils/DnsOverTlsProviders';

export default function configureSessionDns(emulator: IBrowserEmulator, settings: IDnsSettings) {
  settings.dnsOverTlsConnection = DnsOverTlsProviders.Cloudflare;
}
