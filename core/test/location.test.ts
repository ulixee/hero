import { Helpers } from "@secret-agent/testing";
import { LocationStatus, LocationTrigger } from "@secret-agent/core-interfaces/Location";
import { InteractionCommand } from "@secret-agent/core-interfaces/IInteractions";
import Core from "../index";
import LocationTracker from "../lib/LocationTracker";

let koaServer;
beforeAll(async () => {
  await Core.prewarm();
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic LocationTracker tests', () => {
  it('handles unformatted urls', async () => {
    const unformattedUrl = koaServer.baseUrl;
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];
    await core.goto(unformattedUrl);
    const formattedUrl = await core.getLocationHref();

    expect(formattedUrl).toBe(`${unformattedUrl}/`);

    await core.close();
  });

  it('works without explicit waitForLocation', async () => {
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];
    await core.goto(koaServer.baseUrl);

    const elem = await core.execJsPath(
      ['document', ['querySelector', 'a']],
      ['nodeName', 'baseURI'],
    );
    const hrefAttribute = await core.execJsPath(['document', ['querySelector', 'a'], 'href']);
    expect(elem.value).toMatchObject({ nodeName: 'A' });
    expect(hrefAttribute.value).toBe('https://www.iana.org/domains/example');

    await core.close();
  });

  it('handles page reloading itself', async () => {
    const startingUrl = `${koaServer.baseUrl}/reload`;
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];

    let hasReloaded = false;
    koaServer.get('/reload', ctx => {
      if (hasReloaded) {
        ctx.body = '<body>Reloaded</body>';
      } else {
        ctx.body = '<body><script>window.location.reload()</script></body>';
        hasReloaded = true;
      }
    });

    const runWaitForCbsSpy = jest.spyOn<any, any>(LocationTracker.prototype, 'runWaitForCbs');
    await core.goto(startingUrl);
    await core.waitForLocation(LocationTrigger.reload);

    const text = await core.execJsPath(['document', 'body', 'textContent']);
    const locationStatusHistory = runWaitForCbsSpy.mock.calls.map(x => x[0]);

    expect(text.value).toBe('Reloaded');
    expect(locationStatusHistory).toMatchObject([
      'change',
      'HttpRequested',
      'HttpResponded',
      'reload',
      'HttpRequested',
      'HttpResponded',
      'DomContentLoaded',
      'AllContentLoaded',
    ]);
    await core.close();
    runWaitForCbsSpy.mockRestore();
  });

  it('handles page that navigates to another url', async () => {
    const startingUrl = `${koaServer.baseUrl}/navigate`;
    const navigateToUrl = `${koaServer.baseUrl}/`;
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];

    koaServer.get('/navigate', ctx => {
      ctx.body = `<body><script>window.location = '${navigateToUrl}'</script></body>`;
    });

    const runWaitForCbsSpy = jest.spyOn<any, any>(LocationTracker.prototype, 'runWaitForCbs');
    await core.goto(startingUrl);
    await core.waitForLocation(LocationTrigger.change);

    const currentUrl = await core.getLocationHref();
    const locationStatusHistory = runWaitForCbsSpy.mock.calls.map(x => x[0]);

    expect(currentUrl).toBe(navigateToUrl);
    expect(locationStatusHistory).toMatchObject([
      'change',
      'HttpRequested',
      'HttpResponded',
      'change',
      'HttpRequested',
      'HttpResponded',
      'DomContentLoaded',
      'AllContentLoaded',
    ]);

    await core.close();
    runWaitForCbsSpy.mockRestore();
  });

  it('handles submitting a form', async () => {
    const startingUrl = `${koaServer.baseUrl}/form`;
    const navigateToUrl = `${koaServer.baseUrl}/`;
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];

    koaServer.get('/form', ctx => {
      ctx.body = `<body><form action="${navigateToUrl}" method="post"><input type="submit" id="button"></form></body>`;
    });

    const runWaitForCbsSpy = jest.spyOn<any, any>(LocationTracker.prototype, 'runWaitForCbs');
    await core.goto(startingUrl);

    await core.waitForLoad(LocationStatus.AllContentLoaded);
    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', '#button']],
      },
    ]);

    await core.waitForLocation(LocationTrigger.change);

    const currentUrl = await core.getLocationHref();
    const locationStatusHistory = runWaitForCbsSpy.mock.calls.map(x => x[0]);

    expect(currentUrl).toBe(navigateToUrl);
    expect(locationStatusHistory).toMatchObject([
      'change',
      'HttpRequested',
      'HttpResponded',
      'DomContentLoaded',
      'AllContentLoaded',
      'change',
      'HttpRequested',
      'HttpResponded',
      'DomContentLoaded',
      'AllContentLoaded',
    ]);

    await core.close();
    runWaitForCbsSpy.mockRestore();
  });

  it('handles page that navigates via click', async () => {
    const startingUrl = `${koaServer.baseUrl}/click`;
    const navigateToUrl = `${koaServer.baseUrl}/`;
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];

    koaServer.get('/click', ctx => {
      ctx.body = `<body><a href='${navigateToUrl}'>Clicker</a></body>`;
    });

    const runWaitForCbsSpy = jest.spyOn<any, any>(LocationTracker.prototype, 'runWaitForCbs');
    await core.goto(startingUrl);

    await core.waitForLoad(LocationStatus.AllContentLoaded);
    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'a']],
      },
    ]);

    await core.waitForLocation(LocationTrigger.change);

    const currentUrl = await core.getLocationHref();
    const locationStatusHistory = runWaitForCbsSpy.mock.calls.map(x => x[0]);

    expect(currentUrl).toBe(navigateToUrl);
    expect(locationStatusHistory).toMatchObject([
      'change',
      'HttpRequested',
      'HttpResponded',
      'DomContentLoaded',
      'AllContentLoaded',
      'change',
      'HttpRequested',
      'HttpResponded',
      'DomContentLoaded',
      'AllContentLoaded',
    ]);

    await core.close();
    runWaitForCbsSpy.mockRestore();
  });

  it('handles an in-page navigation change', async () => {
    const startingUrl = `${koaServer.baseUrl}/inpage`;
    const navigateToUrl = `${koaServer.baseUrl}/inpage#location2`;
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];

    koaServer.get('/inpage', ctx => {
      ctx.body = `<body>
<a href='#location2'>Clicker</a>

<div id="location2">
    <h2>Destination</h2>
</div>

</body>`;
    });

    const runWaitForCbsSpy = jest.spyOn<any, any>(LocationTracker.prototype, 'runWaitForCbs');
    await core.goto(startingUrl);

    await core.waitForLoad(LocationStatus.AllContentLoaded);
    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'a']],
      },
    ]);

    await core.waitForLocation(LocationTrigger.change);

    const currentUrl = await core.getLocationHref();
    const locationStatusHistory = runWaitForCbsSpy.mock.calls.map(x => x[0]);

    expect(currentUrl).toBe(navigateToUrl);
    expect(locationStatusHistory).toMatchObject([
      'change',
      'HttpRequested',
      'HttpResponded',
      'DomContentLoaded',
      'AllContentLoaded',
      'change',
    ]);

    // @ts-ignore
    const tab = core.tab;
    // @ts-ignore
    const pages = tab.navigationTracker;
    expect(pages.history).toHaveLength(2);

    await core.close();
    runWaitForCbsSpy.mockRestore();
  });

  it('handles an in-page navigation change that happens before page load', async () => {
    const startingUrl = `${koaServer.baseUrl}/instant-hash`;
    const navigateToUrl = `${koaServer.baseUrl}/instant-hash#id=12343`;
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];

    koaServer.get('/instant-hash', ctx => {
      ctx.body = `<body>
<script>
location.hash= '#id=12343';
setTimeout(function() {
  history.replaceState(null, null, ' ')
})
</script>

</body>`;
    });

    const runWaitForCbsSpy = jest.spyOn<any, any>(LocationTracker.prototype, 'runWaitForCbs');
    await core.goto(startingUrl);

    await core.waitForLoad(LocationStatus.AllContentLoaded);
    await core.waitForMillis(50);
    // @ts-ignore
    const tab = core.tab;
    // @ts-ignore
    const pages = tab.navigationTracker;
    expect(pages.history).toHaveLength(3);
    expect(pages.history.map(x => x.finalUrl ?? x.requestedUrl)).toStrictEqual([
      startingUrl,
      navigateToUrl,
      startingUrl,
    ]);

    const currentUrl = await core.getLocationHref();
    expect(currentUrl).toBe(pages.top.finalUrl);

    await core.close();
    runWaitForCbsSpy.mockRestore();
  });

  it.todo('handles going to about:blank');

  it('correctly triggers location change for new tabs', async () => {
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];

    koaServer.get('/newTab', ctx => {
      ctx.body = `<body><h1>Loaded</h1></body>`;
    });
    koaServer.get('/newTabPrompt', ctx => {
      ctx.body = `<body><a href='${koaServer.baseUrl}/newTab' target="_blank">Popup</a></body>`;
    });

    await core.goto(`${koaServer.baseUrl}/newTabPrompt`);
    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'a']],
      },
    ]);

    // clear data before this run
    const popupTabMeta = await core.waitForNewTab();
    const popupCore = Core.byTabId[popupTabMeta.tabId];
    const jestSpy = jest.fn();
    // eslint-disable-next-line jest/valid-expect-in-promise
    popupCore
      .waitForLocation('change')
      .then(jestSpy)
      .catch(err => expect(err).not.toBeTruthy());
    await popupCore.waitForLoad('AllContentLoaded');
    expect(jestSpy).toHaveBeenCalledTimes(0);
  });

  it('handles a new tab that redirects', async () => {
    const runWaitForCbsSpy = jest.spyOn<any, any>(LocationTracker.prototype, 'runWaitForCbs');
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];

    koaServer.get('/popup-redirect', ctx => {
      ctx.redirect('/popup-redirect2');
    });
    koaServer.get('/popup-redirect2', ctx => {
      ctx.redirect('/popup-redirect3');
    });
    koaServer.get('/popup-redirect3', ctx => {
      ctx.body = '<body><h1>Long journey!</h1></body>';
    });
    koaServer.get('/popup', ctx => {
      ctx.body = `<body>
<h1>Loaded</h1>
<script type="text/javascript">
setTimeout(() => {
  window.location.href = '/popup-redirect';
}, 200);
</script>
      </body>`;
    });
    koaServer.get('/popup-start', ctx => {
      ctx.body = `<body><a href='${koaServer.baseUrl}/popup' target="_blank">Popup</a></body>`;
    });

    await core.goto(`${koaServer.baseUrl}/popup-start`);

    await core.waitForLoad(LocationStatus.AllContentLoaded);
    runWaitForCbsSpy.mockClear();
    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'a']],
      },
    ]);

    // clear data before this run
    const popupTabMeta = await core.waitForNewTab();
    const popupCore = Core.byTabId[popupTabMeta.tabId];

    await popupCore.waitForLoad('DomContentLoaded');
    await popupCore.waitForLocation(LocationTrigger.change);
    await popupCore.waitForLoad('AllContentLoaded');

    expect(await popupCore.getLocationHref()).toBe(`${koaServer.baseUrl}/popup-redirect3`);

    const locationStatusHistory = runWaitForCbsSpy.mock.calls.map(x => x[0]);

    // @ts-ignore
    const history = popupCore.tab.navigationTracker.history;
    expect(history).toHaveLength(4);
    expect(history.map(x => x.requestedUrl)).toStrictEqual([
      `${koaServer.baseUrl}/popup`,
      `${koaServer.baseUrl}/popup-redirect`,
      `${koaServer.baseUrl}/popup-redirect2`,
      `${koaServer.baseUrl}/popup-redirect3`,
    ]);
    expect(history.map(x => x.finalUrl)).toStrictEqual([
      `${koaServer.baseUrl}/popup`,
      `${koaServer.baseUrl}/popup-redirect2`,
      `${koaServer.baseUrl}/popup-redirect3`,
      `${koaServer.baseUrl}/popup-redirect3`,
    ]);
    expect(history[0].stateChanges.has('AllContentLoaded')).toBe(true);
    expect(history[1].stateChanges.has('HttpRedirected')).toBe(true);
    expect(history[2].stateChanges.has('HttpRedirected')).toBe(true);
    expect(history[3].stateChanges.has('AllContentLoaded')).toBe(true);

    expect(locationStatusHistory).toMatchObject([
      'HttpRequested',
      'HttpResponded',
      'DomContentLoaded',
      'AllContentLoaded',
      'change',
      'HttpRequested',
      'HttpRedirected',
      'change',
      'HttpRequested',
      'HttpRedirected',
      'change',
      'HttpRequested',
      'HttpResponded',
      'DomContentLoaded',
      'AllContentLoaded',
    ]);

    await core.close();
    runWaitForCbsSpy.mockRestore();
  });
});
