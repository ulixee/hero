import { PluginTypes } from './IPluginTypes';
import ICorePluginCreateOptions from './ICorePluginCreateOptions';
import { IPage } from '@bureau/interfaces/IPage';
import ISessionCreateOptions from './ISessionCreateOptions';
import { IFrame } from '@bureau/interfaces/IFrame';
import { IBrowserEmulatorMethods } from '@bureau/interfaces/IBrowserEmulator';
import { IHumanEmulatorMethods } from '@bureau/interfaces/IHumanEmulator';

export default interface ICorePlugin
  extends ICorePluginMethods,
    IBrowserEmulatorMethods,
    IHumanEmulatorMethods {
  id: string;
  readonly sessionSummary?: ISessionSummary;
}

export interface ICorePluginClass {
  id: string;
  type: keyof typeof PluginTypes;
  new (createOptions: ICorePluginCreateOptions): ICorePlugin;
}

export interface ICorePluginMethods {
  onClientCommand?(meta: IOnClientCommandMeta, ...args: any[]): Promise<any>;
}

export interface IOnClientCommandMeta {
  page: IPage;
  frame?: IFrame;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CorePluginClassDecorator(staticClass: ICorePluginClass): void {}

export interface ISessionSummary {
  id: string;
  options?: ISessionCreateOptions;
}
