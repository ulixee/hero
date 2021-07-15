import { Helpers } from '@ulixee/testing';
import { ITestKoaServer } from '@ulixee/testing/helpers';
import { Handler } from '../index';

let koaServer: ITestKoaServer;
let handler: Handler;
beforeAll(async () => {
  handler = new Handler({ maxConcurrency: 2 });
  Helpers.onClose(() => handler.close(), true);
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
    const hero = await handler.createHero();

    await hero.goto(exampleUrl);
    const elem = hero.document.querySelector('a');
    await hero.click(elem);

    const resources = await hero.waitForResource({ type: 'Fetch' });
    expect(resources).toHaveLength(1);
    await hero.close();
  });

  it('waits for a resource loaded since a previous command id', async () => {
    const exampleUrl = `${koaServer.baseUrl}/test`;
    const hero = await handler.createHero();

    await hero.goto(exampleUrl);
    let lastCommandId: number;
    for (let i = 0; i <= 4; i += 1) {
      const elem = hero.document.querySelector('a');
      await hero.click(elem);
      const resources = await hero.waitForResource(
        { type: 'Fetch' },
        { sinceCommandId: lastCommandId },
      );
      lastCommandId = await hero.lastCommandId;
      expect(resources).toHaveLength(1);
      expect(resources[0].url).toContain(`counter=${i}`);
    }
    await hero.close();
  });

  it('cancels a pending resource on hero close', async () => {
    const exampleUrl = `${koaServer.baseUrl}/test`;
    const hero = await handler.createHero();

    await hero.goto(exampleUrl);

    const waitForResource = hero.waitForResource({ type: 'Fetch' });
    // eslint-disable-next-line jest/valid-expect
    const waitError = expect(waitForResource).rejects.toThrowError('disconnected');
    await hero.close();
    await waitError;
  });
});
