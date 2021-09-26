// eslint-disable-next-line max-classes-per-file
import type Hero from '@ulixee/hero';
import type Tab from '@ulixee/hero/lib/Tab';
import { ClientPlugin, CorePlugin } from '@ulixee/hero-plugin-utils';
import { IOnClientCommandMeta } from '@ulixee/hero-interfaces/ICorePlugin';
import { ISendToCoreFn } from '@ulixee/hero-interfaces/IClientPlugin';

export class EchoClientPlugin extends ClientPlugin {
  static readonly id = 'echo-plugin';
  static coreDependencyIds = [EchoClientPlugin.id];

  public onHero(hero: Hero, sendToCore: ISendToCoreFn): void {
    hero.echo = (echo1: string, echo2: number, ...echoAny: any[]) => {
      return this.echo(sendToCore, echo1, echo2, ...echoAny);
    };
  }

  public onTab(hero: Hero, tab: Tab, sendToCore: ISendToCoreFn): void {
    tab.echo = (echo1: string, echo2: number, ...echoAny: any[]) => {
      return this.echo(sendToCore, echo1, echo2, ...echoAny);
    };
  }

  private async echo(
    sendToCore: ISendToCoreFn,
    echo1: string,
    echo2: number,
    ...echoAny: any[]
  ): Promise<[string, number, ...any[]]> {
    return await sendToCore(EchoClientPlugin.id, echo1, echo2, ...echoAny);
  }
}

export class EchoCorePlugin extends CorePlugin {
  static readonly id = 'echo-plugin';

  public onClientCommand(
    { puppetPage }: IOnClientCommandMeta,
    echo1: string,
    echo2: number,
    ...echoAny: any[]
  ): Promise<any> {
    return Promise.resolve([echo1, echo2, ...echoAny]);
  }
}

type EchoPluginAdditions = {
  echo(echo1: string, echo2: number, ...echoAny: any[]): Promise<[string, number, ...any[]]>;
};

declare module '@ulixee/hero/lib/extendables' {
  interface Hero extends EchoPluginAdditions {}
  interface Tab extends EchoPluginAdditions {}
}
