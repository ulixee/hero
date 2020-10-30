import Chrome80 from '@secret-agent/emulate-chrome-80';
import Chrome83 from '@secret-agent/emulate-chrome-83';
import Log from '@secret-agent/commons/Logger';
import { TestServer } from './server';
import { IPuppetPage } from '../interfaces/IPuppetPage';
import { getExecutablePath } from '../lib/browserPaths';
import Puppet from '../index';
import IPuppetContext from '../interfaces/IPuppetContext';
import { createTestPage, ITestPage } from './TestPage';
import defaultEmulation from './_defaultEmulation';

const { log } = Log(module);

describe.each([
  [Chrome80.engine.browser, Chrome80.engine.revision],
  [Chrome83.engine.browser, Chrome83.engine.revision],
])('Page.popups for %s@%s', (browserEngine: string, revision: string) => {
  let server: TestServer;
  let page: ITestPage;
  let puppet: Puppet;
  let context: IPuppetContext;
  const needsClosing = [];

  beforeAll(async () => {
    server = await TestServer.create(0);
    const engineExecutablePath = getExecutablePath(browserEngine, revision);
    puppet = new Puppet({ engine: { browser: browserEngine, revision }, engineExecutablePath });
    await puppet.start();
    context = await puppet.newContext(
      {
        ...defaultEmulation,
        userAgent: 'popupcity',
        acceptLanguage: 'en-GB',
        platform: 'Windows95',
      },
      log,
    );
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
    page = createTestPage(await context.newPage());
    server.reset();
  });

  afterAll(async () => {
    await server.stop();
    await context.close();
    await puppet.close();
  });

  describe('Popup tests', () => {
    it('should focus popups by default', async () => {
      await page.goto(server.emptyPage);
      const [popup] = await Promise.all<IPuppetPage, any>([
        page.waitForPopup(),
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
      const coordinates: any = await page.evaluate(`(()=>{ 
    const rect = document.querySelector('a').getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y
    };
})();`);
      const popupPromise = page.waitForPopup();
      await page.mouse.click(coordinates.x, coordinates.y);
      const popup = await popupPromise;
      needsClosing.push(popup);
      expect(await popup.evaluate(`navigator.userAgent`)).toBe('popupcity');
      expect(await popup.evaluate(`navigator.platform`)).toBe('Windows95');

      // broken on windows for Chrome 80 (we have to polyfill)
      const isLanguagesBroken = revision === Chrome80.engine.revision;
      if (!isLanguagesBroken) {
        expect(await popup.evaluate(`navigator.languages`)).toStrictEqual(['en-GB']);
      }
    });

    it('calling window.open and window.close', async () => {
      // chrome 80 bombs on disconnect
      if (revision === Chrome80.engine.revision) {
        return;
      }
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
        let newPage: ITestPage;
        let popup: IPuppetPage;
        try {
          newPage = createTestPage(await context.newPage());
          await newPage.goto(server.url('popup.html'));

          const popupNavigate = newPage.waitForPopup();

          await newPage.click('a');
          popup = await popupNavigate;

          await popup.waitOn('load', null, 5e3, true);
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
