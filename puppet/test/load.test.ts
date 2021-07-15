import Log from '@ulixee/commons/Logger';
import IPuppetContext from '@ulixee/hero-interfaces/IPuppetContext';
import CorePlugins from '@ulixee/hero-core/lib/CorePlugins';
import { IBoundLog } from '@ulixee/hero-interfaces/ILog';
import Core from '@ulixee/hero-core';
import { TestServer } from './server';
import Puppet from '../index';
import { capturePuppetContextLogs, createTestPage, ITestPage } from './TestPage';
import CustomBrowserEmulator from './_CustomBrowserEmulator';

const { log } = Log(module);
const browserEmulatorId = CustomBrowserEmulator.id;

describe('Load test', () => {
  let server: TestServer;
  let puppet: Puppet;
  let context: IPuppetContext;

  beforeAll(async () => {
    Core.use(CustomBrowserEmulator);
    const browserEngine = CustomBrowserEmulator.selectBrowserMeta().browserEngine;
    const plugins = new CorePlugins({ browserEmulatorId }, log as IBoundLog);
    server = await TestServer.create(0);
    puppet = new Puppet(browserEngine);
    await puppet.start();
    context = await puppet.newContext(plugins, log);
    capturePuppetContextLogs(context, `${browserEngine.fullVersion}-load-test`);
    server.setRoute('/link.html', async (req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.end(`
<body>
<a href="${server.crossProcessBaseUrl}/empty.html">This is a link</a>
</body>
`);
    });
  });

  afterAll(async () => {
    try {
      await server.stop();
    } catch (err) {
      // no action
    }

    try {
      await context.close();
    } catch (err) {
      // no action
    }

    try {
      await puppet.close();
    } catch (err) {
      // no action
    }
  }, 30e3);

  it('should be able to capture navigation events under load', async () => {
    const concurrent = new Array(50).fill(0).map(async () => {
      let page: ITestPage;
      try {
        page = createTestPage(await context.newPage());
        await page.goto(server.url('link.html'));

        const navigate = page.mainFrame.waitOn('frame-navigated');
        await page.click('a');
        await navigate;
        expect(page.mainFrame.url).toBe(`${server.crossProcessBaseUrl}/empty.html`);
      } finally {
        await page.close();
      }
    });
    await Promise.all(concurrent);
  }, 60e3);
});
