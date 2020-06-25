import Core from '../index';
import { Helpers } from '@secret-agent/shared-testing';
import { LocationStatus } from '@secret-agent/client';

let koaServer;
beforeAll(async () => {
  await Core.start();
  koaServer = await Helpers.runKoaServer();
});

describe('Core events tests', () => {
  it('receives close event when closed', async () => {
    await Core.start();
    const onEventFn = jest.fn();
    Core.onEventFn = onEventFn;
    const { windowId } = await Core.createSession();
    const core = Core.byWindowId[windowId];
    await core.addEventListener(null, 'close');

    await Core.shutdown();
    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(onEventFn.mock.calls.length).toBe(1);

    delete Core.onEventFn;
  });

  it('receives resource events', async () => {
    await Core.start();
    const onEventFn = jest.fn();
    Core.onEventFn = onEventFn;
    const { windowId } = await Core.createSession();
    const core = Core.byWindowId[windowId];
    await core.addEventListener(null, 'resource');

    koaServer.get('/page1', ctx => (ctx.body = '<body><img src="/resource.png"></body>'));
    koaServer.get('/page2', ctx => (ctx.body = '<body><img src="/resource.png"></body>'));

    await core.goto(`${koaServer.baseUrl}/page1`);
    await core.waitForLoad(LocationStatus.AllContentLoaded);

    await core.goto(`${koaServer.baseUrl}/page2`);
    await core.waitForLoad(LocationStatus.AllContentLoaded);

    // ToDo: this should really be 2; it's emitting base document as an resource
    expect(onEventFn.mock.calls.length).toBe(4);

    await Core.shutdown();
    delete Core.onEventFn;
  }, 10e3);

  it('removes event listeners', async () => {
    await Core.start();
    const onEventFn = jest.fn();
    Core.onEventFn = onEventFn;
    const { windowId } = await Core.createSession();
    const core = Core.byWindowId[windowId];
    const { listenerId } = await core.addEventListener(null, 'resource');

    koaServer.get('/page1', ctx => (ctx.body = '<body><img src="/resource.png"></body>'));
    koaServer.get('/page2', ctx => (ctx.body = '<body><img src="/resource.png"></body>'));

    await core.goto(`${koaServer.baseUrl}/page1`);
    await core.waitForLoad(LocationStatus.AllContentLoaded);

    await core.removeEventListener(listenerId);

    await core.goto(`${koaServer.baseUrl}/page2`);
    await core.waitForLoad(LocationStatus.AllContentLoaded);

    // ToDo: this should really be 1; it's emitting base document as an resource
    expect(onEventFn.mock.calls.length).toBe(2);

    await Core.shutdown();
    delete Core.onEventFn;
  }, 10e3);
});

afterAll(async () => {
  await Core.shutdown();
  await Helpers.closeAll();
});
