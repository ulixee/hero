import IDevtoolsSession from '@unblocked/emulator-spec/browser/IDevtoolsSession';
import BrowserEmulator from '../../index';

export default async function setTimezone(
  emulator: BrowserEmulator,
  devtools: IDevtoolsSession,
): Promise<void> {
  const { timezoneId } = emulator;
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
