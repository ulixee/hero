import Log from '@ulixee/commons/lib/Logger';
import { IPuppetPage } from '@ulixee/hero-interfaces/IPuppetPage';
import IPuppetContext from '@ulixee/hero-interfaces/IPuppetContext';
import CorePlugins from '@ulixee/hero-core/lib/CorePlugins';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import Core from '@ulixee/hero-core';
import { IBrowserEmulatorConfig } from '@ulixee/hero-interfaces/ICorePlugin';
import { TestServer } from './server';
import Puppet from '../index';
import { capturePuppetContextLogs, createTestPage, ITestPage } from './TestPage';
import CustomBrowserEmulator from './_CustomBrowserEmulator';

const { log } = Log(module);
const browserEmulatorId = CustomBrowserEmulator.id;

describe('Page.popups', () => {
  let server: TestServer;
  let page: ITestPage;
  let puppet: Puppet;
  let context: IPuppetContext;
  const needsClosing = [];

  beforeAll(async () => {
    Core.use(CustomBrowserEmulator);
    const { browserEngine } = CustomBrowserEmulator.selectBrowserMeta();
    server = await TestServer.create(0);
    puppet = new Puppet(browserEngine);
    await puppet.start();
    const plugins = new CorePlugins({ browserEmulatorId }, log as IBoundLog);
    const config: IBrowserEmulatorConfig = { locale: 'en-GB' };
    plugins.browserEmulator.configure(config);
    plugins.browserEmulator.userAgentString = 'popupcity';
    plugins.browserEmulator.operatingSystemPlatform = 'Windows95';

    context = await puppet.newContext(plugins, log);
    capturePuppetContextLogs(context, `${browserEngine.fullVersion}-Page.popups-test`);
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
      const [popup] = await Promise.all([
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

      const popupPromise = page.waitForPopup();
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
        let newPage: ITestPage;
        let popup: IPuppetPage;
        try {
          newPage = createTestPage(await context.newPage());
          await newPage.goto(server.url('popup.html'));

          const popupNavigate = newPage.waitForPopup();

          await newPage.click('a');
          popup = await popupNavigate;

          await popup.mainFrame.waitForLifecycleEvent('load');
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
