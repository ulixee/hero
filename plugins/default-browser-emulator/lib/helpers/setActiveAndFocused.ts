import IDevtoolsSession from "@ulixee/hero-interfaces/IDevtoolsSession";
import { IBrowserEmulator } from "@ulixee/hero-plugin-utils";

export default async function setActiveAndFocused(emulator: IBrowserEmulator, devtools: IDevtoolsSession) {
  await devtools.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(err => err);
}
