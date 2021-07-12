import IDevtoolsSession from '@secret-agent/interfaces/IDevtoolsSession';
import BrowserEmulator from '../../index';

export default async function setUserAgent(emulator: BrowserEmulator, devtools: IDevtoolsSession) {
  await devtools.send('Network.setUserAgentOverride', {
    userAgent: emulator.userAgentString,
    acceptLanguage: emulator.locale,
    platform: emulator.operatingSystemPlatform,
  });
}
