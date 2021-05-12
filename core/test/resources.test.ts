import { Helpers } from '@secret-agent/testing';
import Core, { Session } from '@secret-agent/core';

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);
process.env.MITM_ALLOW_INSECURE = 'true';

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

  const connection = Core.addConnection();
  Helpers.onClose(() => connection.disconnect());
  const meta = await connection.createSession();
  const tab = Session.getTab(meta);
  await tab.goto(server.url);
  await tab.waitForLoad('DomContentLoaded');

  const resources = await tab.waitForResource({ url: /.*\/img.png/ });
  expect(resources).toHaveLength(1);
  expect(resources[0].type).toBe('Image');
});
