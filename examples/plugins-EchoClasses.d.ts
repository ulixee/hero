import type Hero from '@ulixee/hero';
import type Tab from '@ulixee/hero/lib/Tab';
import { ClientPlugin, CorePlugin } from '@ulixee/hero-plugin-utils';
import { IOnClientCommandMeta } from '@ulixee/hero-interfaces/ICorePlugin';
import { ISendToCoreFn } from '@ulixee/hero-interfaces/IClientPlugin';
export declare class EchoClientPlugin extends ClientPlugin {
    static readonly id = "echo-plugin";
    static coreDependencyIds: string[];
    onHero(hero: Hero, sendToCore: ISendToCoreFn): void;
    onTab(hero: Hero, tab: Tab, sendToCore: ISendToCoreFn): void;
    private echo;
}
export declare class EchoCorePlugin extends CorePlugin {
    static readonly id = "echo-plugin";
    onClientCommand({ page }: IOnClientCommandMeta, echo1: string, echo2: number, ...echoAny: any[]): Promise<any>;
}
type EchoPluginAdditions = {
    echo(echo1: string, echo2: number, ...echoAny: any[]): Promise<[string, number, ...any[]]>;
};
declare module '@ulixee/hero/lib/extendables' {
    interface Hero extends EchoPluginAdditions {
    }
    interface Tab extends EchoPluginAdditions {
    }
}
export {};
