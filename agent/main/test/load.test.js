"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("@ulixee/unblocked-agent-testing/index");
const index_2 = require("../index");
const server_1 = require("./server");
describe('Load test', () => {
    let server;
    let browser;
    let context;
    beforeEach(() => {
        index_1.TestLogger.testNumber += 1;
    });
    beforeAll(async () => {
        server = await server_1.TestServer.create(0);
        index_1.Helpers.onClose(() => server.stop(), true);
        browser = new index_2.Browser(index_1.BrowserUtils.browserEngineOptions);
        index_1.Helpers.onClose(() => browser.close(), true);
        await browser.launch();
        const logger = index_1.TestLogger.forTest(module);
        context = await browser.newContext({ logger });
        index_1.Helpers.onClose(() => context.close(), true);
        server.setRoute('/link.html', async (req, res) => {
            res.setHeader('Content-Type', 'text/html');
            res.end(`
<body>
<a href="${server.crossProcessBaseUrl}/empty.html">This is a link</a>
</body>
`);
        });
    });
    afterAll(index_1.Helpers.afterAll);
    afterEach(index_1.Helpers.afterEach);
    it('should be able to capture navigation events under load', async () => {
        const concurrent = new Array(50).fill(0).map(async () => {
            let page;
            try {
                page = await context.newPage();
                await page.goto(server.url('link.html'), { timeoutMs: 75e3 });
                const waitForLocation = page.mainFrame.waitForLocation('change');
                await page.click('a');
                await waitForLocation;
                expect(page.mainFrame.url).toBe(`${server.crossProcessBaseUrl}/empty.html`);
            }
            finally {
                await page?.close();
            }
        });
        await Promise.all(concurrent);
    }, 75e3);
});
//# sourceMappingURL=load.test.js.map