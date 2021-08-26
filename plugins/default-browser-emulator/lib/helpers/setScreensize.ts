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
        if (bounds.width === viewport.width && bounds.height === viewport.height) {
          return null;
        }

        return devtools.send('Browser.setWindowBounds', {
          windowId,
          bounds: {
            left: viewport.positionX,
            top: viewport.positionY,
            width: viewport.screenWidth,
            height: viewport.screenHeight + 20,
            windowState: 'normal',
          },
        });
      }),
    );
  }

  const ignoreViewport =
    sessionMeta.options?.showBrowserInteractions === true && viewport.isDefault;
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
  await Promise.all(promises);
}
