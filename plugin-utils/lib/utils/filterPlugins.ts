import IPluginType from '@secret-agent/interfaces/IPluginTypes';
import { IPluginClass } from '@secret-agent/interfaces/IPlugin';

export default function filterPlugins<T = IPluginClass>(
  Plugins: IPluginClass[],
  pluginType: IPluginType,
) {
  return (Plugins.filter(x => x.type === pluginType) as unknown) as T[];
}
