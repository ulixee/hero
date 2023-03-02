import { assert } from '@ulixee/commons/lib/utils';
import { IPage } from '@ulixee/unblocked-specification/agent/browser/IPage';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import { IFrame } from '@ulixee/unblocked-specification/agent/browser/IFrame';

export default function setActiveAndFocused(
  emulationProfile: IEmulationProfile,
  pageOrFrame: IPage | IFrame,
): Promise<any> {
  const location = emulationProfile.geolocation;
  if (!location) return;

  assert(Math.abs(location.latitude) <= 90, 'Latitude must be in a range from -90 to 90');
  assert(Math.abs(location.longitude) <= 180, 'Longitude must be in a range from -180 to 180');

  if (!location.accuracy) location.accuracy = 50 - Math.floor(Math.random() * 10);
  assert(location.accuracy >= 0, 'Accuracy must be a number greater than or equal to 0');

  const browserContext =
    'browserContext' in pageOrFrame ? pageOrFrame.browserContext : pageOrFrame.page.browserContext;
  return Promise.all([
    pageOrFrame.devtoolsSession.send('Emulation.setGeolocationOverride', {
      ...location,
    }),
    browserContext.browser.devtoolsSession.send('Browser.grantPermissions', {
      permissions: ['geolocation'],
      browserContextId: browserContext.id,
    }),
  ]);
}
