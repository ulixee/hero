import { IPluginType } from '@ulixee/hero-interfaces/IPluginTypes';
import { IPluginClass } from '@ulixee/hero-interfaces/IPlugin';

export default function filterPlugins<T = IPluginClass>(
  Plugins: IPluginClass[],
  pluginType: IPluginType,
): T[] {
  return Plugins.filter(x => x.type === pluginType) as unknown as T[];
}
