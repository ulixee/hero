import { IPluginClass } from '@secret-agent/interfaces/IPlugin';
import IPluginType, { PluginTypes } from '@secret-agent/interfaces/IPluginTypes';

export default function extractPlugins<T = IPluginClass>(obj: any, pluginType?: IPluginType): T[] {
  const Plugins: T[] = [];
  if (!obj) return Plugins;

  if (isPluginMatch(obj, pluginType)) {
    Plugins.push(obj);
    return Plugins;
  }

  const PotentialPlugins: any[] = Array.isArray(obj) ? obj : Object.values(obj);
  for (const PotentialPlugin of PotentialPlugins) {
    if (!PotentialPlugin) continue;
    if (isPluginMatch(PotentialPlugin, pluginType)) {
      Plugins.push(PotentialPlugin as unknown as T);
    }
  }

  return Plugins;
}

function isPluginMatch(PotentialPlugin: any, pluginType?: IPluginType) {
  if (pluginType) {
    return PotentialPlugin.type === pluginType;
  }
  if (PotentialPlugin.type === PluginTypes.ClientPlugin) return true;
  if (PotentialPlugin.type === PluginTypes.CorePlugin) return true;
  if (PotentialPlugin.type === PluginTypes.BrowserEmulator) return true;
  if (PotentialPlugin.type === PluginTypes.HumanEmulator) return true;
  return false;
}
