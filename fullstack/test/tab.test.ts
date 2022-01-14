import { Helpers } from '@ulixee/hero-testing';
import { Command } from '@ulixee/hero/interfaces/IInteractions';
import { KeyboardKey } from '@ulixee/hero-interfaces/IKeyboardLayoutUS';
import * as os from 'os';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import Hero from '../index';
import { LoadStatus } from '@ulixee/hero-interfaces/Location';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
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
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('Multi-tab scenarios', () => {
  it('can wait for another tab', async () => {
    const hero = new Hero();
    Helpers.needsClosing.push(hero);

    await hero.goto(`${koaServer.baseUrl}/tabTest`);
    await hero.waitForPaintingStable();
    const tab1 = hero.activeTab;
    const url = await hero.document.location.host;
    expect(url).toBe(koaServer.baseHost);

    await hero.click(hero.document.querySelector('a'));
    const newTab = await hero.waitForNewTab();

    expect(await hero.tabs).toHaveLength(2);
    expect(newTab.tabId).not.toBe(hero.activeTab.tabId);
    expect(await newTab.url).toBe(`${koaServer.baseUrl}/newTab`);
    await hero.focusTab(newTab);
    expect(await hero.activeTab.url).toBe(`${koaServer.baseUrl}/newTab`);
    const { document } = hero;
    await newTab.waitForLoad('DomContentLoaded');
    expect(await document.querySelector('#newTabHeader').textContent).toBe('You are here');

    await hero.click(hero.document.querySelector('a'));
    await hero.waitForLocation('change');
    await newTab.waitForLoad('DomContentLoaded');
    expect(await hero.activeTab.url).toBe(`${koaServer.baseUrl}/newTab#hash`);

    const meta = await hero.meta;
    // make sure user hero is wired up
    const navigatorAgent = await hero.getJsValue('navigator.userAgent');
    expect(navigatorAgent).toBe(meta.userAgentString);

    // make sure polyfills ran
    const csi = await hero.getJsValue<any>('chrome.csi()');
    expect(csi.startE).toBeTruthy();

    await hero.closeTab(newTab);
    const newTabList = await hero.tabs;
    expect(newTabList).toHaveLength(1);
    expect(hero.activeTab).toBe(tab1);
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

    const hero = new Hero();
    Helpers.needsClosing.push(hero);

    await hero.goto(`${koaServer.baseUrl}/page1`);
    // need to wait for all images to load
    await hero.activeTab.waitForLoad(LoadStatus.AllContentLoaded);
    expect(await hero.tabs).toHaveLength(1);
    expect(await hero.url).toBe(`${koaServer.baseUrl}/page1`);

    const startCommandId = await hero.lastCommandId;
    await hero.click(hero.document.querySelector('a'));

    const tab1 = hero.activeTab;
    const page1Logos = await tab1.waitForResource({
      url: '/logo.png',
    });
    expect(page1Logos).toHaveLength(2);
    const urls = await Promise.all([page1Logos[0].request.url, page1Logos[1].request.url]);
    urls.sort();
    expect(urls).toStrictEqual([
      `${koaServer.baseUrl}/logo.png`,
      `${koaServer.baseUrl}/logo.png?page=page1`,
    ]);
    await hero.waitForNewTab({ sinceCommandId: startCommandId });

    const tabs = await hero.tabs;
    expect(tabs).toHaveLength(2);
    const tab2 = tabs[1];
    const page2Logos = await tab2.waitForResource({
      url: '/logo.png?page=page2',
    });
    expect(page2Logos).toHaveLength(1);
    expect(await page2Logos[0].request.url).toBe(`${koaServer.baseUrl}/logo.png?page=page2`);
    await tab2.focus();
    await tab2.waitForPaintingStable();
    await hero.click(tab2.document.querySelector('#fwd'));
    await tab2.waitForLocation('change');
    expect(await hero.url).toBe(`${koaServer.baseUrl}/page3`);
    expect(await tab2.url).toBe(`${koaServer.baseUrl}/page3`);
    expect(await tab1.url).toBe(`${koaServer.baseUrl}/page1`);
  }, 30e3);

  it('can command click on a link to get to a new tab', async () => {
    koaServer.get('/tabTest2', ctx => {
      ctx.body = `<body>
<a href="/newTab">Nothing else really here</a>
</body>`;
    });

    const hero = new Hero();
    Helpers.needsClosing.push(hero);

    await hero.goto(`${koaServer.baseUrl}/tabTest2`);
    const newTabKey = os.platform() === 'darwin' ? KeyboardKey.MetaLeft : KeyboardKey.ControlLeft;
    await hero.interact({
      [Command.keyDown]: newTabKey,
    });
    await hero.click(hero.document.querySelector('a'));
    const newTab = await hero.waitForNewTab();

    expect(await newTab.tabId).not.toBe(await hero.activeTab.tabId);
    expect(await newTab.url).toBe(`${koaServer.baseUrl}/newTab`);
    await hero.focusTab(newTab);
    await newTab.waitForLoad('DomContentLoaded');
    const { document } = newTab;
    expect(await document.querySelector('#newTabHeader').textContent).toBe('You are here');

    await hero.click(document.querySelector('a'));
    await hero.waitForLocation('change');
    await hero.activeTab.waitForLoad('DomContentLoaded');
    expect(await hero.activeTab.url).toBe(`${koaServer.baseUrl}/newTab#hash`);

    const meta = await hero.meta;
    // make sure user hero is wired up
    const navigatorAgent = await hero.getJsValue('navigator.userAgent');
    expect(navigatorAgent).toBe(meta.userAgentString);

    // make sure polyfills ran
    const csi = await hero.getJsValue<any>('chrome.csi()');
    expect(csi.startE).toBeTruthy();

    await hero.closeTab(newTab);
  });

  it('can handle new tabs created in js callbacks', async () => {
    koaServer.get('/ajaxNewResult', ctx => {
      ctx.body = '<h1>Overridden Result</h1>';
    });
    koaServer.get('/ajaxTab', ctx => {
      ctx.body = `<body>
<a href="/newTab">Nothing else really here</a>
<script>
document.querySelector('a').addEventListener('click', event => {
  // Prevent default link behavior
  event.preventDefault();
  event.stopPropagation();

  // Simulate Asynchronous delay
  setTimeout(function(){
      window.open('${koaServer.baseUrl}/ajaxNewResult', '_blank');
  }, 100);
  return false;
})
</script>
</body>`;
    });

    const hero = new Hero();
    Helpers.needsClosing.push(hero);

    await hero.goto(`${koaServer.baseUrl}/ajaxTab`);
    await hero.waitForPaintingStable();
    await hero.click(hero.document.querySelector('a'));
    const newTab = await hero.waitForNewTab();

    expect(await newTab.tabId).not.toBe(await hero.activeTab.tabId);
    expect(await newTab.url).toBe(`${koaServer.baseUrl}/ajaxNewResult`);
    await hero.focusTab(newTab);
    const { document } = newTab;
    await newTab.waitForLoad('DomContentLoaded');
    expect(await document.querySelector('h1').textContent).toBe('Overridden Result');

    const meta = await hero.meta;
    // make sure user hero is wired up
    const navigatorAgent = await hero.getJsValue('navigator.userAgent');
    expect(navigatorAgent).toBe(meta.userAgentString);

    await hero.closeTab(newTab);
  });
});
