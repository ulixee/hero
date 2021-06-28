import IDevtoolsSession from "@secret-agent/interfaces/IDevtoolsSession";
import { IBrowserEmulator } from "@secret-agent/interfaces/IPluginBrowserEmulator";

export default async function setUserAgent(emulator: IBrowserEmulator, devtools: IDevtoolsSession) {
  await devtools.send('Network.setUserAgentOverride', {
    userAgent: emulator.userAgentString,
    acceptLanguage: emulator.locale,
    platform: emulator.operatingSystemPlatform,
  });
}
