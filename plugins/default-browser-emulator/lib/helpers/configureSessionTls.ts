import { IBrowserEmulator } from '@secret-agent/interfaces/IPluginBrowserEmulator';

export default function configureSessionTcp(browserEmulator: IBrowserEmulator, settings) {
  const { browserName, browserVersion } = browserEmulator;
  settings.tlsClientHelloId = `${browserName}-${browserVersion.major}`;
}
