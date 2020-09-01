import { Helpers } from '@secret-agent/testing';
import Core from '../index';

let koaServer;
beforeAll(async () => {
  await Core.start();
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Goto tests', () => {
  it('runs goto', async () => {
    const exampleUrl = `${koaServer.baseUrl}/`;
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];

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
