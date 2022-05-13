import { IFrame } from '@unblocked-web/specifications/agent/browser/IFrame';
import IAgentPlugin from '@unblocked-web/specifications/plugin/IAgentPlugin';
import IEmulationProfile from '@unblocked-web/specifications/plugin/IEmulationProfile';
import { IPage } from '@unblocked-web/specifications/agent/browser/IPage';
import { PluginTypes } from './IPluginTypes';
import ICorePluginCreateOptions from './ICorePluginCreateOptions';
import ISessionCreateOptions from './ISessionCreateOptions';

export default interface ICorePlugin extends ICorePluginMethods, IAgentPlugin {
  id: string;
  readonly sessionSummary?: ISessionSummary;
}

export interface ICorePluginClass {
  id: string;
  type: keyof typeof PluginTypes;
  new (createOptions: ICorePluginCreateOptions): ICorePlugin;
  shouldActivate?(
    emulationProfile: IEmulationProfile<unknown>,
    sessionSummary: ISessionSummary,
  ): boolean;
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
