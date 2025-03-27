import { IFrame } from '@ulixee/unblocked-specification/agent/browser/IFrame';
import IUnblockedPlugin, { PluginCustomConfig } from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import { IPage } from '@ulixee/unblocked-specification/agent/browser/IPage';
import { PluginTypes } from './IPluginTypes';
import ICorePluginCreateOptions from './ICorePluginCreateOptions';
import ISessionCreateOptions from './ISessionCreateOptions';
export default interface ICorePlugin extends ICorePluginMethods, IUnblockedPlugin {
    id: string;
    readonly sessionSummary?: ISessionSummary;
}
export interface ICorePluginClass<C extends object = any> {
    id: string;
    type: keyof typeof PluginTypes;
    new (createOptions: ICorePluginCreateOptions): ICorePlugin;
    shouldActivate?(emulationProfile: IEmulationProfile<unknown>, sessionSummary: ISessionSummary, customConfig?: PluginCustomConfig<C>): boolean;
}
export interface ICorePluginMethods {
    onClientCommand?(meta: IOnClientCommandMeta, ...args: any[]): Promise<any>;
}
export interface IOnClientCommandMeta {
    page: IPage;
    frame?: IFrame;
}
export declare function CorePluginClassDecorator(staticClass: ICorePluginClass): void;
export interface ISessionSummary {
    id: string;
    options?: ISessionCreateOptions;
}
