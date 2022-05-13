import IDevtoolsSession from '@unblocked-web/emulator-spec/browser/IDevtoolsSession';
import IEmulatorProfile from '@unblocked-web/emulator-spec/emulator/IEmulatorProfile';

export default async function setActiveAndFocused(
  emulatorProfile: IEmulatorProfile,
  devtools: IDevtoolsSession,
): Promise<void> {
  await devtools.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(err => err);
}
