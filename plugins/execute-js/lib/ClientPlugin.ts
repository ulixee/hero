import { ISendToCoreFn } from '@ulixee/hero-interfaces/IClientPlugin';
import ClientPlugin from '@ulixee/hero-plugin-utils/lib/ClientPlugin';
import type Hero from '@ulixee/hero';
import type Tab from '@ulixee/hero/lib/Tab';
import type FrameEnvironment from '@ulixee/hero/lib/FrameEnvironment';
import { IExecuteJsArgs } from './IExecuteJsArgs';

const { name: pluginId } = require('../package.json');

export default class ExecuteJsClientPlugin extends ClientPlugin {
  public static id = pluginId;
  public static coreDependencyIds = [pluginId];

  public onHero(hero: Hero, sendToCore: ISendToCoreFn): void {
    hero.executeJs = this.executeJs.bind(this, sendToCore);
  }

  public onTab(hero: Hero, tab: Tab, sendToCore: ISendToCoreFn): void {
    tab.executeJs = this.executeJs.bind(this, sendToCore);
  }

  public onFrameEnvironment(
    hero: Hero,
    frameEnvironment: FrameEnvironment,
    sendToCore: ISendToCoreFn,
  ): void {
    frameEnvironment.executeJs = this.executeJs.bind(this, sendToCore);
  }

  // PRIVATE

  private executeJs<T extends any[]>(
    sendToCore: ISendToCoreFn,
    fn: string | ((...args: T) => any),
    ...args: T
  ): Promise<any> {
    let fnName = '';
    let fnSerialized = fn as string;
    if (typeof fn !== 'string') {
      fnName = fn.name;
      fnSerialized = `(${fn.toString()})(${JSON.stringify(args).slice(1, -1)});`;
    }
    return sendToCore(pluginId, <IExecuteJsArgs>{
      fnName,
      fnSerialized,
      args,
      isolateFromWebPageEnvironment: false,
    });
  }
}
