import { ICoreExtender } from './IPluginCoreExtender';
import { IPluginClass } from './IPlugin';
import { IBrowserEmulator } from './IPluginBrowserEmulator';
import { IHumanEmulator } from './IPluginHumanEmulator';

export default interface IPlugins extends Omit<ICoreExtender, 'id'> {
  browserEmulator: IBrowserEmulator;
  humanEmulator: IHumanEmulator;

  use(Plugin: IPluginClass): void;
}
