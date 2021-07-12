export enum PluginTypes {
  ClientPlugin = 'ClientPlugin',
  CorePlugin = 'CorePlugin',
  BrowserEmulator = 'CorePlugin:BrowserEmulator',
  HumanEmulator = 'CorePlugin:HumanEmulator',
}

type ValueOf<T> = T[keyof T];

type IPluginType = ValueOf<PluginTypes>;

export default IPluginType;

