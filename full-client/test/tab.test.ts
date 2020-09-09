import { Helpers } from '@secret-agent/testing';
import SecretAgent from '../index';

let koaServer;
beforeAll(async () => {
  await SecretAgent.start();
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('Multi-tab scenarios', () => {
  it('can wait for another tab', async () => {
    koaServer.get('/tabTest', ctx => {
      ctx.body = `<body>
<a target="_blank" href="/newTab">Nothing really here</a>
</body>`;
    });
    koaServer.get('/newTab', ctx => {
      ctx.body = `<body>
<h1 id="newTabHeader">You are here</h1>
<a href="#hash">Go back</a>
</body>`;
    });

    const browser = await SecretAgent.createBrowser();

    await browser.goto(`${koaServer.baseUrl}/tabTest`);
    const tab1 = browser.activeTab;
    const url = await browser.document.location.host;
    expect(url).toBe(koaServer.baseHost);

    await browser.click(browser.document.querySelector('a'));
    const newTab = await browser.waitForNewTab();

    expect(newTab.tabId).not.toBe(browser.activeTab.tabId);
    expect(await newTab.url).toBe(`${koaServer.baseUrl}/newTab`);
    await browser.focusTab(newTab);
    expect(await browser.activeTab.url).toBe(`${koaServer.baseUrl}/newTab`);

    await browser.click(browser.document.querySelector('a'));
    expect(await browser.activeTab.url).toBe(`${koaServer.baseUrl}/newTab#hash`);
    await browser.closeTab(newTab);
    expect(await browser.tabs).toHaveLength(1);
    expect(browser.activeTab).toBe(tab1);
  });

  it('can wait for resources in each tab', async () => {
    koaServer.get('/logo.png', ctx => {
      ctx.set('Content-Type', 'image/png');
      ctx.body = Helpers.getLogo();
    });
    koaServer.get('/page1', ctx => {
      ctx.body = `<body>
<img src="/logo.png?page=page1" alt="logo"/>
<img src="/logo.png" alt="logo"/>
<a target="_blank" href="/page2">Nothing really here</a>
</body>`;
    });
    koaServer.get('/page2', ctx => {
      ctx.body = `<body>
<h1 id="newTabHeader">You are here</h1>
<img src="/logo.png?page=page2" alt="logo"/>
<img src="/logo.png" alt="logo"/>
<a href="/page1" id="back">Go back</a>
<a href="/page3" id="fwd">Go back</a>
</body>`;
    });
    koaServer.get('/page3', ctx => {
      ctx.body = `<body><h1>Final</h1></body>`;
    });

    const browser = await SecretAgent.createBrowser();

    await browser.goto(`${koaServer.baseUrl}/page1`);
    await browser.waitForAllContentLoaded();
    expect(await browser.tabs).toHaveLength(1);
    expect(await browser.url).toBe(`${koaServer.baseUrl}/page1`);
    await browser.click(browser.document.querySelector('a'));

    const tab1 = browser.activeTab;
    const page1Logos = await tab1.waitForResource({
      url: '/logo.png',
    });
    expect(page1Logos).toHaveLength(2);
    expect(await page1Logos[0].request.url).toBe(`${koaServer.baseUrl}/logo.png?page=page1`);

    const tabs = await browser.tabs;
    expect(tabs).toHaveLength(2);
    const page2Logos = await tabs[1].waitForResource({
      url: '/logo.png',
    });
    expect(page2Logos).toHaveLength(1);
    expect(await page2Logos[0].request.url).toBe(`${koaServer.baseUrl}/logo.png?page=page2`);
    await tabs[1].focus();
    await browser.click(browser.document.querySelector('#fwd'));
    await tabs[1].waitForLocation('change');
    expect(await browser.url).toBe(`${koaServer.baseUrl}/page3`);
    expect(await tabs[1].url).toBe(`${koaServer.baseUrl}/page3`);
    expect(await tabs[0].url).toBe(`${koaServer.baseUrl}/page1`);
  });
});
