import IDevtoolsSession from '@unblocked-web/specifications/agent/browser/IDevtoolsSession';
import IEmulationProfile from "@unblocked-web/specifications/plugin/IEmulationProfile";

export default async function setTimezone(
  emulationProfile: IEmulationProfile,
  devtools: IDevtoolsSession,
): Promise<void> {
  const { timezoneId } = emulationProfile;
  if (!timezoneId) return;
  try {
    await devtools.send('Emulation.setTimezoneOverride', { timezoneId });
  } catch (error) {
    if (error.message.includes('Timezone override is already in effect')) return;
    if (error.message.includes('Invalid timezone'))
      throw new Error(`Invalid timezone ID: ${timezoneId}`);
    throw error;
  }
}
