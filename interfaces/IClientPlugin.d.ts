import type { Tab, FrameEnvironment } from '@ulixee/hero';
import type Hero from '@ulixee/hero/lib/Hero';
import { PluginTypes } from './IPluginTypes';
export default interface IClientPlugin {
    id: string;
    onHero?(hero: Hero, sendToCore: ISendToCoreFn): void;
    onTab?(hero: Hero, tab: Tab, sendToCore: ISendToCoreFn): void;
    onFrameEnvironment?(hero: Hero, frameEnvironment: FrameEnvironment, sendToCore: ISendToCoreFn): void;
}
export interface IClientPluginClass {
    id: string;
    type: typeof PluginTypes.ClientPlugin;
    coreDependencyIds?: string[];
    new (): IClientPlugin;
}
export declare function ClientPluginClassDecorator(staticClass: IClientPluginClass): void;
export type ISendToCoreFn = (toPluginId: string, ...args: any[]) => Promise<any>;
