"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_testing_1 = require("@ulixee/hero-testing");
const index_1 = require("../index");
let koaServer;
let core;
beforeAll(async () => {
    core = await index_1.default.start();
    koaServer = await hero_testing_1.Helpers.runKoaServer(true);
});
afterAll(hero_testing_1.Helpers.afterAll);
afterEach(hero_testing_1.Helpers.afterEach);
test('can wait for sub-frames to load', async () => {
    const connection = core.addConnection();
    hero_testing_1.Helpers.onClose(() => connection.disconnect());
    const meta = await connection.createSession();
    const tab = index_1.Session.getTab(meta);
    hero_testing_1.Helpers.needsClosing.push(tab.session);
    koaServer.get('/main', ctx => {
        ctx.body = `
        <body>
        <h1>Iframe Page</h1>
<iframe name="sub" src="/delay"></iframe>
        </body>
      `;
    });
    koaServer.get('/delay', async (ctx) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        ctx.body = `
        <body>
        <h1>SubPage</h1>
        </body>
      `;
    });
    await tab.goto(`${koaServer.baseUrl}/main`);
    await hero_testing_1.Helpers.waitForElement(['document', ['querySelector', 'iframe']], tab.mainFrameEnvironment);
    const frames = await tab.getFrameEnvironments();
    expect(frames).toHaveLength(2);
    const frameMeta = frames.find(x => x.parentFrameId !== null);
    const subFrame = tab.frameEnvironmentsById.get(frameMeta.id);
    await expect(subFrame.waitForLoad('PaintingStable')).resolves.toBeTruthy();
});
test('should allow query selectors in cross-domain frames', async () => {
    const connection = core.addConnection();
    hero_testing_1.Helpers.onClose(() => connection.disconnect());
    const meta = await connection.createSession();
    const session = index_1.Session.get(meta.sessionId);
    hero_testing_1.Helpers.needsClosing.push(session);
    const tab = index_1.Session.getTab(meta);
    koaServer.get('/iframePage', ctx => {
        ctx.body = `
        <body>
        <h1>Iframe Page</h1>
<iframe src="https://framesy.org/page"></iframe>
        </body>
      `;
    });
    session.mitmRequestSession.interceptorHandlers.push({
        urls: ['https://framesy.org'],
        handlerFn(url, type, request, response) {
            response.end(`<html lang="en"><body>
<h1>Framesy Page</h1>
<div>This is content inside the frame</div>
</body></html>`);
            return true;
        },
    });
    await tab.goto(`${koaServer.baseUrl}/iframePage`);
    await tab.waitForLoad('DomContentLoaded');
    const outerH1 = await tab.execJsPath([
        'window',
        'document',
        ['querySelector', 'h1'],
        'textContent',
    ]);
    expect(outerH1.value).toBe('Iframe Page');
    // should not allow cross-domain access
    await expect(tab.execJsPath([
        'window',
        'document',
        ['querySelector', 'iframe'],
        'contentDocument',
        ['querySelector', 'h1'],
        'textContent',
    ])).rejects.toThrow();
    const frameMetas = await tab.getFrameEnvironments();
    const frames = await Promise.all(frameMetas.map(async (x) => {
        const env = tab.frameEnvironmentsById.get(x.id);
        await env.waitForLoad('DomContentLoaded');
        return env.toJSON();
    }));
    const innerFrameMeta = frames.find(x => x.url === 'https://framesy.org/page');
    const innerFrame = tab.frameEnvironmentsById.get(innerFrameMeta.id);
    const innerH1 = await innerFrame.execJsPath([
        'window',
        'document',
        ['querySelector', 'h1'],
        'textContent',
    ]);
    expect(innerH1.value).toBe('Framesy Page');
});
//# sourceMappingURL=frames.test.js.map