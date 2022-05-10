import ICorePlugin, { ICorePluginClass } from './ICorePlugin';
import { IBrowserEmulator } from '@unblocked-web/emulator-spec/IBrowserEmulator';
import { IHumanEmulator } from '@unblocked-web/emulator-spec/IHumanEmulator';

export default interface ICorePlugins extends Omit<ICorePlugin, 'id'> {
  browserEmulator: IBrowserEmulator;
  humanEmulator: IHumanEmulator;

  use(CorePlugin: ICorePluginClass): void;
}
