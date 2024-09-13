import { IHooksProvider } from '../agent/hooks/IHooks';
import IEmulationProfile from './IEmulationProfile';
import { IFrame } from '../agent/browser/IFrame';

export default interface IUnblockedPlugin<T = any> extends IHooksProvider {
  addDomOverride?(
    runOn: 'page' | 'worker',
    script: string,
    args: Record<string, any> & { callbackName?: string },
    callback?: (data: string, frame: IFrame) => any,
  ): boolean;
  configure?(emulationProfile: IEmulationProfile<T>): void | Promise<void>;
  onClose?(): void;
}

export interface IUnblockedPluginClass<C extends object = any, T = any> {
  id: string;
  shouldActivate?(emulationProfile: IEmulationProfile<T>, customConfig?: PluginCustomConfig<C>): boolean;
  new (emulationProfile: IEmulationProfile<T>, customConfig?: C): IUnblockedPlugin<T>;
}

// True = always enabled -> this will skip shouldEnable
// False = never enabled
// Config = passed to shouldEnable and constructor, plugin can handle accordingly
export type UnblockedPluginConfig<C extends object = any> = PluginIsEnabledOrDisabled | PluginCustomConfig<C>;
export type PluginIsEnabledOrDisabled = boolean;
export type PluginCustomConfig<C extends object = any> = C;

// key = plugin.id
export type PluginConfigs = Record<string, UnblockedPluginConfig>;

// decorator for browser emulator classes. hacky way to check the class implements statics we need
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function UnblockedPluginClassDecorator(staticClass: IUnblockedPluginClass): void {}
