import ICorePlugin, { ICorePluginClass } from './ICorePlugin';
import IClientPlugin, { IClientPluginClass } from './IClientPlugin';
type IPlugin = IClientPlugin | ICorePlugin;
export default IPlugin;
export type IPluginClass = IClientPluginClass | ICorePluginClass;
