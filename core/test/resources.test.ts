import { Helpers } from '@ulixee/hero-testing';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import ConnectionToHeroClient from '../connections/ConnectionToHeroClient';
import Core, { Session } from '../index';
import { stringToRegex } from '../lib/Tab';

let connection: ConnectionToHeroClient;
beforeAll(() => {
  connection = Core.addConnection();
  Helpers.onClose(() => connection.disconnect(), true);
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('loads http2 resources', async () => {
  const server = await Helpers.runHttp2Server((req, res) => {
    if (req.url === '/img.png') {
      // NOTE: chrome will still request this even though it's pushed
      return res.destroy();
    }
    res.stream.pushStream(
      {
        ':path': '/img.png',
        ':method': 'GET',
      },
      (err, pushStream) => {
        pushStream.respond({
          ':status': 200,
          'content-type': 'image/png',
          'content-length': Buffer.byteLength(Helpers.getLogo()),
        });
        pushStream.end(Helpers.getLogo());
      },
    );
    res.stream.respond({
      ':status': 200,
      'content-type': 'text/html',
    });
    res.stream.end(`<html><body><img src="/img.png"/></body></html>`);
  });

  const meta = await connection.createSession();
  const tab = Session.getTab(meta);
  const session = Session.get(meta.sessionId);
  Helpers.needsClosing.push(session);
  await tab.goto(server.url);
  await tab.waitForLoad('DomContentLoaded');

  const resources = await tab.waitForResources({ url: /.*\/img.png/ });
  expect(resources).toHaveLength(1);
  expect(resources[0].type).toBe('Image');
  await session.close();
});

test('records a single resource for failed mitm requests', async () => {
  const meta = await connection.createSession();
  const session = Session.get(meta.sessionId);
  Helpers.needsClosing.push(session);
  const tab = Session.getTab(meta);

  const waitForEmptyKeyCheck = new Resolvable<void>();
  const didEmit = new Resolvable<void>();
  const originalEmit = tab.page.emit.bind(tab.page);
  // @ts-ignore
  jest.spyOn(tab.page.networkManager, 'emit').mockImplementation((evt, args) => {
    // eslint-disable-next-line promise/always-return,promise/catch-or-return,@typescript-eslint/no-floating-promises
    waitForEmptyKeyCheck.promise.then(() => {
      originalEmit(evt as any, args);
    });
    if (evt === 'resource-loaded') didEmit.resolve();
    return true;
  });
  const goToPromise = tab.goto(`http://localhost:2344/not-there`);

  await expect(goToPromise).rejects.toThrowError();
  // @ts-ignore
  const mitmErrorsByUrl = session.resources.mitmErrorsByUrl;
  expect(mitmErrorsByUrl.get(`http://localhost:2344/not-there`)).toHaveLength(1);
  expect(session.resources.getForTab(meta.tabId)).toHaveLength(1);
  expect([...session.resources.browserRequestIdToResources.keys()]).toHaveLength(0);
  waitForEmptyKeyCheck.resolve();
  await didEmit.promise;
  await new Promise(setImmediate);
  expect(session.resources.getForTab(meta.tabId)).toHaveLength(1);
  expect([...session.resources.browserRequestIdToResources.keys()]).toHaveLength(1);
  await session.close();
});

test('should convert a url with special chars into a valid regex', () => {
  const regexp = stringToRegex('https://fonts.com?family=Open+Sans:300,300i');
  expect('https://fonts.com?family=Open+Sans:300,300i'.match(regexp)).toBeTruthy();
});

test('should convert a url with wildcards into a valid regex', () => {
  const regexp = stringToRegex('https://www.skyscanner.com/g/conductor/v1/fps3/search/*');
  expect('https://www.skyscanner.com/g/conductor/v1/fps3/search/1234'.match(regexp)).toBeTruthy();
});
