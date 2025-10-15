"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_playground_1 = require("@ulixee/hero-playground");
(async () => {
    const hero = new hero_playground_1.default();
    await hero.goto('https://example.org');
    const title = await hero.document.title;
    const intro = await hero.document.querySelector('p').textContent;
    await hero.close();
    console.log({ title, intro });
})();
//# sourceMappingURL=example.org.js.map