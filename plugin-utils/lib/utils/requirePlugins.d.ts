import { IPluginClass } from '@ulixee/hero-interfaces/IPlugin';
import { IPluginType } from '@ulixee/hero-interfaces/IPluginTypes';
export default function requirePlugins<T = IPluginClass>(path: string, pluginType?: IPluginType): T[];
