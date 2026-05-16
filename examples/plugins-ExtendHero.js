"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_1 = require("@ulixee/hero");
const hero_plugin_utils_1 = require("@ulixee/hero-plugin-utils");
class HeroExtensionPlugin extends hero_plugin_utils_1.ClientPlugin {
    onHero(hero) {
        // define your own hero function,
        // which internally can make use of the actual `Hero` instance,
        // by including it in your own clojure-as-a-method!
        hero.revealAnswers = async (selector) => await hero.querySelectorAll(selector ?? 'li.question').$map(link => link.$click());
    }
}
HeroExtensionPlugin.id = 'hero-extension-plugin';
exports.default = HeroExtensionPlugin;
(async function main() {
    const hero = new hero_1.default();
    hero.use(HeroExtensionPlugin);
    await hero.goto('https://cdpn.io/alexs/fullpage/AJGEWY');
    await hero.activeTab.waitForPaintingStable();
    // you now have the ability to use your own custom function :)
    await hero.revealAnswers();
    await hero.close();
})();
//# sourceMappingURL=plugins-ExtendHero.js.map