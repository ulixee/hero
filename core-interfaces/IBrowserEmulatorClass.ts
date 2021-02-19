import IBrowserEmulator from './IBrowserEmulator';
import IUserAgentOption from './IUserAgentOption';
import IBrowserEngine from './IBrowserEngine';

export default interface IBrowserEmulatorClass {
  id: string;
  roundRobinPercent: number;
  engine: IBrowserEngine;
  new (): IBrowserEmulator;
  userAgentOptions?: IUserAgentOption[];
}

// decorator for browser emulator classes. hacky way to check the class implements statics we need
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BrowserEmulatorClassDecorator(constructor: IBrowserEmulatorClass): void {}
