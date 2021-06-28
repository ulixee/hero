import { PluginTypes } from './IPluginTypes';
import IAgent from './IAgent';
import ITab from './ITab';

export interface IClientExtenderClass {
  id: string;
  pluginType: PluginTypes.ClientExtender;
  coreDependencyIds?: string[];
  new (): IClientExtender;
}

export interface IClientExtender {
  id: string;
  pluginType: PluginTypes.ClientExtender;
  onAgent?(agent: IAgent, sendToCore: ISendToCoreFn): void;
  onTab?(agent: IAgent, tab: ITab, sendToCore: ISendToCoreFn): void;
}

// decorator for client extender classes. hacky way to check the class implements statics we need
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ClientExtenderClassDecorator(constructor: IClientExtenderClass): void {}

export type ISendToCoreFn = (command: string, ...args: any[]) => Promise<any>;
