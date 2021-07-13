import IDevtoolsSession from "@secret-agent/interfaces/IDevtoolsSession";
import { IBrowserEmulator } from "@secret-agent/plugin-utils";

export default async function setActiveAndFocused(emulator: IBrowserEmulator, devtools: IDevtoolsSession) {
  await devtools.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(err => err);
}
