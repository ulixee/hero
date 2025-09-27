"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_1 = require("@ulixee/hero");
const hero_plugin_utils_1 = require("@ulixee/hero-plugin-utils");
// NOTE: You need to start a Ulixee Cloud to run this example
class ClientHelloPlugin extends hero_plugin_utils_1.ClientPlugin {
    async onHero(hero, sendToCore) {
        console.log('Hello Hero %s', await hero.sessionId);
    }
}
ClientHelloPlugin.id = 'client-hello-plugin';
exports.default = ClientHelloPlugin;
(async function main() {
    const hero = new hero_1.default();
    hero.use(ClientHelloPlugin);
    await hero.goto('https://ulixee.org');
    await hero.activeTab.waitForPaintingStable();
    await hero.close();
})();
//# sourceMappingURL=plugins-HelloHero.js.map