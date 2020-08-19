import SecretAgent from '../index';
import { Helpers } from '@secret-agent/testing';

let koaServer;
beforeAll(async () => {
  await SecretAgent.start();
  koaServer = await Helpers.runKoaServer();
  koaServer.get('/test', ctx => {
    ctx.body = `<html>
<body>
<a onclick="clicker()" href="#nothing">Click me</a>
</body>
<script>
  let counter = 0;
  function clicker() {
    fetch('/ajax?counter=' + (counter++) )
  }
</script>
</html>`;
  });
  koaServer.get('/ajax', ctx => {
    ctx.body = {
      hi: 'there',
    };
  });
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic resource tests', () => {
  it('waits for a resource', async () => {
    const exampleUrl = `${koaServer.baseUrl}/test`;
    const browser = await SecretAgent.createBrowser();

    await browser.goto(exampleUrl);
    const elem = browser.document.querySelector('a');
    await browser.click(elem);

    const resources = await browser.waitForResource({ type: 'Fetch' });
    expect(resources).toHaveLength(1);
  });

  it('waits for a resource loaded since a previous command id', async () => {
    const exampleUrl = `${koaServer.baseUrl}/test`;
    const browser = await SecretAgent.createBrowser();

    await browser.goto(exampleUrl);
    let lastCommandId;
    for (let i = 0; i <= 4; i += 1) {
      const elem = browser.document.querySelector('a');
      await browser.click(elem);
      const resources = await browser.waitForResource(
        { type: 'Fetch' },
        { sinceCommandId: lastCommandId },
      );
      lastCommandId = browser.lastCommandId;
      expect(resources).toHaveLength(1);
      expect(resources[0].url).toContain(`counter=${i}`);
    }
  });
});
