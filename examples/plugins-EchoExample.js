"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_core_1 = require("@ulixee/hero-core");
const hero_1 = require("@ulixee/hero");
const Path = require("path");
// NOTE: You need to start a Ulixee Cloud **in this same process** to run this example
require("./server");
async function run() {
    // For security, need to explicitly activate dynamic loading to allow Core to load a random path.
    hero_core_1.default.allowDynamicPluginLoading = true;
    const hero = new hero_1.default();
    hero.use(Path.join(__dirname, 'plugins-EchoClasses.js'));
    /**
     * Or install into Core and client
     * Core.use(require('./plugin-echo-classes'));
     * hero.use(require('./plugin-echo-classes'));
     **/
    await hero.goto('https://example.org/');
    await hero.waitForPaintingStable();
    const result = await hero.echo('Echo', 1, 2, 3, true);
    console.log('Echo result', {
        sent: ['Echo', 1, 2, 3, true],
        result,
    });
    await hero.close();
    await hero_core_1.default.shutdown();
}
run().catch(error => console.log(error));
//# sourceMappingURL=plugins-EchoExample.js.map