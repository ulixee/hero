import { PluginTypes } from './IPluginTypes';
import ICorePluginCreateOptions from './ICorePluginCreateOptions';
import { IPage } from '@unblocked-web/emulator-spec/browser/IPage';
import ISessionCreateOptions from './ISessionCreateOptions';
import { IFrame } from '@unblocked-web/emulator-spec/browser/IFrame';
import { IBrowserEmulatorMethods } from '@unblocked-web/emulator-spec/IBrowserEmulator';
import { IHumanEmulatorMethods } from '@unblocked-web/emulator-spec/IHumanEmulator';

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
