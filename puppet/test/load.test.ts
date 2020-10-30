import Chrome80 from '@secret-agent/emulate-chrome-80';
import Log from '@secret-agent/commons/Logger';
import { TestServer } from './server';
import Puppet from '../index';
import IPuppetContext from '../interfaces/IPuppetContext';
import { getExecutablePath } from '../lib/browserPaths';
import { createTestPage, ITestPage } from './TestPage';
import defaultEmulation from './_defaultEmulation';

const { log } = Log(module);

describe.each([
  [Chrome80.engine.browser, Chrome80.engine.revision],
  // [Chrome83.engine.browser, Chrome83.engine.revision],
])('Load test for %s@%s', (browserEngine: string, revision: string) => {
  let server: TestServer;
  let puppet: Puppet;
  let context: IPuppetContext;

  beforeAll(async () => {
    server = await TestServer.create(0);
    const engineExecutablePath = getExecutablePath(browserEngine, revision);
    puppet = new Puppet({ engine: { browser: browserEngine, revision }, engineExecutablePath });
    await puppet.start();
    context = await puppet.newContext(defaultEmulation, log);
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
    await server.stop();
    await context.close();
    await puppet.close();
  });

  it('should be able to capture navigation events under load', async () => {
    const concurrent = new Array(50).fill(0).map(async () => {
      let page: ITestPage;
      try {
        page = createTestPage(await context.newPage());
        await page.goto(server.url('link.html'));

        const navigate = page.waitOn('frame-navigated');
        await page.click('a');
        await navigate;
        expect(page.mainFrame.url).toBe(`${server.crossProcessBaseUrl}/empty.html`);
      } finally {
        await page.close();
      }
    });
    await Promise.all(concurrent);
  });
});
