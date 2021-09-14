import IDevtoolsSession from '@ulixee/hero-interfaces/IDevtoolsSession';
import { IPuppetPage } from '@ulixee/hero-interfaces/IPuppetPage';
import { ISessionSummary } from '@ulixee/hero-interfaces/ICorePlugin';
import BrowserEmulator from '../../index';

export default async function setScreensize(
  emulator: BrowserEmulator,
  page: IPuppetPage,
  devtools: IDevtoolsSession,
  sessionMeta: ISessionSummary,
): Promise<void> {
  const { viewport } = emulator;
  if (!viewport) return;

  const promises: Promise<any>[] = [];

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
  }

  const ignoreViewport = sessionMeta.options?.showBrowserInteractions === true;
  if (!ignoreViewport) {
    promises.push(
      devtools.send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: viewport.deviceScaleFactor ?? 0,
        positionX: viewport.positionX,
        positionY: viewport.positionY,
        screenWidth: viewport.screenWidth,
        screenHeight: viewport.screenHeight,
        mobile: false,
      }),
    );
  }
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
