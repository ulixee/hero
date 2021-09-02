import { Helpers } from '@ulixee/hero-testing';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import ConnectionToClient from '../connections/ConnectionToClient';
import Core, { Session } from '../index';

let connection: ConnectionToClient;
beforeAll(() => {
  connection = Core.addConnection();
  Helpers.onClose(() => connection.disconnect(), true);
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('loads http2 resources', async () => {
  const server = await Helpers.runHttp2Server((req, res) => {
    res.stream.respond({
      ':status': 200,
      'content-type': 'text/html',
    });
    res.stream.pushStream({ ':path': '/img.png' }, (err, pushStream) => {
      pushStream.respond({
        ':status': 200,
        'content-type': 'image/png',
      });
      pushStream.end(Helpers.getLogo());
    });
    res.end(`<html><body><img src="/img.png"/></body></html>`);
  });

  const meta = await connection.createSession();
  const tab = Session.getTab(meta);
  const session = Session.get(meta.sessionId);
  Helpers.needsClosing.push(session);
  await tab.goto(server.url);
  await tab.waitForLoad('DomContentLoaded');

  const resources = await tab.waitForResource({ url: /.*\/img.png/ });
  expect(resources).toHaveLength(1);
  expect(resources[0].type).toBe('Image');
  await session.close();
});

test('records a single resource for failed mitm requests', async () => {
  const meta = await connection.createSession();
  const session = Session.get(meta.sessionId);
  Helpers.needsClosing.push(session);
  const tab = Session.getTab(meta);

  const resolvable = new Resolvable<void>();
  const didEmit = new Resolvable<void>();
  const originalEmit = tab.puppetPage.emit.bind(tab.puppetPage);
  // @ts-ignore
  jest.spyOn(tab.puppetPage.networkManager, 'emit').mockImplementation((evt, args) => {
    // eslint-disable-next-line promise/always-return,promise/catch-or-return
    resolvable.promise.then(() => {
      originalEmit(evt as any, args);
    });
    if (evt === 'resource-loaded') didEmit.resolve();
    return true;
  });
  const goToPromise = tab.goto(`http://localhost:2344/not-there`);

  await expect(goToPromise).rejects.toThrowError();
  expect(session.mitmErrorsByUrl.get(`http://localhost:2344/not-there`)).toHaveLength(1);
  expect(session.sessionState.getResources(meta.tabId)).toHaveLength(1);
  // @ts-ignore
  expect(Object.keys(session.sessionState.browserRequestIdToResources)).toHaveLength(0);
  resolvable.resolve();
  await didEmit.promise;
  await new Promise(setImmediate);
  expect(session.sessionState.getResources(meta.tabId)).toHaveLength(1);
  // @ts-ignore
  expect(Object.keys(session.sessionState.browserRequestIdToResources)).toHaveLength(1);
  await session.close();
});
