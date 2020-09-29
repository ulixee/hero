import { Helpers } from '@secret-agent/testing';
import { ITestKoaServer } from '@secret-agent/testing/helpers';
import Core from '../index';

let koaServer: ITestKoaServer;
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

  it('can go back', async () => {
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];

    koaServer.get('/page2', ctx => {
      ctx.body = `<html><body><h1>Page 2</h1></body></html>`;
    });

    await core.goto(`${koaServer.baseUrl}/`);

    expect(await core.getLocationHref()).toBe(`${koaServer.baseUrl}/`);

    await core.goto(`${koaServer.baseUrl}/page2`);
    expect(await core.getLocationHref()).toBe(`${koaServer.baseUrl}/page2`);
    // @ts-ignore
    const pages = core.tab.navigationTracker;
    expect(pages.history).toHaveLength(2);
    expect(pages.currentUrl).toBe(`${koaServer.baseUrl}/page2`);

    await core.goBack();
    expect(pages.history).toHaveLength(3);
    expect(pages.currentUrl).toBe(`${koaServer.baseUrl}/`);

    await core.goForward();
    expect(pages.history).toHaveLength(4);
    expect(pages.top.stateChanges.has('AllContentLoaded')).toBe(true);
    expect(pages.currentUrl).toBe(`${koaServer.baseUrl}/page2`);
  });
});
