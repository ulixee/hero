import { BrowserUtils, Helpers, TestLogger } from '@ulixee/unblocked-agent-testing/index';
import { Browser, BrowserContext, Page } from '../index';
import { TestServer } from './server';

describe('Load test', () => {
  let server: TestServer;
  let browser: Browser;
  let context: BrowserContext;

  beforeEach(() => {
    TestLogger.testNumber += 1;
  });

  beforeAll(async () => {
    server = await TestServer.create(0);
    Helpers.onClose(() => server.stop(), true);
    browser = new Browser(BrowserUtils.browserEngineOptions);
    Helpers.onClose(() => browser.close(), true);
    await browser.launch();

    const logger = TestLogger.forTest(module);
    context = await browser.newContext({ logger });
    Helpers.onClose(() => context.close(), true);
    server.setRoute('/link.html', async (req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.end(`
<body>
<a href="${server.crossProcessBaseUrl}/empty.html">This is a link</a>
</body>
`);
    });
  });

  afterAll(Helpers.afterAll);
  afterEach(Helpers.afterEach);

  it('should be able to capture navigation events under load', async () => {
    const concurrent = new Array(50).fill(0).map(async () => {
      let page: Page;
      try {
        page = await context.newPage();
        await page.goto(server.url('link.html'), { timeoutMs: 75e3 });
        const waitForLocation = page.mainFrame.waitForLocation('change');
        await page.click('a');
        await waitForLocation;
        expect(page.mainFrame.url).toBe(`${server.crossProcessBaseUrl}/empty.html`);
      } finally {
        await page?.close();
      }
    });
    await Promise.all(concurrent);
  }, 75e3);
});
