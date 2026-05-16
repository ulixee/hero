"use strict";
// NOTE: You need to start a Ulixee Cloud to run this example
Object.defineProperty(exports, "__esModule", { value: true });
const p_queue_1 = require("p-queue");
const hero_1 = require("@ulixee/hero");
(async () => {
    let cost = '0';
    async function getDatasetCost({ name, href }) {
        if (!href.startsWith('http'))
            href = `https://ulixee.org${href}`;
        const hero = new hero_1.default();
        console.log(href);
        await hero.goto(href);
        await hero.waitForPaintingStable();
        console.log('Page Loaded', href);
        cost = await hero.document.querySelector('.cost .large-text').textContent;
        console.log('Cost of %s is %s', name, cost);
        await hero.close();
    }
    const queue = new p_queue_1.default({ concurrency: 2 });
    const hero = new hero_1.default();
    await hero.goto('https://ulixee.org');
    const datasetLinks = await hero.document.querySelectorAll('a.DatasetSummary');
    for (const link of datasetLinks) {
        const name = await link.querySelector('.title').textContent;
        const href = await link.getAttribute('href');
        queue.add(() => getDatasetCost({ name, href }));
    }
    await hero.close();
    await queue.onIdle();
    console.log({ cost });
})();
//# sourceMappingURL=ulixee.org.js.map