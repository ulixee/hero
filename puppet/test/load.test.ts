import Log from '@secret-agent/commons/Logger';
import ChromeLatest from '@secret-agent/emulate-chrome-latest';
import IPuppetContext from '@secret-agent/interfaces/IPuppetContext';
import { TestServer } from './server';
import Puppet from '../index';
import { capturePuppetContextLogs, createTestPage, ITestPage } from './TestPage';
import defaultEmulation from './_defaultEmulation';

const { log } = Log(module);

describe('Load test', () => {
  let server: TestServer;
  let puppet: Puppet;
  let context: IPuppetContext;

  beforeAll(async () => {
    server = await TestServer.create(0);
    puppet = new Puppet(ChromeLatest.engine);
    await puppet.start();
    context = await puppet.newContext(defaultEmulation, log);
    capturePuppetContextLogs(context, `${ChromeLatest.engine.fullVersion}-load-test`);
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
