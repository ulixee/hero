export enum PluginTypes {
  ClientExtender = 'ClientExtender',
  CoreExtender = 'CoreExtender',
  BrowserEmulator = 'BrowserEmulator',
  HumanEmulator = 'HumanEmulator',
}

type IPluginType = keyof typeof PluginTypes;

export default IPluginType;

