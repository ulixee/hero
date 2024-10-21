"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EchoCorePlugin = exports.EchoClientPlugin = void 0;
const hero_plugin_utils_1 = require("@ulixee/hero-plugin-utils");
class EchoClientPlugin extends hero_plugin_utils_1.ClientPlugin {
    onHero(hero, sendToCore) {
        hero.echo = (echo1, echo2, ...echoAny) => {
            return this.echo(sendToCore, echo1, echo2, ...echoAny);
        };
    }
    onTab(hero, tab, sendToCore) {
        tab.echo = (echo1, echo2, ...echoAny) => {
            return this.echo(sendToCore, echo1, echo2, ...echoAny);
        };
    }
    async echo(sendToCore, echo1, echo2, ...echoAny) {
        return await sendToCore(EchoClientPlugin.id, echo1, echo2, ...echoAny);
    }
}
exports.EchoClientPlugin = EchoClientPlugin;
EchoClientPlugin.id = 'echo-plugin';
EchoClientPlugin.coreDependencyIds = [EchoClientPlugin.id];
class EchoCorePlugin extends hero_plugin_utils_1.CorePlugin {
    onClientCommand({ page }, echo1, echo2, ...echoAny) {
        return Promise.resolve([echo1, echo2, ...echoAny]);
    }
}
exports.EchoCorePlugin = EchoCorePlugin;
EchoCorePlugin.id = 'echo-plugin';
//# sourceMappingURL=plugins-EchoClasses.js.map