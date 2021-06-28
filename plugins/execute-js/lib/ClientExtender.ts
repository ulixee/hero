import { ISendToCoreFn } from '@secret-agent/interfaces/IPluginClientExtender';
import ClientExtenderBase from '@secret-agent/plugin-utils/lib/ClientExtenderBase';

const { name: pluginId } = require('../package.json');

export default class ExecuteJsClientPlugin extends ClientExtenderBase {
  public static id = pluginId;
  public static coreDependencyIds = [pluginId];

  public onAgent(agent, sendToCore: ISendToCoreFn) {
    agent.executeJs = fn => {
      return this.executeJs(fn, sendToCore);
    };
  }

  public onTab(tab, sendToCore: ISendToCoreFn) {
    tab.executeJs = fn => {
      return this.executeJs(fn, sendToCore);
    };
  }

  // PRIVATE

  private executeJs(fn, sendToCore): Promise<any> {
    let fnName;
    let fnSerialized;
    if (typeof fn === 'string') {
      fnName = '';
      fnSerialized = fn;
    } else {
      fnName = fn.name;
      fnSerialized = `(${fn.toString()})();`;
    }
    return sendToCore(pluginId, fnName, fnSerialized);
  }
}
