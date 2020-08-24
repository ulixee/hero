import { EmulatorPlugin } from '../index';

export default interface IPolyfillSet {
  windows7?: any;
  windows8_1?: any;
  windows10?: any;
  mac?: any;
  get: (plugin: EmulatorPlugin) => any;
  canPolyfill: (plugin: EmulatorPlugin) => boolean;
}
