"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const default_browser_emulator_1 = require("@ulixee/default-browser-emulator");
const hero_1 = require("@ulixee/hero");
const hero_core_1 = require("@ulixee/hero-core");
const execute_js_plugin_1 = require("@ulixee/execute-js-plugin");
const hero_2 = require("@ulixee/hero");
const TransportBridge_1 = require("@ulixee/net/lib/TransportBridge");
async function run() {
    hero_core_1.default.defaultUnblockedPlugins = [default_browser_emulator_1.default];
    hero_core_1.default.use(execute_js_plugin_1.default);
    const bridge = new TransportBridge_1.default();
    const connectionToCore = new hero_1.ConnectionToHeroCore(bridge.transportToCore);
    const heroCore = new hero_core_1.default();
    heroCore.addConnection(bridge.transportToClient);
    const hero = new hero_2.default({ connectionToCore });
    await hero.goto('https://example.org/');
    await hero.waitForPaintingStable();
    console.log('\n-- PRINTING location.href ---------');
    console.log(await hero.url);
    const outerHtml = await hero.document.documentElement.outerHTML;
    const linkElement = hero.document.querySelector('a');
    console.log('-- PRINTING outerHTML of link ---------------');
    console.log(outerHtml);
    console.log('OUTPUT from https://example.org', {
        outerHtml,
        title: await hero.document.title,
        intro: await hero.document.querySelector('p').textContent,
        linkTag: await linkElement.outerHTML,
    });
    console.log('-------------------------------------');
    await linkElement.$click();
    await hero.waitForLocation(hero_2.LocationTrigger.change);
    console.log('NEW LOCATION: ', await hero.document.location.href);
    console.log('-------------------------------------');
    await hero.close();
    await heroCore.close();
}
run().catch(error => console.log(error));
//# sourceMappingURL=plugin.js.map