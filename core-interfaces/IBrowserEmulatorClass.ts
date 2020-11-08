import IUserAgent from './IUserAgent';
import IBrowserEmulator from './IBrowserEmulator';

export default interface IBrowserEmulatorClass {
  id: string;
  statcounterBrowser: string;
  engine: { browser: string; revision: string };
  new (userAgent?: IUserAgent): IBrowserEmulator;
}

// decorator for browser emulator classes. hacky way to check the class implements statics we need
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BrowserEmulatorClassDecorator(constructor: IBrowserEmulatorClass) {}
