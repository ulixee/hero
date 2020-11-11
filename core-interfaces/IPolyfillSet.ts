import IBrowserEmulator from './IBrowserEmulator';

export default interface IPolyfillSet {
  windows7?: any;
  windows8_1?: any;
  windows10?: any;
  mac?: any;
  get: (emulator: IBrowserEmulator) => any;
  canPolyfill: (emulator: IBrowserEmulator) => boolean;
}
