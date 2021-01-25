import { Helpers } from '@secret-agent/testing';
import ICoreEventPayload from '@secret-agent/core-interfaces/ICoreEventPayload';
import { ITestKoaServer } from '@secret-agent/testing/helpers';
import { LocationStatus } from '@secret-agent/core-interfaces/Location';
import Core, { Session } from '../index';
import ConnectionToClient from '../server/ConnectionToClient';

let koaServer: ITestKoaServer;
let connection: ConnectionToClient;
const onEventFn = jest.fn();

beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
  connection = Core.addConnection();
  Helpers.onClose(() => connection.disconnect(), true);
  connection.on('message', payload => {
    if ((payload as ICoreEventPayload).listenerId) {
      onEventFn(payload);
    }
  });
});
afterAll(async () => {
  await Helpers.afterAll();
});
afterEach(Helpers.afterEach);

describe('Core events tests', () => {
  it('receives close event when closed', async () => {
    const meta = await connection.createSession();
    await connection.addEventListener(meta, null, 'close');
    await Session.get(meta.sessionId).close();

    expect(onEventFn.mock.calls.length).toBe(1);
  });

  it('receives resource events', async () => {
    onEventFn.mockClear();

    const meta = await connection.createSession();
    await connection.addEventListener(meta, null, 'resource');

    koaServer.get('/page1', ctx => (ctx.body = '<body><img src="/resource.png"></body>'));
    koaServer.get('/page2', ctx => (ctx.body = '<body><img src="/resource.png"></body>'));

    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/page1`);
    await tab.waitForLoad(LocationStatus.PaintingStable);

    await tab.goto(`${koaServer.baseUrl}/page2`);
    await tab.waitForLoad(LocationStatus.PaintingStable);

    // ToDo: this should really be 2; it's emitting base document as an resource
    expect(onEventFn.mock.calls.length).toBe(4);
  }, 10e3);

  it('removes event listeners', async () => {
    onEventFn.mockClear();

    const meta = await connection.createSession();
    const { listenerId } = await connection.addEventListener(meta, null, 'resource');

    koaServer.get('/page1', ctx => (ctx.body = '<body><img src="/resource.png"></body>'));
    koaServer.get('/page2', ctx => (ctx.body = '<body><img src="/resource.png"></body>'));

    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/page1`);
    await tab.waitForLoad(LocationStatus.PaintingStable);

    await connection.removeEventListener(meta, listenerId);

    await tab.goto(`${koaServer.baseUrl}/page2`);
    await tab.waitForLoad(LocationStatus.PaintingStable);

    // ToDo: this should really be 1; it's emitting base document as an resource
    expect(onEventFn.mock.calls.length).toBe(2);
  }, 10e3);
});
