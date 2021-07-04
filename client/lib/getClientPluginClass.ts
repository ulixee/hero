import { IClientPluginClass } from '@secret-agent/interfaces/IClientPlugin';
import ClientPlugin from '@secret-agent/plugin-utils/lib/ClientPlugin';
import { PluginTypes } from '@secret-agent/interfaces/IPluginTypes';

export default function getClientPluginClass(PluginObject: any): IClientPluginClass {
  if (isClientPluginClass(PluginObject)) {
    return PluginObject;
  }
  if (isClientPluginClass(PluginObject.ClientPlugin)) {
    return PluginObject.ClientPlugin;
  }
  throw new Error(`Plugin (${PluginObject.name}) is not a valid ClientPlugin`);
}

function isClientPluginClass(PluginObject: any): boolean {
  if (!PluginObject) return false;
  if (PluginObject.prototype instanceof ClientPlugin) {
    return true;
  }
  return PluginObject.type === PluginTypes.ClientPlugin;
}
