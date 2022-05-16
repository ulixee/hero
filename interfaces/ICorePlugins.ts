import ICorePlugin, { ICorePluginClass } from './ICorePlugin';

export default interface ICorePlugins extends Omit<ICorePlugin, 'id'> {
  use(CorePlugin: ICorePluginClass): void;
}
