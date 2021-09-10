import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import { Helpers } from '@ulixee/hero-testing';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import Core, { Session } from '../index';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  await Core.start();
  koaServer = await Helpers.runKoaServer(true);
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('can wait for page state events', async () => {
  const connection = Core.addConnection();
  Helpers.onClose(() => connection.disconnect());
  const meta = await connection.createSession();
  const tab = Session.getTab(meta);
  Helpers.needsClosing.push(tab.session);
  koaServer.get('/pageState1', ctx => {
    ctx.body = `
  <body>
    <h1>Title 1</h1>
    <script>
      setTimeout(() => {
        const div = document.createElement('div');
        div.id = 'test';
        div.textContent = 'hi'
        document.body.append(div)
      }, 100)
    </script>
  </body>
      `;
  });

  await tab.goto(`${koaServer.baseUrl}/pageState1`);
  const mainFrame = tab.mainFrameEnvironment;
  const callbackFn = jest.fn();
  const hasDiv = new Resolvable<void>();
  const { stop } = tab.addPageStateListener(
    '1',
    {
      url: () => Promise.resolve(mainFrame.url),
      paintStable: () => Promise.resolve(mainFrame.isPaintingStable()),
      h1Text: () => mainFrame.execJsPath(['document', ['querySelector', 'h1'], 'textContent']),
      divText: () => mainFrame.execJsPath(['document', ['querySelector', '#test'], 'textContent']),
      div2Text: () =>
        mainFrame.execJsPath(['document', ['querySelector', '#notthere'], 'textContent']),
    },
    [mainFrame],
    status => {
      callbackFn(status);
      if (status.divText?.value === 'hi' && status.paintStable === true) hasDiv.resolve();
    },
  );
  await hasDiv.promise;
  stop();
  expect(callbackFn.mock.calls.length).toBeGreaterThanOrEqual(1);
  expect(callbackFn.mock.calls[callbackFn.mock.calls.length - 1][0]).toEqual({
    url: `${koaServer.baseUrl}/pageState1`,
    paintStable: true,
    h1Text: { value: 'Title 1' },
    divText: { value: 'hi' },
    div2Text: expect.any(Error),
  });
});

test('can continue to get events as dom changes', async () => {
  const connection = Core.addConnection();
  Helpers.onClose(() => connection.disconnect());
  const meta = await connection.createSession();
  const tab = Session.getTab(meta);
  Helpers.needsClosing.push(tab.session);
  koaServer.get('/pageState2', ctx => {
    ctx.body = `
  <body>
    <h1>Title 1</h1>
    <script>
      setInterval(() => {
        const div = document.createElement('div');
        div.className = 'test';
        div.textContent = 'hi'
        document.body.append(div)
      }, 100)
    </script>
  </body>
      `;
  });

  await tab.goto(`${koaServer.baseUrl}/pageState2`);
  const mainFrame = tab.mainFrameEnvironment;
  const callbackFn = jest.fn();
  const hasDiv = new Resolvable<void>();
  const { stop } = tab.addPageStateListener(
    '2',
    {
      url: () => Promise.resolve(mainFrame.url),
      paintStable: () => Promise.resolve(mainFrame.isPaintingStable()),
      divs: () => mainFrame.execJsPath(['document', ['querySelectorAll', '.test'], 'length']),
    },
    [mainFrame],
    status => {
      callbackFn(status);
      if (status.divs?.value >= 5) {
        stop();
        hasDiv.resolve();
      }
    },
  );
  await hasDiv.promise;
  stop();
  expect(callbackFn.mock.calls.length).toBeGreaterThanOrEqual(4);
  const lastCall = callbackFn.mock.calls.slice(-1).shift()[0];
  expect(lastCall.url).toBe(`${koaServer.baseUrl}/pageState2`);
  expect(lastCall.paintStable).toBe(true);
  expect(lastCall.divs.value).toBeGreaterThanOrEqual(5);
});
