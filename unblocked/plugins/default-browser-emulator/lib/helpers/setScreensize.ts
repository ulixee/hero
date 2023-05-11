import IDevtoolsSession, {
  Protocol,
} from '@ulixee/unblocked-specification/agent/browser/IDevtoolsSession';
import { IPage } from '@ulixee/unblocked-specification/agent/browser/IPage';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';

export default async function setScreensize(
  emulationProfile: IEmulationProfile,
  page: IPage,
  devtools: IDevtoolsSession,
): Promise<void> {
  const { viewport } = emulationProfile;
  if (!viewport) return;

  const promises: Promise<any>[] = [
    devtools.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.deviceScaleFactor ?? 0,
      mobile: false,
      positionX: viewport.positionX,
      positionY: viewport.positionY,
      screenWidth: viewport.screenWidth,
      screenHeight: viewport.screenHeight,
    }),
  ];

  if (emulationProfile.browserEngine.isHeaded && viewport.screenWidth) {
    promises.push(
      page.devtoolsSession.send('Browser.getWindowForTarget').then(({ windowId }) => {
        return devtools.send('Browser.setWindowBounds', {
          windowId,
          bounds: {
            width: viewport.screenWidth,
            height: viewport.screenHeight,
            windowState: 'normal',
          },
        });
      }),
    );
  }

  if (viewport.width === 0 || viewport.height === 0) {
    promises.push(
      devtools.send('Page.getLayoutMetrics').then(x => {
        const visualViewport: Protocol.Page.VisualViewport =
          x.cssVisualViewport ?? x.visualViewport;
        viewport.height = visualViewport.clientHeight;
        viewport.width = visualViewport.clientWidth;
        viewport.deviceScaleFactor = visualViewport.scale;
        return viewport;
      }),
    );
  }
  await Promise.all(promises);
}
