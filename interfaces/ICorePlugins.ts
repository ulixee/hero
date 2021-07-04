import ICorePlugin, { ICorePluginClass, IBrowserEmulator, IHumanEmulator } from './ICorePlugin';

export default interface ICorePlugins extends Omit<ICorePlugin, 'id'> {
  browserEmulator: IBrowserEmulator;
  humanEmulator: IHumanEmulator;

  use(CorePlugin: ICorePluginClass): void;
}
