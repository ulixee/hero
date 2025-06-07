"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ClientPlugin_1 = require("@ulixee/hero-plugin-utils/lib/ClientPlugin");
const { name: pluginId } = require('../package.json');
class ExecuteJsClientPlugin extends ClientPlugin_1.default {
    onHero(hero, sendToCore) {
        hero.executeJs = this.executeJs.bind(this, sendToCore);
    }
    onTab(hero, tab, sendToCore) {
        tab.executeJs = this.executeJs.bind(this, sendToCore);
    }
    onFrameEnvironment(hero, frameEnvironment, sendToCore) {
        frameEnvironment.executeJs = this.executeJs.bind(this, sendToCore);
    }
    // PRIVATE
    executeJs(sendToCore, fn, ...args) {
        let fnName = '';
        let fnSerialized = fn;
        if (typeof fn !== 'string') {
            fnName = fn.name;
            fnSerialized = `(${fn.toString()})(${JSON.stringify(args).slice(1, -1)});`;
        }
        return sendToCore(pluginId, {
            fnName,
            fnSerialized,
            args,
            isolateFromWebPageEnvironment: false,
        });
    }
}
ExecuteJsClientPlugin.id = pluginId;
ExecuteJsClientPlugin.coreDependencyIds = [pluginId];
exports.default = ExecuteJsClientPlugin;
//# sourceMappingURL=ClientPlugin.js.map