import Core from '../index';
import { Helpers } from '@secret-agent/testing';

let koaServer;
beforeAll(async () => {
  await Core.start();
  koaServer = await Helpers.runKoaServer();
});

describe('basic Window tests', () => {
  it('waits for an element', async () => {
    koaServer.get('/test1', ctx => {
      ctx.body = `<body>
<script>
    setTimeout(function() {
      const elem = document.createElement('A');
      elem.setAttribute('href', '/test2');
      document.body.append(elem)
    }, 500);
</script>
</body>`;
    });
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
    await core.goto(`${koaServer.baseUrl}/test1`);

    await core.waitForElement(['document', ['querySelector', 'a']]);
  });

  it('times out waiting for an element', async () => {
    koaServer.get('/test2', ctx => {
      ctx.body = `<body><a>Nothing really here</a></body>`;
    });
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
    await core.goto(`${koaServer.baseUrl}/test2`);

    try {
      await core.waitForElement(['document', ['querySelector', 'a#notthere']], { timeoutMs: 500 });
    } catch (err) {
      expect(err.message).toBe('Timeout waiting for element to be visible');
    }
  });

  it('will wait for an element to be visible', async () => {
    koaServer.get('/test3', ctx => {
      ctx.body = `<body>
    <a id="waitToShow" href="/anywhere" style="display: none">Link</a>
<script>
    setTimeout(function() {
      document.querySelector('a#waitToShow').style.display = 'block';
    }, 150);
</script>
</body>`;
    });
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
    await core.goto(`${koaServer.baseUrl}/test3`);

    await core.waitForElement(['document', ['querySelector', 'a#waitToShow']], {
      waitForVisible: true,
    });
  });
});

afterAll(async () => {
  await Core.shutdown();
  await Helpers.closeAll();
});
