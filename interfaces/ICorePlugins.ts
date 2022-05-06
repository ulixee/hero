import ICorePlugin, { ICorePluginClass } from './ICorePlugin';
import { IBrowserEmulator } from '@bureau/interfaces/IBrowserEmulator';
import { IHumanEmulator } from '@bureau/interfaces/IHumanEmulator';

export default interface ICorePlugins extends Omit<ICorePlugin, 'id'> {
  browserEmulator: IBrowserEmulator;
  humanEmulator: IHumanEmulator;

  use(CorePlugin: ICorePluginClass): void;
}
