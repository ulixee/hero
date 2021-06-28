import { ICoreExtender } from './IPluginCoreExtender';
import IPluginType from './IPluginTypes';
import IPluginCreateOptions from './IPluginCreateOptions';

export default interface IPlugin extends ICoreExtender {}

export interface IPluginClass {
  id: string;
  pluginType: IPluginType;
  new (createOptions: IPluginCreateOptions): IPlugin;
}
