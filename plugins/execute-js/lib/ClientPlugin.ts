import { ISendToCoreFn } from '@ulixee/hero-interfaces/IClientPlugin';
import ClientPlugin from '@ulixee/hero-plugin-utils/lib/ClientPlugin';

const { name: pluginId } = require('../package.json');

export default class ExecuteJsClientPlugin extends ClientPlugin {
  public static id = pluginId;
  public static coreDependencyIds = [pluginId];

  public onHero(hero, sendToCore: ISendToCoreFn) {
    hero.executeJs = (fn, ...args) => {
      return this.executeJs(fn, sendToCore, args);
    };
  }

  public onTab(tab, sendToCore: ISendToCoreFn) {
    tab.executeJs = (fn, ...args) => {
      return this.executeJs(fn, sendToCore, args);
    };
  }

  // PRIVATE

  private executeJs(fn, sendToCore, args): Promise<any> {
    let fnName;
    let fnSerialized;
    if (typeof fn === 'string') {
      fnName = '';
      fnSerialized = fn;
    } else {
      fnName = fn.name;
      fnSerialized = `(${fn.toString()})(${JSON.stringify(args).slice(1, -1)});`;
    }
    return sendToCore(pluginId, fnName, fnSerialized, args);
  }
}
