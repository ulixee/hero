"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("@ulixee/hero-testing/helpers");
const hero_testing_1 = require("@ulixee/hero-testing");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const index_1 = require("../index");
let koaServer;
beforeAll(async () => {
    await index_1.default.start();
    koaServer = await hero_testing_1.Helpers.runKoaServer(true);
});
afterAll(hero_testing_1.Helpers.afterAll);
afterEach(hero_testing_1.Helpers.afterEach);
test('can wait for page state events', async () => {
    const { tab } = await (0, helpers_1.createSession)();
    koaServer.get('/domState1', ctx => {
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
    await tab.goto(`${koaServer.baseUrl}/domState1`);
    const callbackFn = jest.fn();
    const hasDiv = new Resolvable_1.default();
    // @ts-ignore
    const listener = await tab.addDomStateListener('1', {
        callsite: 'callsite',
        name: 'state',
        commands: {
            url: [1, 'FrameEnvironment.getUrl', []],
            paintStable: [1, 'FrameEnvironment.isPaintingStable', []],
            h1Text: [
                1,
                'FrameEnvironment.execJsPath',
                [['document', ['querySelector', 'h1'], 'textContent']],
            ],
            divText: [
                1,
                'FrameEnvironment.execJsPath',
                [['document', ['querySelector', '#test'], 'textContent']],
            ],
            div2Text: [
                1,
                'FrameEnvironment.execJsPath',
                [['document', ['querySelector', '#notthere'], 'textContent']],
            ],
        },
    });
    listener.on('updated', status => {
        callbackFn(status);
        if (status.divText?.value === 'hi' && status.paintStable === true)
            hasDiv.resolve();
    });
    await hasDiv.promise;
    listener.stop();
    expect(callbackFn.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(callbackFn.mock.calls[callbackFn.mock.calls.length - 1][0]).toEqual({
        url: `${koaServer.baseUrl}/domState1`,
        paintStable: true,
        h1Text: { value: 'Title 1' },
        divText: { value: 'hi' },
        div2Text: expect.any(Error),
    });
});
test('can continue to get events as dom changes', async () => {
    const { tab } = await (0, helpers_1.createSession)();
    koaServer.get('/domState2', ctx => {
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
    await tab.goto(`${koaServer.baseUrl}/domState2`);
    const callbackFn = jest.fn();
    const hasDiv = new Resolvable_1.default();
    // @ts-ignore
    const listener = await tab.addDomStateListener('2', {
        callsite: 'callsite',
        name: 'state',
        commands: {
            url: [1, 'FrameEnvironment.getUrl', []],
            paintStable: [1, 'FrameEnvironment.isPaintingStable', []],
            divs: [
                1,
                'FrameEnvironment.execJsPath',
                [['document', ['querySelectorAll', '.test'], 'length']],
            ],
        },
    });
    listener.on('updated', status => {
        callbackFn(status);
        if (status.divs?.value >= 5) {
            listener.stop();
            hasDiv.resolve();
        }
    });
    await hasDiv.promise;
    listener.stop();
    expect(callbackFn.mock.calls.length).toBeGreaterThanOrEqual(2);
    const lastCall = callbackFn.mock.calls.slice(-1).shift()[0];
    expect(lastCall.url).toBe(`${koaServer.baseUrl}/domState2`);
    expect(lastCall.paintStable).toBe(true);
    expect(lastCall.divs.value).toBeGreaterThanOrEqual(5);
});
//# sourceMappingURL=domState.test.js.map