import BrowserEmulator from '../index';
import { Helpers, TestLogger } from '@unblocked-web/sa-testing/index';
import { ITestKoaServer } from '@unblocked-web/sa-testing/helpers';
import Pool from '@unblocked-web/secret-agent/lib/Pool';
import { IncomingHttpHeaders, IncomingMessage } from 'http';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import IUserAgentOption from '@unblocked-web/emulator-spec/emulator/IUserAgentOption';
import IBrowserEngine from '@unblocked-web/emulator-spec/browser/IBrowserEngine';

const logger = TestLogger.forTest(module);

let koaServer: ITestKoaServer;
let pool: Pool;
beforeEach(Helpers.beforeEach);
beforeAll(async () => {
  pool = new Pool({ emulatorPlugins: [BrowserEmulator] });
  await pool.start();
  Helpers.onClose(() => pool.close(), true);
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('emulator', () => {
  it('should set for all pages', async () => {
    let firstUserAgentOption: IUserAgentOption;
    let firstBrowserEngine: IBrowserEngine;
    {
      const agent = pool.createAgent({
        customEmulatorConfig: { userAgentSelector: '~ mac = 10.14' },
        logger,
      });
      Helpers.needsClosing.push(agent);
      const page = await agent.newPage();
      await page.goto(koaServer.baseUrl);
      Helpers.needsClosing.push(page);
      const userAgentOption = agent.emulatorProfile.userAgentOption;
      firstUserAgentOption = userAgentOption;
      firstBrowserEngine = agent.emulatorProfile.browserEngine;
      expect(await page.evaluate(`navigator.userAgent`)).toBe(userAgentOption.string);
      expect(await page.evaluate(`navigator.platform`)).toBe(
        userAgentOption.operatingSystemPlatform,
      );
      expect(await page.evaluate(`navigator.languages`)).toStrictEqual(['en-US', 'en']);
      expect(await page.evaluate('screen.height')).toBe(
        agent.emulatorProfile.viewport?.screenHeight,
      );
      await agent.close();
    }
    {
      const agent = pool.createAgent({
        userAgentOption: {
          ...firstUserAgentOption,
          operatingSystemPlatform: 'Windows',
          string: 'foobar',
        },
        browserEngine: firstBrowserEngine,
        logger,
        options: {
          locale: 'de',
          viewport: {
            screenHeight: 901,
            screenWidth: 1024,
            positionY: 1,
            positionX: 0,
            height: 900,
            width: 1024,
          },
        },
      });

      Helpers.needsClosing.push(agent);
      const page = await agent.newPage();
      Helpers.needsClosing.push(page);
      const headersPromise = new Resolvable<IncomingHttpHeaders>();

      koaServer.get('/emulator-test', (ctx) => {
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
    let firstUserAgentOption: IUserAgentOption;
    let firstBrowserEngine: IBrowserEngine;

    {
      const agent = pool.createAgent({
        logger,
      });
      Helpers.needsClosing.push(agent);
      const page = await agent.newPage();
      Helpers.needsClosing.push(page);
      firstUserAgentOption = agent.emulatorProfile.userAgentOption;
      firstBrowserEngine = agent.emulatorProfile.browserEngine;
      expect(await page.evaluate(`navigator.userAgent`)).toContain(
        agent.emulatorProfile.userAgentOption.string,
      );
      await agent.close();
    }
    {
      const agent = pool.createAgent({
        userAgentOption: {
          ...firstUserAgentOption,
          string: 'foobar',
        },
        browserEngine: firstBrowserEngine,
        logger,
      });
      Helpers.needsClosing.push(agent);
      const page = await agent.newPage();
      Helpers.needsClosing.push(page);
      const didRequest = new Resolvable<IncomingMessage>();
      koaServer.get('/iframe', (ctx) => {
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
