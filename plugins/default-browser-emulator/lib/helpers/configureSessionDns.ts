import { IBrowserEmulator } from '@ulixee/hero-plugin-utils';
import IDnsSettings from '@ulixee/hero-interfaces/IDnsSettings';
import * as DnsOverTlsProviders from '../utils/DnsOverTlsProviders';

export default function configureSessionDns(emulator: IBrowserEmulator, settings: IDnsSettings) {
  settings.dnsOverTlsConnection = DnsOverTlsProviders.Cloudflare;
}
