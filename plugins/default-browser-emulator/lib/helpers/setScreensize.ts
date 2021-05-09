import IDevtoolsSession from "@secret-agent/interfaces/IDevtoolsSession";
import { IBrowserEmulator } from "@secret-agent/plugin-utils";

export default async function setScreensize(emulator: IBrowserEmulator, devtools: IDevtoolsSession): Promise<void> {
  const { viewport } = emulator;
  if (!viewport) return;
  await devtools.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor ?? 1,
    positionX: viewport.positionX,
    positionY: viewport.positionY,
    screenWidth: viewport.screenWidth,
    screenHeight: viewport.screenHeight,
    mobile: false,
  });
}
