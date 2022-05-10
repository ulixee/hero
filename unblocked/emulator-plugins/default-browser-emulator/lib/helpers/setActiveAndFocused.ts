import IDevtoolsSession from '@unblocked-web/emulator-spec/browser/IDevtoolsSession';
import { IBrowserEmulator } from '@unblocked-web/emulator-spec/IBrowserEmulator';

export default async function setActiveAndFocused(
  emulator: IBrowserEmulator,
  devtools: IDevtoolsSession,
): Promise<void> {
  await devtools.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(err => err);
}
