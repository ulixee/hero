import { Helpers } from '@ulixee/hero-testing';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import Core, { Tab } from '../index';
import ConnectionToClient from '../connections/ConnectionToClient';
import Session from '../lib/Session';

let koaServer: ITestKoaServer;
let connection: ConnectionToClient;
beforeAll(async () => {
  connection = Core.addConnection();
  await connection.connect();
  Helpers.onClose(() => connection.disconnect(), true);
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic waitForElement tests', () => {
  it('waits for an element', async () => {
    koaServer.get('/waitForElementTest1', ctx => {
      ctx.body = `<body>
<script>
    setTimeout(function() {
      const elem = document.createElement('A');
      elem.setAttribute('href', '/waitForElementTest2');
      document.body.append(elem)
    }, 500);
</script>
</body>`;
    });

    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/waitForElementTest1`);

    await expect(tab.waitForElement(['document', ['querySelector', 'a']])).resolves.toBe(true);
  });

  it('times out waiting for an element', async () => {
    koaServer.get('/waitForElementTest2', ctx => {
      ctx.body = `<body><a>Nothing really here</a></body>`;
    });
    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/waitForElementTest2`);
    await tab.waitForLoad('DomContentLoaded');

    await expect(
      tab.waitForElement(['document', ['querySelector', 'a#notthere']], { timeoutMs: 500 }),
    ).rejects.toThrowError(/Timeout waiting for element to be visible/);
  });

  it('will wait for an element to be visible', async () => {
    koaServer.get('/waitForElementTest3', ctx => {
      ctx.body = `<body>
    <a id="waitToShow" href="/anywhere" style="display: none">Link</a>
<script>
    setTimeout(function() {
      document.querySelector('a#waitToShow').style.display = 'block';
    }, 150);
</script>
</body>`;
    });
    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/waitForElementTest3`);

    await expect(
      tab.waitForElement(['document', ['querySelector', 'a#waitToShow']], {
        waitForVisible: true,
      }),
    ).resolves.toBe(true);
  });

  it('will yield an error for a bad querySelector', async () => {
    koaServer.get('/waitForElementBadQs', ctx => {
      ctx.body = `<body><div>Middle</div></body>`;
    });
    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/waitForElementBadQs`);

    await expect(
      tab.waitForElement(['document', ['querySelector', 'button-title="test"']], {
        waitForVisible: true,
      }),
    ).rejects.toThrowError('valid selector');
  });

  it('will wait for a valid path to exist', async () => {
    koaServer.get('/waitForElementValidPath', ctx => {
      ctx.body = `<body><ul>
<li>1</li>
<li>2</li>
</ul>
<script>
    setTimeout(function() {
      const child = document.createElement('li');
      child.innerText='3';
      document.querySelector('ul').append(child);
    }, 150);
</script>

</body>`;
    });
    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/waitForElementValidPath`);

    await expect(
      tab.waitForElement(['document', ['querySelector', 'ul'], 'children', ['item', 2]], {
        waitForVisible: true,
        timeoutMs: 5e3,
      }),
    ).resolves.toBe(true);
  });

  it('will find the correct center of an element', async () => {
    koaServer.get('/waitForElementCenter', ctx => {
      ctx.body = `<body>
<div id="wrapper" style="padding: 10px;">
<div id="elem1" style="width: 50px; height: 25px; margin: 15px">I am 1</div>
<div id="elem2" style="width: 50px; height: 25px; margin: 15px">I am 2</div>
</div>
</body>`;
    });
    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/waitForElementCenter`);

    await expect(
      tab.waitForElement(['document', ['querySelector', '#wrapper']], {
        waitForVisible: true,
      }),
    ).resolves.toBe(true);

    await expect(
      tab.waitForElement(['document', ['querySelector', '#elem1']], {
        waitForVisible: true,
      }),
    ).resolves.toBe(true);

    await expect(
      tab.waitForElement(['document', ['querySelector', '#elem2']], {
        waitForVisible: true,
      }),
    ).resolves.toBe(true);
  });

  it('will wait for an element above the fold to be on screen', async () => {
    koaServer.get('/waitForElementTestOnScreen', ctx => {
      ctx.body = `<body>
    <a id="waitToShow" href="/anywhere" style="display:block; position: absolute; top: -100px">Link</a>
<script>
    setTimeout(function() {
      document.querySelector('a#waitToShow').style.top = 0;
    }, 150);
</script>
</body>`;
    });
    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/waitForElementTestOnScreen`);

    await expect(
      tab.waitForElement(['document', ['querySelector', 'a#waitToShow']], {
        waitForVisible: true,
      }),
    ).resolves.toBe(true);
  });

  it('will wait until an element off the bottom of the page', async () => {
    koaServer.get('/waitForElementTestOffBottom', ctx => {
      ctx.body = `<body>
<div style="height: 2000px; position: relative">
    <a id="waitToShow" href="/anywhere" style="position: relative; top: 1990px">Link</a>
 </div>
<script>
    setTimeout(function() {
      document.querySelector('a#waitToShow').scrollIntoView({ behavior: 'smooth'})
    }, 150);
</script>
</body>`;
    });
    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/waitForElementTestOffBottom`);

    await expect(
      tab.waitForElement(['document', ['querySelector', 'a#waitToShow']], {
        waitForVisible: true,
      }),
    ).resolves.toBe(true);
  });
});

async function createSession(
  options?: ISessionCreateOptions,
): Promise<{ session: Session; tab: Tab }> {
  const meta = await connection.createSession(options);
  const tab = Session.getTab(meta);
  Helpers.needsClosing.push(tab.session);
  return { session: tab.session, tab };
}
