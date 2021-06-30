import { IPuppetPage } from './IPuppetPage';
import { IBrowserEmulatorMethods } from './IPluginBrowserEmulator';
import { IHumanEmulatorMethods } from './IPluginHumanEmulator';
import { PluginTypes } from './IPluginTypes';
import IPluginCreateOptions from './IPluginCreateOptions';

export interface ICoreExtenderClass {
  id: string;
  pluginType: PluginTypes.CoreExtender;
  new (createOptions: IPluginCreateOptions): ICoreExtender;
}

export interface ICoreExtender extends IBrowserEmulatorMethods, IHumanEmulatorMethods {
  id: string;
  onCommand?(meta: IOnCommandMeta, ...args: any[]): Promise<any>;
}

export interface IOnCommandMeta {
  puppetPage: IPuppetPage;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CoreExtenderClassDecorator(constructor: ICoreExtenderClass): void {}
