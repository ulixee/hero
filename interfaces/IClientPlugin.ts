import { PluginTypes } from './IPluginTypes';
import IAgent from './IAgent';
import ITab from './ITab';

export default interface IClientPlugin {
  id: string;

  onAgent?(agent: IAgent, sendToCore: ISendToCoreFn): void;
  onTab?(agent: IAgent, tab: ITab, sendToCore: ISendToCoreFn): void;
}

export interface IClientPluginClass {
  id: string;
  type: PluginTypes.ClientPlugin;
  coreDependencyIds?: string[];
  new (): IClientPlugin;
}

// decorator for client plugin classes. hacky way to check the class implements statics we need
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ClientPluginClassDecorator(constructor: IClientPluginClass): void {}

export type ISendToCoreFn = (toPluginId: string, ...args: any[]) => Promise<any>;
