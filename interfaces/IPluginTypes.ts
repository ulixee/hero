import { EmulatorTypes } from '@bureau/interfaces/IEmulatorTypes';

const ClientPlugin = 'ClientPlugin';
const CorePlugin = 'CorePlugin';
const BrowserEmulator = EmulatorTypes.BrowserEmulator;
const HumanEmulator = EmulatorTypes.HumanEmulator;

const PluginTypes = {
  ClientPlugin,
  CorePlugin,
  BrowserEmulator,
  HumanEmulator,
} as const;

type IPluginType = keyof typeof PluginTypes;

export { PluginTypes, IPluginType };
