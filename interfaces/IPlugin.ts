import ICorePlugin, { ICorePluginClass } from './ICorePlugin';
import IClientPlugin, { IClientPluginClass } from './IClientPlugin';
import { IBrowserEmulator, IBrowserEmulatorClass } from '@unblocked-web/emulator-spec/IBrowserEmulator';
import { IHumanEmulator, IHumanEmulatorClass } from '@unblocked-web/emulator-spec/IHumanEmulator';

type IPlugin = IClientPlugin | ICorePlugin | IBrowserEmulator | IHumanEmulator;
export default IPlugin;

export type IPluginClass =
  | IClientPluginClass
  | ICorePluginClass
  | IBrowserEmulatorClass
  | IHumanEmulatorClass;
