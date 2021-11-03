import IDevtoolsSession, { Protocol } from '@ulixee/hero-interfaces/IDevtoolsSession';
import { IPuppetPage } from '@ulixee/hero-interfaces/IPuppetPage';
import BrowserEmulator from '../../index';

export default async function setScreensize(
  emulator: BrowserEmulator,
  page: IPuppetPage,
  devtools: IDevtoolsSession,
): Promise<void> {
  const { viewport } = emulator;
  if (!viewport) return;

  const promises: Promise<any>[] = [];

  const metricsOverrideRequest: Protocol.Emulation.SetDeviceMetricsOverrideRequest = {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor ?? 0,
    mobile: false,
  };

  if (emulator.browserEngine.isHeaded && viewport.screenWidth) {
    promises.push(
      page.devtoolsSession.send('Browser.getWindowForTarget').then(({ windowId, bounds }) => {
        if (bounds.width === viewport.screenWidth && bounds.height === viewport.screenHeight) {
          return null;
        }

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
    Object.assign(metricsOverrideRequest, {
      width: viewport.screenWidth,
      height: viewport.screenHeight,
    });
  } else {
    Object.assign(metricsOverrideRequest, {
      positionX: viewport.positionX,
      positionY: viewport.positionY,
      screenWidth: viewport.screenWidth,
      screenHeight: viewport.screenHeight,
    });
  }

  promises.push(devtools.send('Emulation.setDeviceMetricsOverride', metricsOverrideRequest));

  if (viewport.width === 0 || viewport.height === 0) {
    promises.push(
      devtools.send('Page.getLayoutMetrics').then(x => {
        viewport.height = x.visualViewport.clientHeight;
        viewport.width = x.visualViewport.clientWidth;
        viewport.deviceScaleFactor = x.visualViewport.scale;
        return viewport;
      }),
    );
  }
  await Promise.all(promises);
}
