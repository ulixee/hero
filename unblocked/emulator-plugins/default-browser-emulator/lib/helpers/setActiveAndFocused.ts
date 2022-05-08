import IDevtoolsSession from '@unblocked/emulator-spec/browser/IDevtoolsSession';
import { IBrowserEmulator } from '@unblocked/emulator-spec/IBrowserEmulator';

export default async function setActiveAndFocused(
  emulator: IBrowserEmulator,
  devtools: IDevtoolsSession,
): Promise<void> {
  await devtools.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(err => err);
}
