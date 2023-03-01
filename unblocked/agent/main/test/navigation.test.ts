import * as Fs from 'fs';
import { BrowserUtils, Helpers, TestLogger } from '@ulixee/unblocked-agent-testing';
import {
  LoadStatus,
  LocationStatus,
  LocationTrigger,
} from '@ulixee/unblocked-specification/agent/browser/Location';
import { InteractionCommand } from '@ulixee/unblocked-specification/agent/interact/IInteractions';
import { getLogo, ITestKoaServer } from '@ulixee/unblocked-agent-testing/helpers';
import { ContentPaint } from '@ulixee/unblocked-specification/agent/browser/INavigation';
import FrameNavigationsObserver from '../lib/FrameNavigationsObserver';
import { Agent, Page, Pool } from '../index';

let koaServer: ITestKoaServer;
let pool: Pool;
const resolvePendingTriggerSpy = jest.spyOn<any, any>(
  FrameNavigationsObserver.prototype,
  'resolvePendingTrigger',
);

async function createAgent(enableMitm): Promise<{ agent: Agent; page: Page }> {
  const agent = pool.createAgent({
    logger: TestLogger.forTest(module),
    options: { disableMitm: !enableMitm },
  });
  const page = await agent.newPage();
  Helpers.needsClosing.push(agent);
  return { agent, page };
}

beforeEach(() => {
  TestLogger.testNumber += 1;
});
beforeAll(async () => {
  pool = new Pool({ defaultBrowserEngine: BrowserUtils.defaultBrowserEngine });
  await pool.start();
  Helpers.onClose(() => pool.close(), true);
});

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe.each([
  ['with Mitm', true],
  ['withoutMitm', false],
])('basic Navigation tests %s', (key, enableMitm) => {
  beforeAll(async () => {
    koaServer = await Helpers.runKoaServer();
  });

  it('handles unformatted urls', async () => {
    const unformattedUrl = koaServer.baseUrl;
    const { page } = await createAgent(enableMitm);
    await page.goto(unformattedUrl);
    const formattedUrl = page.mainFrame.url;

    expect(formattedUrl).toBe(`${unformattedUrl}/`);
  });

  it('handles urls with a hash', async () => {
    koaServer.get('/hash', ctx => {
      ctx.body = 'done';
    });
    const { page } = await createAgent(enableMitm);
    await expect(page.goto(`${koaServer.baseUrl}/hash#hash`)).resolves.toBeTruthy();
  });

  it('works without explicit waitForLocation', async () => {
    const { page } = await createAgent(enableMitm);
    await page.goto(koaServer.baseUrl);
    await page.waitForLoad(LocationStatus.PaintingStable);

    const elem = await page.execJsPath(['document', ['querySelector', 'a'], 'nodeName']);
    const hrefAttribute = await page.execJsPath(['document', ['querySelector', 'a'], 'href']);
    expect(elem.value).toBe('A');
    expect(hrefAttribute.value).toBe('https://www.iana.org/domains/example');
  });

  it('times out a goto', async () => {
    const startingUrl = `${koaServer.baseUrl}/timeout`;
    let timeoutResolve = () => null;
    koaServer.get('/timeout', async ctx => {
      await new Promise<void>(resolve => {
        timeoutResolve = resolve;
      });
      ctx.body = 'done';
    });
    const { page, agent } = await createAgent(enableMitm);
    const connectSpy = jest.spyOn(agent.mitmRequestSession.requestAgent, 'createSocketConnection');
    await expect(page.goto(startingUrl, { timeoutMs: 100 })).rejects.toThrowError('Timeout');
    timeoutResolve();
    if (enableMitm) {
      expect(connectSpy.mock.calls[0][1]).toEqual(100);
    }
  });

  it('can load a cached page multiple times', async () => {
    const startingUrl = `${koaServer.baseUrl}/etag`;
    koaServer.get('/etag', ctx => {
      ctx.set('ETag', `W/\\"d02-48a7cf4b62c40\\"`);
      ctx.set('Last-Modified', `Sat, 03 Jul 2010 14:59:53 GMT`);
      ctx.body = `<html><body>
  <img src="/img.jpeg"/>
  <a href="/etagPage"></a>
  </body></html>`;
    });
    koaServer.get('/img.jpeg', async ctx => {
      ctx.set('ETag', `W/\\"d02-48a7cf4b62c41\\"`);
      ctx.set('Last-Modified', `Sat, 03 Jul 2010 14:59:53 GMT`);
      ctx.body = await getLogo();
    });
    const { page } = await createAgent(enableMitm);

    for (let i = 0; i < 10; i += 1) {
      await page.goto(startingUrl);
      await page.waitForLoad('PaintingStable');
      const hrefAttribute = await page.execJsPath(['document', ['querySelector', 'a'], 'href']);
      expect(hrefAttribute.value).toBe(`${koaServer.baseUrl}/etagPage`);
    }

    // need to give the last image a second to show that it loaded from cache
    await new Promise(resolve => setTimeout(resolve, 100));

    const resources = page.browserContext.resources.getForTab(page.tabId);
    expect(resources).toHaveLength(20);
  });

  it('can goto a page multiple times', async () => {
    const startingUrl = `${koaServer.baseUrl}/etag2`;
    koaServer.get('/img2.jpeg', async ctx => {
      ctx.body = await getLogo();
    });
    koaServer.get('/etag2', ctx => {
      ctx.body = `<html><body>
  <img src="/img2.jpeg"/>
  <a href="/etagPage">Etag Page</a>
  <script>
   for (let i = 0; i< 100; i+=1) {
      const elements = document.querySelectorAll('a');
      const newElement = document.createElement('div');
      newElement.textContent = 'hi';
      elements[0].append(newElement)
   }
  </script>
  </body></html>`;
    });
    const { page } = await createAgent(enableMitm);

    for (let i = 0; i < 15; i += 1) {
      await page.goto(startingUrl);
      await page.waitForLoad('PaintingStable');
      const hrefAttribute = await page.execJsPath(['document', ['querySelector', 'a'], 'href']);
      expect(hrefAttribute.value).toBe(`${koaServer.baseUrl}/etagPage`);
    }
  });

  it('handles page reloading itself', async () => {
    const startingUrl = `${koaServer.baseUrl}/reload`;
    const { page } = await createAgent(enableMitm);

    let hasReloaded = false;
    koaServer.get('/reload', ctx => {
      if (hasReloaded) {
        ctx.body = '<body>Reloaded</body>';
      } else {
        ctx.body = '<body><script>window.location.reload()</script></body>';
        hasReloaded = true;
      }
    });

    await page.goto(startingUrl);
    await page.mainFrame.waitForLocation(LocationTrigger.reload);
    await page.waitForLoad(LocationStatus.PaintingStable);

    const text = await page.execJsPath(['document', 'body', 'textContent']);

    expect(text.value).toBe('Reloaded');
  });

  it('can reload a page', async () => {
    const startingUrl = `${koaServer.baseUrl}/pagex`;
    const { page } = await createAgent(enableMitm);

    let counter = 0;
    koaServer.get('/pagex', ctx => {
      if (counter === 0) {
        ctx.body = '<body>First Load</body>';
      } else {
        ctx.body = '<body>Second Load</body>';
      }
      counter += 1;
    });

    const gotoResource = await page.goto(startingUrl);
    await page.waitForLoad(LocationStatus.PaintingStable);

    const text = await page.execJsPath(['document', 'body', 'textContent']);
    expect(text.value).toBe('First Load');

    const reloadResource = await page.reload();
    const navigation = await page.waitForLoad(LocationStatus.PaintingStable);
    expect(navigation.navigationReason).toBe('reload');
    const text2 = await page.execJsPath(['document', 'body', 'textContent']);
    expect(text2.value).toBe('Second Load');
    expect(reloadResource.id).not.toBe(gotoResource.id);
    expect(reloadResource.url).toBe(gotoResource.url);

    await page.waitForLoad(LocationStatus.PaintingStable);
  });

  it('can go back and forward', async () => {
    const { page } = await createAgent(enableMitm);

    koaServer.get('/backAndForth', ctx => {
      ctx.body = `<html><body><h1>Page 2</h1></body></html>`;
    });

    await page.goto(`${koaServer.baseUrl}/`);

    expect(page.mainFrame.url).toBe(`${koaServer.baseUrl}/`);

    await page.goto(`${koaServer.baseUrl}/backAndForth`);
    await page.waitForLoad('PaintingStable');
    expect(page.mainFrame.url).toBe(`${koaServer.baseUrl}/backAndForth`);

    const pages = page.mainFrame.navigations;
    expect(pages.history).toHaveLength(2);
    expect(pages.currentUrl).toBe(`${koaServer.baseUrl}/backAndForth`);

    await page.goBack();
    expect(pages.top.navigationReason).toBe('goBack');
    expect(pages.top.statusChanges.has('ContentPaint')).toBe(true);
    expect(pages.history).toHaveLength(3);
    expect(pages.currentUrl).toBe(`${koaServer.baseUrl}/`);

    await page.goForward();
    expect(pages.top.navigationReason).toBe('goForward');
    expect(pages.top.statusChanges.has('ContentPaint')).toBe(true);
    expect(pages.history).toHaveLength(4);
    expect(
      pages.top.statusChanges.has(LoadStatus.AllContentLoaded) ||
        pages.top.statusChanges.has(ContentPaint),
    ).toBe(true);
    expect(pages.currentUrl).toBe(`${koaServer.baseUrl}/backAndForth`);
  });

  it('handles page that navigates to another url', async () => {
    const startingUrl = `${koaServer.baseUrl}/navigate`;
    const navigateToUrl = `${koaServer.baseUrl}/`;
    const { page } = await createAgent(enableMitm);

    koaServer.get('/navigate', ctx => {
      ctx.body = `<body><script>window.location = '${navigateToUrl}'</script></body>`;
    });

    await page.goto(startingUrl);
    const result = await page.mainFrame.waitForLocation(LocationTrigger.change);

    expect(result.finalUrl).toBe(navigateToUrl);
  });

  it('handles submitting a form', async () => {
    const startingUrl = `${koaServer.baseUrl}/form`;
    const navigateToUrl = `${koaServer.baseUrl}/`;
    const { page } = await createAgent(enableMitm);

    koaServer.get('/form', ctx => {
      ctx.body = `<body><form action="${navigateToUrl}" method="post"><input type="submit" id="button"></form></body>`;
    });

    await page.goto(startingUrl);

    await page.waitForLoad(LocationStatus.PaintingStable);
    await page.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', '#button']],
      },
    ]);

    const result = await page.mainFrame.waitForLocation(LocationTrigger.change);

    const currentUrl = result.finalUrl;

    expect(currentUrl).toBe(navigateToUrl);
  }, 60e3);

  it('handles navigation via link clicks', async () => {
    const startingUrl = `${koaServer.baseUrl}/click`;
    const navigateToUrl = `${koaServer.baseUrl}/`;
    const { page } = await createAgent(enableMitm);

    koaServer.get('/click', ctx => {
      ctx.body = `<body><a href='${navigateToUrl}'>Clicker</a></body>`;
    });

    await expect(page.goto(startingUrl)).resolves.toBeTruthy();

    await expect(page.waitForLoad(LocationStatus.PaintingStable)).resolves.toBeTruthy();
    await expect(
      page.interact([
        {
          command: InteractionCommand.click,
          mousePosition: ['window', 'document', ['querySelector', 'a']],
        },
      ]),
    ).resolves.toBe(undefined);

    await expect(page.mainFrame.waitForLocation(LocationTrigger.change)).resolves.toEqual(
      expect.objectContaining({
        finalUrl: navigateToUrl,
      }),
    );
  });

  it('handles an in-page navigation change', async () => {
    const startingUrl = `${koaServer.baseUrl}/inpage`;
    const navigateToUrl = `${koaServer.baseUrl}/inpage#location2`;
    const { page } = await createAgent(enableMitm);

    koaServer.get('/inpage', ctx => {
      ctx.body = `<body>
<a href='#location2'>Clicker</a>

<div id="location2">
    <h2>Destination</h2>
</div>

</body>`;
    });

    await expect(page.goto(startingUrl)).resolves.toBeTruthy();

    await expect(page.waitForLoad(LocationStatus.PaintingStable)).resolves.toBeTruthy();
    await expect(
      page.interact([
        {
          command: InteractionCommand.click,
          mousePosition: ['window', 'document', ['querySelector', 'a']],
        },
      ]),
    ).resolves.toBe(undefined);

    await expect(page.mainFrame.waitForLocation(LocationTrigger.change)).resolves.toEqual(
      expect.objectContaining({
        finalUrl: navigateToUrl,
      }),
    );

    const pages = page.mainFrame.navigations;
    expect(pages.history).toHaveLength(2);
  });

  it('handles an in-page navigation back', async () => {
    const startingUrl = `${koaServer.baseUrl}/inpage-back`;
    const navigateToUrl = `${koaServer.baseUrl}/inpage-back#location2`;
    const { page } = await createAgent(enableMitm);

    koaServer.get('/inpage-back', ctx => {
      ctx.body = `<body>
<a href='#location2'>Clicker</a>

<div id="location2">
    <h2>Destination</h2>
</div>

</body>`;
    });

    await expect(page.goto(startingUrl)).resolves.toBeTruthy();

    await expect(page.waitForLoad(LocationStatus.PaintingStable)).resolves.toBeTruthy();
    await expect(
      page.interact([
        {
          command: InteractionCommand.click,
          mousePosition: ['window', 'document', ['querySelector', 'a']],
        },
      ]),
    ).resolves.toBe(undefined);

    await expect(page.mainFrame.waitForLocation(LocationTrigger.change)).resolves.toBeTruthy();
    await expect(page.waitForLoad('DomContentLoaded')).resolves.toBeTruthy();
    expect(page.mainFrame.url).toBe(navigateToUrl);
    await expect(page.goBack()).resolves.toBeTruthy();
    expect(page.mainFrame.url).toBe(startingUrl);
    expect(page.mainFrame.navigations.top.navigationReason).toBe('goBack');
    expect(page.mainFrame.navigations.history).toHaveLength(3);
    expect(page.mainFrame.navigations.top.statusChanges.has('DomContentLoaded')).toBe(true);
  });

  it('handles an in-page navigation change that happens before page load', async () => {
    const startingUrl = `${koaServer.baseUrl}/instant-hash`;
    const navigateToUrl = `${koaServer.baseUrl}/instant-hash#id=12343`;
    const { page } = await createAgent(enableMitm);

    koaServer.get('/instant-hash', ctx => {
      ctx.body = `<body>
<h1>Title</h1>
<script>
location.hash= '#id=12343';
setTimeout(function() {
  history.replaceState(null, null, ' ')
})
</script>

</body>`;
    });

    await page.goto(startingUrl);

    await page.waitForLoad(LocationStatus.PaintingStable);
    await new Promise(resolve => setTimeout(resolve, 50));

    const pages = page.mainFrame.navigations;
    expect(pages.history).toHaveLength(3);
    expect(pages.history[0].statusChanges.has('DomContentLoaded')).toBe(true);
    expect(pages.history[1].statusChanges.has('DomContentLoaded')).toBe(true);
    expect(pages.history.map(x => x.finalUrl ?? x.requestedUrl)).toStrictEqual([
      startingUrl,
      navigateToUrl,
      startingUrl,
    ]);

    const currentUrl = page.mainFrame.url;
    expect(currentUrl).toBe(pages.top.finalUrl);
  });

  it('handles in-page history change that happens before page load', async () => {
    const navigateToUrl = `${koaServer.baseUrl}/inpagenav/1`;
    const { page } = await createAgent(enableMitm);

    koaServer.get('/inpagenav', ctx => {
      ctx.body = `<body><script>
history.pushState({}, '', '/inpagenav/1');
    </script>
</body>`;
    });

    await page.goto(`${koaServer.baseUrl}/inpagenav`);
    await page.waitForLoad(LocationStatus.PaintingStable);

    const currentUrl = page.mainFrame.url;

    expect(currentUrl).toBe(navigateToUrl);
    const pages = page.mainFrame.navigations;
    expect(pages.history).toHaveLength(2);
    expect(pages.history[0].statusChanges.has('DomContentLoaded')).toBe(true);
    expect(pages.history[1].statusChanges.has('DomContentLoaded')).toBe(true);
  });

  it.todo('handles going to about:blank');

  it('can wait for another page', async () => {
    let userAgentString1: string;
    let userAgentString2: string;
    koaServer.get('/newPageTest', ctx => {
      userAgentString1 = ctx.get('user-agent');
      ctx.body = `<body>
<a target="_blank" href="/newPageTestDest">Nothing really here</a>
</body>`;
    });
    koaServer.get('/newPageTestDest', ctx => {
      userAgentString2 = ctx.get('user-agent');
      ctx.body = `<body><h1 id="newPageHeader">You are here</h1></body>`;
    });
    const { page } = await createAgent(enableMitm);
    await page.goto(`${koaServer.baseUrl}/newPageTest`);
    await page.waitForLoad('PaintingStable');
    await page.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'a']],
      },
    ]);

    const newPage = await waitForPopup(page);
    expect(page.browserContext.pagesById.size).toBe(2);
    await newPage.waitForLoad('PaintingStable');
    const header = await newPage.execJsPath([
      'document',
      ['querySelector', '#newPageHeader'],
      'textContent',
    ]);
    expect(header.value).toBe('You are here');
    expect(userAgentString1).toBe(userAgentString2);
    await newPage.close();
  });

  it('should not trigger location change for first navigation of new pages', async () => {
    const { page } = await createAgent(enableMitm);
    koaServer.get('/newPage', ctx => {
      ctx.body = `<body><h1>Loaded</h1></body>`;
    });
    koaServer.get('/newPagePrompt', ctx => {
      ctx.body = `<body><a href='${koaServer.baseUrl}/newPage' target="_blank">Popup</a></body>`;
    });

    await page.goto(`${koaServer.baseUrl}/newPagePrompt`);
    await page.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'a']],
      },
    ]);

    resolvePendingTriggerSpy.mockClear();

    // clear data before this run
    const popupPage = await waitForPopup(page);
    await popupPage.mainFrame.waitForLoad({ loadStatus: LocationStatus.PaintingStable });

    // can sometimes call for paint event
    if (resolvePendingTriggerSpy.mock.calls.length === 1) {
      expect(resolvePendingTriggerSpy.mock.calls[0][0]).not.toBe('change');
    } else {
      // should not have triggered a navigation change
      expect(resolvePendingTriggerSpy).toHaveBeenCalledTimes(0);
    }
  });

  it('handles a new page that redirects', async () => {
    const { page } = await createAgent(enableMitm);

    koaServer.get('/popup-redirect', async ctx => {
      await new Promise(resolve => setTimeout(resolve, 25));
      ctx.redirect('/popup-redirect2');
    });
    koaServer.get('/popup-redirect2', async ctx => {
      ctx.status = 301;
      await new Promise(resolve => setTimeout(resolve, 25));
      ctx.set('Location', '/popup-redirect3');
    });
    koaServer.get('/popup-redirect3', ctx => {
      ctx.body = `<body>
<h1>Loaded</h1>
<script type="text/javascript">
const perfObserver = new PerformanceObserver(() => {
  window.location.href = '/popup-done';
});
perfObserver.observe({ type: 'largest-contentful-paint', buffered: true });
</script>
      </body>`;
    });
    koaServer.get('/popup-done', ctx => {
      ctx.body = '<body><h1>Long journey!</h1></body>';
    });
    koaServer.get('/popup', ctx => {
      ctx.redirect('/popup-redirect');
    });
    koaServer.get('/popup-start', ctx => {
      ctx.body = `<body><a href='${koaServer.baseUrl}/popup' target="_blank">Popup</a></body>`;
    });

    await page.goto(`${koaServer.baseUrl}/popup-start`);
    await page.waitForLoad(LocationStatus.PaintingStable);
    await page.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'a']],
      },
    ]);

    // clear data before this run
    const popupPage = await waitForPopup(page);
    await popupPage.waitForLoad(LocationStatus.PaintingStable);
    const commandId = popupPage.browserContext.commandMarker.lastId;
    // if we're on serious delay, need to wait for change
    if (popupPage.mainFrame.url !== `${koaServer.baseUrl}/popup-done`) {
      await popupPage.mainFrame.waitForLocation('change', { sinceCommandId: commandId });
      await popupPage.waitForLoad(LocationStatus.DomContentLoaded);
    }
    expect(popupPage.mainFrame.url).toBe(`${koaServer.baseUrl}/popup-done`);

    const history = popupPage.mainFrame.navigations.history;
    expect(history).toHaveLength(5);
    expect(history.map(x => x.requestedUrl)).toStrictEqual([
      `${koaServer.baseUrl}/popup`,
      `${koaServer.baseUrl}/popup-redirect`,
      `${koaServer.baseUrl}/popup-redirect2`,
      `${koaServer.baseUrl}/popup-redirect3`,
      `${koaServer.baseUrl}/popup-done`,
    ]);
    expect(history.map(x => x.finalUrl)).toStrictEqual([
      `${koaServer.baseUrl}/popup-redirect`,
      `${koaServer.baseUrl}/popup-redirect2`,
      `${koaServer.baseUrl}/popup-redirect3`,
      `${koaServer.baseUrl}/popup-redirect3`,
      `${koaServer.baseUrl}/popup-done`,
    ]);

    expect(history[1].statusChanges.has(LocationStatus.HttpRedirected)).toBe(true);
    expect(history[2].statusChanges.has(LocationStatus.HttpRedirected)).toBe(true);
  });

  it('should return the last redirected url as the "resource" when a goto redirects', async () => {
    const startingUrl = `${koaServer.baseUrl}/goto-redirect`;
    koaServer.get('/goto-redirect', async ctx => {
      await new Promise(resolve => setTimeout(resolve, 100));
      ctx.redirect('/after-redirect');
    });
    koaServer.get('/after-redirect', ctx => {
      ctx.body = '<html lang="en"><body><h1>Hi</h1></body></html>';
    });
    const { page } = await createAgent(enableMitm);
    const resource = await page.goto(startingUrl);
    expect(resource.request.url).toBe(`${koaServer.baseUrl}/after-redirect`);
    expect(resource.isRedirect).toBe(false);
  });
});

describe.each([
  ['with Mitm', true],
  ['withoutMitm', false],
])('PaintingStable tests %s', (key, enableMitm) => {
  it('should trigger painting stable after a redirect', async () => {
    const startingUrl = `${koaServer.baseUrl}/stable-redirect`;
    koaServer.get('/stable-redirect', async ctx => {
      await new Promise(resolve => setTimeout(resolve, 100));
      ctx.redirect('/post-stable-redirect');
    });
    koaServer.get('/post-stable-redirect', ctx => {
      ctx.body = '<html lang="en"><body><h1>So stable</h1></body></html>';
    });
    const { page } = await createAgent(enableMitm);
    const resource = await page.goto(startingUrl);
    await expect(page.waitForLoad(LocationStatus.PaintingStable)).resolves.toBeTruthy();
    expect(resource.request.url).toBe(`${koaServer.baseUrl}/post-stable-redirect`);
    expect(resource.isRedirect).toBe(false);
  });

  it('should trigger a painting stable on a page that never triggers load', async () => {
    const { page } = await createAgent(enableMitm);

    let completeLongScript: () => void;
    koaServer.get('/long-script.js', async ctx => {
      await new Promise<void>(resolve => {
        completeLongScript = resolve;
      });
      ctx.body = '';
    });
    koaServer.get('/img.png', ctx => {
      ctx.body = getLogo();
    });
    koaServer.get('/stable-paint1', ctx => {
      ctx.body = `
<html>
<body>
  <h1>This is a test</h1>
  <img src="/img.png" alt="Image"/>
  <script src="/long-script.js"></script>
</body>
</html>`;
    });

    await page.goto(`${koaServer.baseUrl}/stable-paint1`);
    await page.waitForLoad(LocationStatus.PaintingStable);
    expect(page.mainFrame.navigations.hasLoadStatus(LoadStatus.PaintingStable)).toBe(true);
    expect(page.mainFrame.navigations.hasLoadStatus(LoadStatus.AllContentLoaded)).not.toBe(true);
    if (completeLongScript) completeLongScript();
    expect(page.mainFrame.navigations.top.statusChanges.has(LoadStatus.AllContentLoaded)).toBe(
      false,
    );
    expect(page.mainFrame.navigations.top.statusChanges.has('ContentPaint')).toBe(true);
  });

  it('should trigger painting stable once a single page app is loaded', async () => {
    const { page } = await createAgent(enableMitm);

    koaServer.get('/spa/:filename', async ctx => {
      const filename = ctx.params.filename;
      if (filename === 'data.json') {
        await new Promise(resolve => setTimeout(resolve, 100));
        const records = [];
        for (let i = 0; i < 200; i += 1) {
          records.push(
            { name: 'Chuck Norris', power: 10e3 },
            { name: 'Bruce Lee', power: 9000 },
            { name: 'Jackie Chan', power: 7000 },
            { name: 'Jet Li', power: 8000 },
          );
        }
        ctx.set('content-type', 'application/json');
        ctx.body = JSON.stringify({ records });
      }
      if (filename === 'vue.min.js') {
        ctx.set('content-type', 'application/javascript');
        ctx.body = Fs.createReadStream(require.resolve('vue/dist/vue.min.js'));
      }
      if (filename === 'index.html') {
        ctx.set('content-type', 'text/html');
        ctx.body = Fs.createReadStream(`${__dirname}/assets/spa/index.html`);
      }
      if (filename === 'style.css') {
        ctx.set('content-type', 'text/css');
        ctx.body = Fs.createReadStream(`${__dirname}/assets/spa/style.css`);
      }
    });

    await page.goto(`${koaServer.baseUrl}/spa/index.html`);
    const trs = await page.execJsPath<number>([
      'document',
      ['querySelectorAll', '.record'],
      'length',
    ]);

    expect(trs.value).toBe(0);
    await page.waitForLoad(LocationStatus.PaintingStable);
    const trs2 = await page.execJsPath<number>([
      'document',
      ['querySelectorAll', '.record'],
      'length',
    ]);
    expect(trs2.value).toBe(200 * 4);
  });
});

async function waitForPopup(page: Page): Promise<Page> {
  return new Promise<Page>(resolve => {
    page.popupInitializeFn = async popup => resolve(popup);
  });
}
