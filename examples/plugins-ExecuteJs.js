"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_core_1 = require("@ulixee/hero-core");
const hero_1 = require("@ulixee/hero");
const execute_js_plugin_1 = require("@ulixee/execute-js-plugin");
hero_core_1.default.use(execute_js_plugin_1.default);
// NOTE: You need to start a Ulixee Cloud **in this same process** to run this example
require("./server");
(async function main() {
    const hero = new hero_1.default();
    hero.use(execute_js_plugin_1.default);
    await hero.goto('https://ulixee.org');
    await hero.activeTab.waitForPaintingStable();
    const divs = await hero.executeJs(() => {
        // @ts-ignore
        return window.document.querySelectorAll('div').length;
    });
    console.log('Divs on https://ulixee.org?', divs);
    await hero.close();
})();
//# sourceMappingURL=plugins-ExecuteJs.js.map