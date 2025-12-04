"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_playground_1 = require("@ulixee/hero-playground");
(async () => {
    const hero = new hero_playground_1.default({
        showChrome: false,
        disableMitm: false,
    });
    await hero.goto('https://ulixee.org/docs/hero/plugins/core-plugins');
    await hero.activeTab.on('resource', async (resource) => {
        console.log(resource);
    });
    console.log(hero, hero.tabs, hero.activeTab);
    await hero.waitForPaintingStable();
    await hero.waitForLoad(hero_playground_1.LocationStatus.AllContentLoaded);
    await hero.reload();
    await hero.close();
})();
//# sourceMappingURL=resources.js.map