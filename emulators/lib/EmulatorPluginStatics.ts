import EmulatorPlugin from './EmulatorPlugin';

export interface IEmulatorPluginStatics {
  emulatorId: string;
  browser: string;
  chromiumEngines: number[];
  new (os?: { family: string; major: string }): EmulatorPlugin;
}

// decorator for emulator plugins. hacky way to check the class implements statics we need
// tslint:disable-next-line:no-empty
export default function EmulatorPluginStatics(constructor: IEmulatorPluginStatics) {}
