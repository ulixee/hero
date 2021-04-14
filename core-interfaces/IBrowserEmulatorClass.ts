import IBrowserEmulator from './IBrowserEmulator';
import IBrowserEngine from './IBrowserEngine';
import IUserAgentMatchMeta from './IUserAgentMatchMeta';

export default interface IBrowserEmulatorClass {
  id: string;
  roundRobinPercent: number;
  engine: IBrowserEngine;
  new (matchMeta?: IUserAgentMatchMeta): IBrowserEmulator;
  isMatch: (matchMeta: IUserAgentMatchMeta) => boolean;
}

// decorator for browser emulator classes. hacky way to check the class implements statics we need
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BrowserEmulatorClassDecorator(constructor: IBrowserEmulatorClass): void {}
