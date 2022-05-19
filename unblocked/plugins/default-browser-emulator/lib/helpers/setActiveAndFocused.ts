import IDevtoolsSession from '@unblocked-web/specifications/agent/browser/IDevtoolsSession';
import IEmulationProfile from '@unblocked-web/specifications/plugin/IEmulationProfile';

export default async function setActiveAndFocused(
  emulationProfile: IEmulationProfile,
  devtools: IDevtoolsSession,
): Promise<void> {
  await devtools.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(err => err);
}
