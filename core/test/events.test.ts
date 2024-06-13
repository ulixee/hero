import { Helpers } from '@ulixee/hero-testing';
import ICoreListenerPayload from '@ulixee/hero-interfaces/ICoreListenerPayload';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import { LocationStatus } from '@ulixee/unblocked-specification/agent/browser/Location';
import EmittingTransportToClient from '@ulixee/net/lib/EmittingTransportToClient';
import Core, { Session } from '../index';
import ConnectionToHeroClient from '../connections/ConnectionToHeroClient';

let koaServer: ITestKoaServer;
let connection: ConnectionToHeroClient;
let core: Core;
const onEventFn = jest.fn();

beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
  const transport = new EmittingTransportToClient();
  core = await Core.start();
  connection = core.addConnection(transport);
  Helpers.onClose(() => connection.disconnect(), true);
  transport.on('outbound', payload => {
    if ((payload as ICoreListenerPayload).listenerId) {
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
    // @ts-ignore
    const events = connection.sessionIdToRemoteEvents
      .get(meta.sessionId)
      .getEventTarget({ sessionId: meta.sessionId });
    await events.addEventListener(null, 'close');
    await Session.get(meta.sessionId).close();

    expect(onEventFn.mock.calls).toHaveLength(1);
  });

  it('receives resource events', async () => {
    onEventFn.mockClear();

    const meta = await connection.createSession();
    // @ts-ignore
    const events = connection.sessionIdToRemoteEvents.get(meta.sessionId).getEventTarget({
      tabId: meta.tabId,
      sessionId: meta.sessionId,
    });
    await events.addEventListener(null, 'resource');

    koaServer.get('/page1', ctx => (ctx.body = '<body><img src="/resource.png"></body>'));
    koaServer.get('/page2', ctx => (ctx.body = '<body><img src="/resource.png"></body>'));

    const tab = Session.getTab(meta);
    Helpers.needsClosing.push(tab.session);
    await tab.goto(`${koaServer.baseUrl}/page1`);
    await tab.waitForLoad(LocationStatus.PaintingStable);

    await tab.goto(`${koaServer.baseUrl}/page2`);
    await tab.waitForLoad(LocationStatus.PaintingStable);

    // TODO: this should really be 2; it's emitting base document as an resource
    expect(
      onEventFn.mock.calls.map(x => x[0].data[0].url).filter(x => !x.includes('favicon.ico')),
    ).toHaveLength(4);
  }, 10e3);

  it('removes event listeners', async () => {
    onEventFn.mockClear();

    const meta = await connection.createSession();
    // @ts-ignore
    const events = connection.sessionIdToRemoteEvents.get(meta.sessionId).getEventTarget({
      tabId: meta.tabId,
      sessionId: meta.sessionId,
    });

    const { listenerId } = await events.addEventListener(null, 'resource');

    koaServer.get('/page1', ctx => (ctx.body = '<body><img src="/resource.png"></body>'));
    koaServer.get('/page2', ctx => (ctx.body = '<body><img src="/resource.png"></body>'));

    const tab = Session.getTab(meta);
    Helpers.needsClosing.push(tab.session);
    await tab.goto(`${koaServer.baseUrl}/page1`);
    await tab.waitForLoad(LocationStatus.AllContentLoaded);

    await events.removeEventListener(listenerId);

    await tab.goto(`${koaServer.baseUrl}/page2`);
    await tab.waitForLoad(LocationStatus.PaintingStable);

    // TODO: this should really be 1; it's emitting base document as an resource
    expect(onEventFn.mock.calls).toHaveLength(2);
  }, 10e3);
});
