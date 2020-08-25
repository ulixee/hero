import EmulatorPlugin from './EmulatorPlugin';
import IUserAgent from '../interfaces/IUserAgent';

export interface IEmulatorPluginStatics {
  emulatorId: string;
  statcounterBrowser: string;
  engine: { browser: string; revision: string };
  new (userAgent?: IUserAgent): EmulatorPlugin;
}

// decorator for emulator plugins. hacky way to check the class implements statics we need
// tslint:disable-next-line:no-empty
export default function EmulatorPluginStatics(constructor: IEmulatorPluginStatics) {}
