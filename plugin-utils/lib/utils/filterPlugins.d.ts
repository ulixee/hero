import { IPluginType } from '@ulixee/hero-interfaces/IPluginTypes';
import { IPluginClass } from '@ulixee/hero-interfaces/IPlugin';
export default function filterPlugins<T = IPluginClass>(Plugins: IPluginClass[], pluginType: IPluginType): T[];
