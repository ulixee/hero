import { TestLogger } from '@ulixee/unblocked-agent-testing';
import { browserEngineOptions, PageHooks } from '@ulixee/unblocked-agent-testing/browserUtils';
import { Browser, BrowserContext, Page } from '../index';
import { TestServer } from './server';

describe('Page.popups', () => {
  let server: TestServer;
  let page: Page;
  let browser: Browser;
  let context: BrowserContext;
  const needsClosing = [];

  beforeAll(async () => {
    server = await TestServer.create(0);
    browser = new Browser(browserEngineOptions);
    await browser.launch();
    const hooks = new PageHooks({
      locale: 'en-GB',
      userAgent: 'popupcity',
      osPlatform: 'Windows95',
    });
    const logger = TestLogger.forTest(module);
    context = await browser.newContext({ logger });
    context.hooks = hooks;
    context.on('page', event => {
      needsClosing.push(event.page);
    });
  });

  afterEach(async () => {
    await page.close();
    for (const close of needsClosing) {
      await close.close();
    }
    needsClosing.length = 0;
  });

  beforeEach(async () => {
    TestLogger.testNumber += 1;
    page = await context.newPage();
    server.reset();
  });

  afterAll(async () => {
    await server.stop();
    await context.close();
    await browser.close();
  });

  describe('Popup tests', () => {
    it('should focus popups by default', async () => {
      await page.goto(server.emptyPage);
      const [popup] = await Promise.all([
        waitForPopup(page),
        page.evaluate(`(() => {
        window.open('${server.emptyPage}');
      })()`),
      ]);
      needsClosing.push(popup);
      expect(await popup.evaluate('document.hasFocus()')).toBe(true);
      expect(await page.evaluate('document.hasFocus()')).toBe(true);
    });

    it('should initialize popups with all context information', async () => {
      server.setRoute('/empty.html', (req, res) => {
        res.end(`<a href="${server.emptyPage}" target="_blank">Click me</a>`);
      });

      await page.goto(server.emptyPage);
      expect(await page.evaluate(`navigator.userAgent`)).toBe('popupcity');
      expect(await page.evaluate(`navigator.platform`)).toBe('Windows95');
      expect(await page.evaluate(`navigator.languages`)).toStrictEqual(['en-GB']);

      const popupPromise = waitForPopup(page);
      await page.click('a');
      const popup = await popupPromise;
      needsClosing.push(popup);
      expect(await popup.evaluate(`navigator.userAgent`)).toBe('popupcity');
      expect(await popup.evaluate(`navigator.platform`)).toBe('Windows95');
    });

    it('calling window.open and window.close', async () => {
      await page.goto(server.emptyPage);
      await expect(
        page.evaluate(`(() => {
      const popup = window.open(window.location.href);
      popup.close();
    })()`),
      ).resolves.toBe(undefined);
    });

    it('should be able to capture concurrent popup navigations', async () => {
      const concurrent = new Array(5).fill(0).map(async () => {
        let newPage: Page;
        let popup: Page;
        try {
          newPage = await context.newPage();
          await newPage.goto(server.url('popup.html'));

          const popupNavigate = waitForPopup(newPage);

          await newPage.click('a');
          popup = await popupNavigate;

          await popup.mainFrame.waitForLoad({ loadStatus: 'AllContentLoaded' });
          expect(popup.mainFrame.url).toBe(server.emptyPage);
        } finally {
          await popup?.close();
          await newPage.close();
        }
      });
      await Promise.all(concurrent);
    });
  });
});

async function waitForPopup(page: Page): Promise<Page> {
  return new Promise<Page>(resolve => {
    page.popupInitializeFn = async popup => resolve(popup);
  });
}
