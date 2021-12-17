import * as Fs from 'fs';
import { Helpers } from '@ulixee/hero-testing';
import { LocationStatus, LocationTrigger, LoadStatus } from '@ulixee/hero-interfaces/Location';
import { InteractionCommand } from '@ulixee/hero-interfaces/IInteractions';
import { getLogo, ITestKoaServer } from '@ulixee/hero-testing/helpers';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import HumanEmulator from '@ulixee/hero-plugin-utils/lib/HumanEmulator';

import { ContentPaint } from '@ulixee/hero-interfaces/INavigation';
import Core, { Tab } from '../index';
import ConnectionToClient from '../connections/ConnectionToClient';
import Session from '../lib/Session';
import FrameNavigationsObserver from '../lib/FrameNavigationsObserver';

let koaServer: ITestKoaServer;
let connectionToClient: ConnectionToClient;
beforeAll(async () => {
  Core.use(
    class BasicHumanEmulator extends HumanEmulator {
      static id = 'basic';
    },
  );
  await Core.start();
  connectionToClient = Core.addConnection();
  await connectionToClient.connect();
  Helpers.onClose(() => connectionToClient.disconnect(), true);
  koaServer = await Helpers.runKoaServer();
});

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Navigation tests', () => {
  it('handles unformatted urls', async () => {
    const unformattedUrl = koaServer.baseUrl;
    const { tab } = await createSession();
    await tab.goto(unformattedUrl);
    const formattedUrl = await tab.getUrl();

    expect(formattedUrl).toBe(`${unformattedUrl}/`);
  });

  it('handles urls with a hash', async () => {
    koaServer.get('/hash', ctx => {
      ctx.body = 'done';
    });
    const { tab } = await createSession();
    await expect(tab.goto(`${koaServer.baseUrl}/hash#hash`)).resolves.toBeTruthy();
  });

  it('works without explicit waitForLocation', async () => {
    const { tab } = await createSession();
    await tab.goto(koaServer.baseUrl);

    const elem = await tab.execJsPath(['document', ['querySelector', 'a'], 'nodeName']);
    const hrefAttribute = await tab.execJsPath(['document', ['querySelector', 'a'], 'href']);
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
    const { tab } = await createSession();
    await expect(tab.goto(startingUrl, 100)).rejects.toThrowError('Timeout');
    timeoutResolve();
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
    const { tab } = await createSession();

    for (let i = 0; i < 10; i += 1) {
      await tab.goto(startingUrl);
      await tab.waitForLoad('PaintingStable');
      const hrefAttribute = await tab.execJsPath(['document', ['querySelector', 'a'], 'href']);
      expect(hrefAttribute.value).toBe(`${koaServer.baseUrl}/etagPage`);
    }

    // need to give the last image a second to show that it loaded from cache
    await new Promise(resolve => setTimeout(resolve, 100));

    const resources = tab.session.resources.getForTab(tab.id);
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
    const { tab } = await createSession();

    for (let i = 0; i < 15; i += 1) {
      await tab.goto(startingUrl);
      await tab.waitForLoad('PaintingStable');
      const hrefAttribute = await tab.execJsPath(['document', ['querySelector', 'a'], 'href']);
      expect(hrefAttribute.value).toBe(`${koaServer.baseUrl}/etagPage`);
    }
  });

  it('handles page reloading itself', async () => {
    const startingUrl = `${koaServer.baseUrl}/reload`;
    const { tab } = await createSession();

    let hasReloaded = false;
    koaServer.get('/reload', ctx => {
      if (hasReloaded) {
        ctx.body = '<body>Reloaded</body>';
      } else {
        ctx.body = '<body><script>window.location.reload()</script></body>';
        hasReloaded = true;
      }
    });

    await tab.goto(startingUrl);
    await tab.waitForLocation(LocationTrigger.reload);

    const text = await tab.execJsPath(['document', 'body', 'textContent']);

    expect(text.value).toBe('Reloaded');
  });

  it('can reload a page', async () => {
    const startingUrl = `${koaServer.baseUrl}/pagex`;
    const { tab } = await createSession();

    let counter = 0;
    koaServer.get('/pagex', ctx => {
      if (counter === 0) {
        ctx.body = '<body>First Load</body>';
      } else {
        ctx.body = '<body>Second Load</body>';
      }
      counter += 1;
    });

    const gotoResource = await tab.goto(startingUrl);
    await tab.waitForLoad(LocationStatus.PaintingStable);

    const text = await tab.execJsPath(['document', 'body', 'textContent']);
    expect(text.value).toBe('First Load');

    const reloadResource = await tab.reload();
    const text2 = await tab.execJsPath(['document', 'body', 'textContent']);
    expect(text2.value).toBe('Second Load');
    expect(reloadResource.id).not.toBe(gotoResource.id);
    expect(reloadResource.url).toBe(gotoResource.url);

    await tab.waitForLoad(LocationStatus.PaintingStable);
  });

  it('can go back and forward', async () => {
    const { tab } = await createSession();

    koaServer.get('/backAndForth', ctx => {
      ctx.body = `<html><body><h1>Page 2</h1></body></html>`;
    });

    await tab.goto(`${koaServer.baseUrl}/`);

    expect(await tab.getUrl()).toBe(`${koaServer.baseUrl}/`);

    await tab.goto(`${koaServer.baseUrl}/backAndForth`);
    expect(await tab.getUrl()).toBe(`${koaServer.baseUrl}/backAndForth`);

    const pages = tab.navigations;
    expect(pages.history).toHaveLength(2);
    expect(pages.currentUrl).toBe(`${koaServer.baseUrl}/backAndForth`);

    await tab.goBack();
    expect(pages.history).toHaveLength(3);
    expect(pages.currentUrl).toBe(`${koaServer.baseUrl}/`);

    await tab.goForward();
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
    const { tab } = await createSession();

    koaServer.get('/navigate', ctx => {
      ctx.body = `<body><script>window.location = '${navigateToUrl}'</script></body>`;
    });

    await tab.goto(startingUrl);
    await tab.waitForLocation(LocationTrigger.change);

    const currentUrl = await tab.getUrl();

    expect(currentUrl).toBe(navigateToUrl);
  });

  it('handles submitting a form', async () => {
    const startingUrl = `${koaServer.baseUrl}/form`;
    const navigateToUrl = `${koaServer.baseUrl}/`;
    const { tab } = await createSession();

    koaServer.get('/form', ctx => {
      ctx.body = `<body><form action="${navigateToUrl}" method="post"><input type="submit" id="button"></form></body>`;
    });

    await tab.goto(startingUrl);

    await tab.waitForLoad(LocationStatus.PaintingStable);
    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', '#button']],
      },
    ]);

    await tab.waitForLocation(LocationTrigger.change);

    const currentUrl = await tab.getUrl();

    expect(currentUrl).toBe(navigateToUrl);
  }, 60e3);

  it('handles navigation via link clicks', async () => {
    const startingUrl = `${koaServer.baseUrl}/click`;
    const navigateToUrl = `${koaServer.baseUrl}/`;
    const { tab } = await createSession();

    koaServer.get('/click', ctx => {
      ctx.body = `<body><a href='${navigateToUrl}'>Clicker</a></body>`;
    });

    await tab.goto(startingUrl);

    await tab.waitForLoad(LocationStatus.PaintingStable);
    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'a']],
      },
    ]);

    await tab.waitForLocation(LocationTrigger.change);

    const currentUrl = await tab.getUrl();

    expect(currentUrl).toBe(navigateToUrl);
  });

  it('handles an in-page navigation change', async () => {
    const startingUrl = `${koaServer.baseUrl}/inpage`;
    const navigateToUrl = `${koaServer.baseUrl}/inpage#location2`;
    const { tab } = await createSession();

    koaServer.get('/inpage', ctx => {
      ctx.body = `<body>
<a href='#location2'>Clicker</a>

<div id="location2">
    <h2>Destination</h2>
</div>

</body>`;
    });

    await tab.goto(startingUrl);

    await tab.waitForLoad(LocationStatus.PaintingStable);
    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'a']],
      },
    ]);

    await tab.waitForLocation(LocationTrigger.change);

    const currentUrl = await tab.getUrl();

    expect(currentUrl).toBe(navigateToUrl);

    const pages = tab.navigations;
    expect(pages.history).toHaveLength(2);
  });

  it('handles an in-page navigation change that happens before page load', async () => {
    const startingUrl = `${koaServer.baseUrl}/instant-hash`;
    const navigateToUrl = `${koaServer.baseUrl}/instant-hash#id=12343`;
    const { tab } = await createSession();

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

    await tab.goto(startingUrl);

    await tab.waitForLoad(LocationStatus.PaintingStable);
    await tab.waitForMillis(50);

    const pages = tab.navigations;
    expect(pages.history).toHaveLength(3);
    expect(pages.history[0].statusChanges.has('DomContentLoaded')).toBe(true);
    expect(pages.history[1].statusChanges.has('DomContentLoaded')).toBe(true);
    expect(pages.history.map(x => x.finalUrl ?? x.requestedUrl)).toStrictEqual([
      startingUrl,
      navigateToUrl,
      startingUrl,
    ]);

    const currentUrl = await tab.getUrl();
    expect(currentUrl).toBe(pages.top.finalUrl);
  });

  it('handles in-page history change that happens before page load', async () => {
    const navigateToUrl = `${koaServer.baseUrl}/inpagenav/1`;
    const { tab } = await createSession();

    koaServer.get('/inpagenav', ctx => {
      ctx.body = `<body><script>
history.pushState({}, '', '/inpagenav/1');
    </script>
</body>`;
    });

    await tab.goto(`${koaServer.baseUrl}/inpagenav`);
    await tab.waitForLoad(LocationStatus.PaintingStable);

    const currentUrl = await tab.getUrl();

    expect(currentUrl).toBe(navigateToUrl);
    const pages = tab.navigations;
    expect(pages.history).toHaveLength(2);
    expect(pages.history[0].statusChanges.has('DomContentLoaded')).toBe(true);
    expect(pages.history[1].statusChanges.has('DomContentLoaded')).toBe(true);
  });

  it.todo('handles going to about:blank');

  it('can wait for another tab', async () => {
    let userAgentString1: string;
    let userAgentString2: string;
    koaServer.get('/tabTest', ctx => {
      userAgentString1 = ctx.get('user-agent');
      ctx.body = `<body>
<a target="_blank" href="/tabTestDest">Nothing really here</a>
</body>`;
    });
    koaServer.get('/tabTestDest', ctx => {
      userAgentString2 = ctx.get('user-agent');
      ctx.body = `<body><h1 id="newTabHeader">You are here</h1></body>`;
    });
    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/tabTest`);
    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'a']],
      },
    ]);

    const session = tab.session;

    const newTab = await tab.waitForNewTab();
    expect(session.tabsById.size).toBe(2);
    await newTab.waitForLoad('PaintingStable');
    const header = await newTab.execJsPath([
      'document',
      ['querySelector', '#newTabHeader'],
      'textContent',
    ]);
    expect(header.value).toBe('You are here');
    expect(userAgentString1).toBe(userAgentString2);
    await newTab.close();
  });

  it('should not trigger location change for first navigation of new tabs', async () => {
    const { tab } = await createSession();

    koaServer.get('/newTab', ctx => {
      ctx.body = `<body><h1>Loaded</h1></body>`;
    });
    koaServer.get('/newTabPrompt', ctx => {
      ctx.body = `<body><a href='${koaServer.baseUrl}/newTab' target="_blank">Popup</a></body>`;
    });

    await tab.goto(`${koaServer.baseUrl}/newTabPrompt`);
    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'a']],
      },
    ]);

    const spy = jest.spyOn<any, any>(FrameNavigationsObserver.prototype, 'resolvePendingTrigger');

    // clear data before this run
    const popupTab = await tab.waitForNewTab();
    await popupTab.waitForLoad(LocationStatus.PaintingStable);

    // can sometimes call for paint event
    if (spy.mock.calls.length === 1) {
      expect(spy.mock.calls[0][0]).not.toBe('change');
    } else {
      // should not have triggered a navigation change
      expect(spy).toHaveBeenCalledTimes(0);
    }
  });

  it('handles a new tab that redirects', async () => {
    const { tab } = await createSession();

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

    await tab.goto(`${koaServer.baseUrl}/popup-start`);
    await tab.waitForLoad(LocationStatus.PaintingStable);
    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'a']],
      },
    ]);

    // clear data before this run
    const popupTab = await tab.waitForNewTab();
    expect(popupTab.url).toBe(`${koaServer.baseUrl}/popup-redirect3`);
    const commandId = popupTab.lastCommandId;
    await popupTab.waitForLoad(LocationStatus.PaintingStable);
    // if we're on serious delay, need to wait for change
    if ((await popupTab.getUrl()) !== `${koaServer.baseUrl}/popup-done`) {
      await popupTab.waitForLocation('change', { sinceCommandId: commandId });
      await popupTab.waitForLoad(LocationStatus.DomContentLoaded);
    }
    expect(await popupTab.getUrl()).toBe(`${koaServer.baseUrl}/popup-done`);
    tab.session.db.flush();

    const history = popupTab.navigations.history;
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
    expect(history[3].statusChanges.has('ContentPaint')).toBe(true);
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
    const { tab } = await createSession();
    const resource = await tab.goto(startingUrl);
    expect(resource.request.url).toBe(`${koaServer.baseUrl}/after-redirect`);
    expect(resource.isRedirect).toBe(false);
  });
});

describe('PaintingStable tests', () => {
  it('should trigger painting stable after a redirect', async () => {
    const startingUrl = `${koaServer.baseUrl}/stable-redirect`;
    koaServer.get('/stable-redirect', async ctx => {
      await new Promise(resolve => setTimeout(resolve, 100));
      ctx.redirect('/post-stable-redirect');
    });
    koaServer.get('/post-stable-redirect', ctx => {
      ctx.body = '<html lang="en"><body><h1>So stable</h1></body></html>';
    });
    const { tab } = await createSession();
    const resource = await tab.goto(startingUrl);
    await expect(tab.waitForLoad(LocationStatus.PaintingStable)).resolves.toBeTruthy();
    expect(resource.request.url).toBe(`${koaServer.baseUrl}/post-stable-redirect`);
    expect(resource.isRedirect).toBe(false);
  });

  it('should trigger a painting stable on a page that never triggers load', async () => {
    const { tab } = await createSession();

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

    await tab.goto(`${koaServer.baseUrl}/stable-paint1`);
    await tab.waitForLoad(LocationStatus.PaintingStable);
    await expect(tab.isPaintingStable()).resolves.toBeTruthy();
    await expect(tab.isAllContentLoaded()).resolves.not.toBeTruthy();
    if (completeLongScript) completeLongScript();
    expect(tab.navigations.top.statusChanges.has(LoadStatus.AllContentLoaded)).toBe(false);
    expect(tab.navigations.top.statusChanges.has('ContentPaint')).toBe(true);
  });

  it('should trigger painting stable once a single page app is loaded', async () => {
    const { tab } = await createSession();

    koaServer.get('/grid/:filename', async ctx => {
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
        ctx.body = Fs.createReadStream(`${__dirname}/html/grid/index.html`);
      }
      if (filename === 'style.css') {
        ctx.set('content-type', 'text/css');
        ctx.body = Fs.createReadStream(`${__dirname}/html/grid/style.css`);
      }
    });

    await tab.goto(`${koaServer.baseUrl}/grid/index.html`);
    const trs = await tab.execJsPath<number>([
      'document',
      ['querySelectorAll', '.record'],
      'length',
    ]);

    expect(trs.value).toBe(0);
    await tab.waitForLoad(LocationStatus.PaintingStable);
    const trs2 = await tab.execJsPath<number>([
      'document',
      ['querySelectorAll', '.record'],
      'length',
    ]);
    expect(trs2.value).toBe(200 * 4);
  });
});

async function createSession(
  options?: ISessionCreateOptions,
): Promise<{ session: Session; tab: Tab }> {
  const meta = await connectionToClient.createSession(options);
  const tab = Session.getTab(meta);
  Helpers.needsClosing.push(tab.session);
  return { session: tab.session, tab };
}
