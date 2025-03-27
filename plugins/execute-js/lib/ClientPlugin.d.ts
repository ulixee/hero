import { ISendToCoreFn } from '@ulixee/hero-interfaces/IClientPlugin';
import ClientPlugin from '@ulixee/hero-plugin-utils/lib/ClientPlugin';
import type Hero from '@ulixee/hero';
import type Tab from '@ulixee/hero/lib/Tab';
import type FrameEnvironment from '@ulixee/hero/lib/FrameEnvironment';
export default class ExecuteJsClientPlugin extends ClientPlugin {
    static id: any;
    static coreDependencyIds: any[];
    onHero(hero: Hero, sendToCore: ISendToCoreFn): void;
    onTab(hero: Hero, tab: Tab, sendToCore: ISendToCoreFn): void;
    onFrameEnvironment(hero: Hero, frameEnvironment: FrameEnvironment, sendToCore: ISendToCoreFn): void;
    private executeJs;
}
