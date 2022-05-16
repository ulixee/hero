import { IPluginClass } from '@ulixee/hero-interfaces/IPlugin';
import { IPluginType } from '@ulixee/hero-interfaces/IPluginTypes';
import extractPlugins from './extractPlugins';
import filterPlugins from './filterPlugins';

const byPath: { [path: string]: any[] } = {};

export default function requirePlugins<T = IPluginClass>(
  path: string,
  pluginType?: IPluginType,
): T[] {
  if (!byPath[path]) {
    byPath[path] = [];
    // eslint-disable-next-line global-require,import/no-dynamic-require
    byPath[path] = extractPlugins<T>(require(path));
  }

  return (pluginType ? filterPlugins(byPath[path], pluginType) : byPath[path]) as T[];
}
