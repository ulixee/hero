"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_testing_1 = require("@ulixee/hero-testing");
const hero_core_1 = require("@ulixee/hero-core");
let koaServer;
beforeAll(async () => {
    koaServer = await hero_testing_1.Helpers.runKoaServer();
});
afterAll(hero_testing_1.Helpers.afterAll);
afterEach(hero_testing_1.Helpers.afterEach);
describe('basic DomExtender tests', () => {
    it('can run xpathSelector', async () => {
        koaServer.get('/domextender-xpath', ctx => {
            ctx.body = `
        <body>
          <h2>here</h2>
        </body>
      `;
        });
        const hero = await openBrowser(`/domextender-xpath`);
        await expect(hero.xpathSelector('//h2').textContent).resolves.toBe('here');
    });
    it('can run xpathSelectorAll', async () => {
        koaServer.get('/domextender-xpath-all', ctx => {
            ctx.body = `
        <body>
          <h2>here 1</h2>
          <h2>here 2</h2>
          <h2>here 3</h2>
        </body>
      `;
        });
        const hero = await openBrowser(`/domextender-xpath-all`);
        const xpathAll = await hero.xpathSelectorAll('//h2');
        let counter = 0;
        for (const entry of xpathAll) {
            counter += 1;
            await expect(entry.textContent).resolves.toBe(`here ${counter}`);
        }
    });
    it('can find the focused field', async () => {
        koaServer.get('/domextender-focused', ctx => {
            ctx.body = `<body><input id="field" type="text"/></body>`;
        });
        const hero = await openBrowser(`/domextender-focused`);
        await expect(hero.querySelector('#field').$hasFocus).resolves.toBe(false);
        await expect(hero.querySelector('#field').$click()).resolves.toBe(undefined);
        await expect(hero.querySelector('#field').$hasFocus).resolves.toBe(true);
    });
    it('can clear a field', async () => {
        koaServer.get('/domextender-clear', ctx => {
            ctx.body = `<body><input id="field" type="text" value="1234Test"/></body>`;
        });
        const hero = await openBrowser(`/domextender-clear`);
        await expect(hero.querySelector('#field').$clearInputText()).resolves.toBe(undefined);
        await expect(hero.querySelector('#field').value).resolves.toBe('');
    });
    it('can penetrate cross-domain iframes', async () => {
        const hero = new hero_testing_1.Hero();
        hero_testing_1.Helpers.needsClosing.push(hero);
        const session = hero_core_1.Session.get(await hero.sessionId);
        session.agent.mitmRequestSession.interceptorHandlers.push({
            urls: ['https://ulixee.org/iframe'],
            handlerFn(url, type, request, response) {
                response.end(`<html lang='en'>
<body>
<h1>Frame Title</h1>
</body>
</html>`);
                return true;
            },
        });
        koaServer.get('/domextender-iframe-test', async (ctx) => {
            ctx.body = `<html lang='en'>
<body><h1>Page Title</h1>
<iframe id='frame1' src='https://ulixee.org/iframe'></iframe>
</body>
</html>`;
        });
        await hero.goto(`${koaServer.baseUrl}/domextender-iframe-test`);
        await hero.activeTab.waitForLoad('AllContentLoaded');
        await expect(hero.querySelector('h1').textContent).resolves.toBe('Page Title');
        await expect(hero.querySelector('#frame1').$contentDocument.querySelector('h1').textContent).resolves.toBe('Frame Title');
    });
});
async function openBrowser(path) {
    const hero = new hero_testing_1.Hero();
    hero_testing_1.Helpers.needsClosing.push(hero);
    await hero.goto(`${koaServer.baseUrl}${path}`);
    await hero.waitForPaintingStable();
    return hero;
}
//# sourceMappingURL=domExtenders.test.js.map