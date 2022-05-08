import BrowserEmulator from '../index';
import { Helpers, TestLogger } from '@unblocked/sa-testing/index';
import { ITestKoaServer } from '@unblocked/sa-testing/helpers';
import Pool from '@unblocked/secret-agent/lib/Pool';
import { IncomingHttpHeaders, IncomingMessage } from 'http';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { IBrowserEmulatorConfig } from '@unblocked/emulator-spec/IBrowserEmulator';

const logger = TestLogger.forTest(module);
const selectBrowserMeta = BrowserEmulator.selectBrowserMeta('~ mac = 10.14');

let koaServer: ITestKoaServer;
let pool: Pool;
beforeAll(async () => {
  pool = new Pool();
  await pool.start();
  Helpers.onClose(() => pool.close(), true);
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);
beforeEach(() => {
  TestLogger.testNumber += 1;
});

describe('emulator', () => {
  it('should set for all pages', async () => {
    {
      const browserEmulator = new BrowserEmulator({
        logger,
        ...selectBrowserMeta,
      });
      const config:IBrowserEmulatorConfig = {}
      browserEmulator.configure(config);
      const agent = await pool.createAgent({
        browserEngine: browserEmulator.browserEngine,
        hooks: browserEmulator,
        logger,
      });
      Helpers.needsClosing.push(agent);
      const page = await agent.browserContext.newPage();
      Helpers.needsClosing.push(page);
      expect(await page.evaluate(`navigator.userAgent`)).toBe(browserEmulator.userAgentString);
      expect(await page.evaluate(`navigator.platform`)).toBe(
        browserEmulator.operatingSystemPlatform,
      );
      expect(await page.evaluate(`navigator.languages`)).toStrictEqual(['en-US','en']);
      expect(await page.evaluate('screen.height')).toBe(config.viewport?.screenHeight);
      await agent.close();
    }
    {
      const { userAgentOption, browserEngine } = selectBrowserMeta;

      userAgentOption.operatingSystemPlatform = 'Windows';
      userAgentOption.string = 'foobar';

      const browserEmulator = new BrowserEmulator({
        logger,
        browserEngine,
        userAgentOption,
      });
      browserEmulator.configure({
        locale: 'de',
        viewport: {
          screenHeight: 901,
          screenWidth: 1024,
          positionY: 1,
          positionX: 0,
          height: 900,
          width: 1024,
        },
      });

      const agent = await pool.createAgent({
        browserEngine: browserEmulator.browserEngine,
        hooks: browserEmulator,
      });
      Helpers.needsClosing.push(agent);
      const page = await agent.browserContext.newPage();
      Helpers.needsClosing.push(page);
      const headersPromise = new Resolvable<IncomingHttpHeaders>();

      koaServer.get('/emulator-test', ctx => {
        headersPromise.resolve(ctx.req.headers);
        ctx.body = '<html><h1>test</h1></html>';
      });
      await page.goto(`${koaServer.baseUrl}/emulator-test`);
      const headers = await headersPromise;
      expect(headers['user-agent']).toBe('foobar');
      expect(await page.evaluate(`navigator.userAgent`)).toBe('foobar');
      expect(await page.evaluate(`navigator.platform`)).toBe('Windows');
      expect(await page.evaluate(`navigator.languages`)).toStrictEqual(['de']);
      expect(await page.evaluate('screen.height')).toBe(901);
      await agent.close();
    }
  }, 20e3);

  it('should work for subframes', async () => {
    {
      const browserEmulator = new BrowserEmulator({
        logger,
        ...selectBrowserMeta,
      });
      const agent = await pool.createAgent({
        browserEngine: browserEmulator.browserEngine,
        hooks: browserEmulator,
        logger,
      });
      Helpers.needsClosing.push(agent);
      const page = await agent.browserContext.newPage();
      Helpers.needsClosing.push(page);
      expect(await page.evaluate(`navigator.userAgent`)).toContain(browserEmulator.userAgentString);
      await agent.close();
    }
    {
      const browserEmulator = new BrowserEmulator({
        logger,
        ...selectBrowserMeta,
        userAgentOption: {
          ...selectBrowserMeta.userAgentOption,
          string: 'foobar',
        },
      });
      const agent = await pool.createAgent({
        browserEngine: browserEmulator.browserEngine,
        hooks: browserEmulator,
        logger,
      });
      Helpers.needsClosing.push(agent);
      const page = await agent.browserContext.newPage();
      Helpers.needsClosing.push(page);
      const didRequest = new Resolvable<IncomingMessage>();
      koaServer.get('/iframe', ctx => {
        didRequest.resolve(ctx.req);
        ctx.body = '';
      });
      const [request] = await Promise.all([
        didRequest.promise,
        page.evaluate(`(async () => {
        const frame = document.createElement('iframe');
        frame.src = '${koaServer.baseUrl}/iframe';
        frame.id = 'frame1';
        document.body.appendChild(frame);
        await new Promise(x => frame.onload = x);
      })()`),
      ]);
      expect(request.headers['user-agent']).toBe('foobar');
      await agent.close();
    }
  });
});
