import Core from '../index';
import { Helpers } from '@secret-agent/testing';

let koaServer;
beforeAll(async () => {
  await Core.start();
  koaServer = await Helpers.runKoaServer();
});

describe('basic Goto tests', () => {
  it('runs goto', async () => {
    const exampleUrl = `${koaServer.baseUrl}/`;
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];

    await core.goto(exampleUrl);
    const url = await core.execJsPath(['window', 'location', 'host']);
    expect(url.value).toBe(koaServer.baseHost);

    const elem = await core.execJsPath(
      ['document', ['querySelector', 'a']],
      ['nodeName', 'baseURI'],
    );
    expect(elem.value).toMatchObject({ nodeName: 'A', baseURI: exampleUrl });

    const href = await core.execJsPath([
      'document',
      ['querySelector', 'a'],
      ['getAttribute', 'href'],
    ]);
    expect(href.value).toBe('https://www.iana.org/domains/example');
  });
});

afterAll(async () => {
  await Core.shutdown();
  await Helpers.closeAll();
});
