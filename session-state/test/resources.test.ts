import { Helpers } from '@secret-agent/testing';
import Core from '@secret-agent/core';

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);
process.env.MITM_ALLOW_INSECURE = 'true';

test('loads http2 resources', async () => {
  const server = await Helpers.runHttp2Server((req, res) => {
    res.stream.respond(
      {
        ':status': 200,
        'content-type': 'text/html',
      },
      { waitForTrailers: true },
    );
    res.stream.pushStream({ ':path': '/img.png' }, (err, pushStream) => {
      pushStream.respond(
        {
          ':status': 200,
          'content-type': 'application/json',
        },
        { waitForTrailers: true },
      );
      pushStream.end(Helpers.getLogo());
      pushStream.on('wantTrailers', () => pushStream.close());
    });
    res.on('wantTrailers', () => () => {
      res.stream.close();
    });
    res.end(`<html><body><img src="/img.png"/></body></html>`);
  });

  const meta = await Core.createTab();
  const core = Core.byTabId[meta.tabId];
  await core.goto(server.url);
  await core.waitForLoad('DomContentLoaded');

  const resources = await core.waitForResource({ url: /.*\/img.png/ });
  expect(resources[0].type).toBe('Image');
});
