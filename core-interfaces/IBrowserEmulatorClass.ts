import IBrowserEmulator from './IBrowserEmulator';
import IUserAgentOption from './IUserAgentOption';

export default interface IBrowserEmulatorClass {
  id: string;
  roundRobinPercent: number;
  engine: { browser: string; executablePath: string; revision: string };
  new (): IBrowserEmulator;
  userAgentOptions: IUserAgentOption[];
}

// decorator for browser emulator classes. hacky way to check the class implements statics we need
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BrowserEmulatorClassDecorator(constructor: IBrowserEmulatorClass): void {}
