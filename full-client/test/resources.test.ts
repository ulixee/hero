import { Helpers } from '@secret-agent/testing';
import SecretAgent from '../index';

let koaServer;
beforeAll(async () => {
  await SecretAgent.prewarm();
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
    const agent = await new SecretAgent();

    await agent.goto(exampleUrl);
    const elem = agent.document.querySelector('a');
    await agent.click(elem);

    const resources = await agent.waitForResource({ type: 'Fetch' });
    expect(resources).toHaveLength(1);
  });

  it('waits for a resource loaded since a previous command id', async () => {
    const exampleUrl = `${koaServer.baseUrl}/test`;
    const agent = new SecretAgent();

    await agent.goto(exampleUrl);
    let lastCommandId: number;
    for (let i = 0; i <= 4; i += 1) {
      const elem = agent.document.querySelector('a');
      await agent.click(elem);
      const resources = await agent.waitForResource(
        { type: 'Fetch' },
        { sinceCommandId: lastCommandId },
      );
      lastCommandId = await agent.lastCommandId;
      expect(resources).toHaveLength(1);
      expect(resources[0].url).toContain(`counter=${i}`);
    }
  });
});
