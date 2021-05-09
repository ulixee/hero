import { IClientExtenderClass } from '@secret-agent/interfaces/IPluginClientExtender';
import ClientExtenderBase from '@secret-agent/plugin-utils/lib/ClientExtenderBase';
import { PluginTypes } from "@secret-agent/interfaces/IPluginTypes";

export default function getClientExtenderPluginClass(PluginObject: any): IClientExtenderClass {
  if (isClientExtenderPluginClass(PluginObject)) {
    return PluginObject;
  }
  if (isClientExtenderPluginClass(PluginObject.ClientExtender)) {
    return PluginObject.ClientExtender;
  }
  throw new Error(`Plugin (${PluginObject.name}) is not a valid ClientExtender`);
}

function isClientExtenderPluginClass(PluginObject: any): boolean {
  if (!PluginObject) return false;
  if (PluginObject.prototype instanceof ClientExtenderBase) {
    return true;
  }
  return PluginObject.pluginType === PluginTypes.ClientExtender;
}
