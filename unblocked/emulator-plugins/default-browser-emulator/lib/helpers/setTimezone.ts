import IDevtoolsSession from '@unblocked-web/emulator-spec/browser/IDevtoolsSession';
import IEmulatorProfile from "@unblocked-web/emulator-spec/emulator/IEmulatorProfile";

export default async function setTimezone(
  emulatorProfile: IEmulatorProfile,
  devtools: IDevtoolsSession,
): Promise<void> {
  const { timezoneId } = emulatorProfile;
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
