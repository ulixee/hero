import IHumanEmulator from './IHumanEmulator';

export default interface IHumanEmulatorClass {
  id: string;
  new (): IHumanEmulator;
}

// decorator for human emulator classes. hacky way to check the class implements statics we need
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function HumanEmulatorClassDecorator(constructor: IHumanEmulatorClass): void {}
