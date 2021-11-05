import { IBrowserEmulator } from '@ulixee/hero-plugin-utils';
import IDnsSettings from '@ulixee/hero-interfaces/IDnsSettings';

export default function configureSessionDns(emulator: IBrowserEmulator, settings: IDnsSettings) {
  settings.dnsOverTlsConnection = null;
}
