import ICorePlugin, {
  IBrowserEmulator,
  IBrowserEmulatorClass,
  ICorePluginClass,
  IHumanEmulator,
  IHumanEmulatorClass,
} from './ICorePlugin';
import IClientPlugin, { IClientPluginClass } from './IClientPlugin';

type IPlugin = IClientPlugin | ICorePlugin | IBrowserEmulator | IHumanEmulator;
export default IPlugin;

export type IPluginClass =
  | IClientPluginClass
  | ICorePluginClass
  | IBrowserEmulatorClass
  | IHumanEmulatorClass;
