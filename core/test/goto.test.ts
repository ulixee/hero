import { Helpers } from '@secret-agent/testing';
import { ITestKoaServer } from '@secret-agent/testing/helpers';
import Core from '../index';
import Session from '../lib/Session';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  await Core.start();
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Goto tests', () => {
  it('runs goto', async () => {
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    const meta = await connection.createSession();
    const tab = Session.getTab(meta);
    const exampleUrl = `${koaServer.baseUrl}/`;

    await tab.goto(exampleUrl);
    const url = await tab.execJsPath(['window', 'location', 'host']);
    expect(url.value).toBe(koaServer.baseHost);

    const elem = await tab.execJsPath(
      ['document', ['querySelector', 'a']],
      ['nodeName', 'baseURI'],
    );
    expect(elem.value).toMatchObject({ nodeName: 'A', baseURI: exampleUrl });

    const href = await tab.execJsPath([
      'document',
      ['querySelector', 'a'],
      ['getAttribute', 'href'],
    ]);
    expect(href.value).toBe('https://www.iana.org/domains/example');
  });

  it('can go back', async () => {
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    const meta = await connection.createSession();
    const tab = Session.getTab(meta);

    koaServer.get('/page2', ctx => {
      ctx.body = `<html><body><h1>Page 2</h1></body></html>`;
    });

    await tab.goto(`${koaServer.baseUrl}/`);

    expect(await tab.getLocationHref()).toBe(`${koaServer.baseUrl}/`);

    await tab.goto(`${koaServer.baseUrl}/page2`);
    expect(await tab.getLocationHref()).toBe(`${koaServer.baseUrl}/page2`);
    // @ts-ignore
    const pages = tab.navigationTracker;
    expect(pages.history).toHaveLength(2);
    expect(pages.currentUrl).toBe(`${koaServer.baseUrl}/page2`);

    await tab.goBack();
    expect(pages.history).toHaveLength(3);
    expect(pages.currentUrl).toBe(`${koaServer.baseUrl}/`);

    await tab.goForward();
    expect(pages.history).toHaveLength(4);
    expect(pages.top.stateChanges.has('AllContentLoaded')).toBe(true);
    expect(pages.currentUrl).toBe(`${koaServer.baseUrl}/page2`);
  });
});
