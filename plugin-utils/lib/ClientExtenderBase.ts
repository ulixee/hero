import {
  ClientExtenderClassDecorator,
  IClientExtender,
  IClientExtenderClass,
} from '@secret-agent/interfaces/IPluginClientExtender';
import { PluginTypes } from '@secret-agent/interfaces/IPluginTypes';

@ClientExtenderClassDecorator
export default class ClientExtenderBase implements IClientExtender {
  public static readonly id: string;
  public static readonly pluginType = PluginTypes.ClientExtender;

  public readonly id: string;
  public readonly pluginType = PluginTypes.ClientExtender;

  constructor() {
    this.id = (this.constructor as IClientExtenderClass).id as string;
  }
}
