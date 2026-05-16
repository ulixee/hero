import { IPluginClass } from '@ulixee/hero-interfaces/IPlugin';
import { IPluginType } from '@ulixee/hero-interfaces/IPluginTypes';
export default function extractPlugins<T = IPluginClass>(obj: any, pluginType?: IPluginType): T[];
