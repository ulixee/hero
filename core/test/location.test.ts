import { Helpers } from '@secret-agent/testing';
import Core from '../index';
import { LocationStatus, LocationTrigger } from '@secret-agent/core-interfaces/Location';
import LocationTracker from '../lib/LocationTracker';
import { InteractionCommand } from '@secret-agent/core-interfaces/IInteractions';

let koaServer;
beforeAll(async () => {
  await Core.start();
  koaServer = await Helpers.runKoaServer();
});

describe('basic LocationTracker tests', () => {
  it('handles unformatted urls', async () => {
    const unformattedUrl = koaServer.baseUrl;
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
    await core.goto(unformattedUrl);
    const formattedUrl = await core.getLocationHref();

    expect(formattedUrl).toBe(`${unformattedUrl}/`);

    await core.close();
  });

  it('works without explicit waitForLocation', async () => {
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
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
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];

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
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];

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
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];

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
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];

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
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];

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
    const window = core.window;
    expect(window.sessionState.pages.history).toHaveLength(2);

    await core.close();
    runWaitForCbsSpy.mockRestore();
  });

  it('handles an in-page navigation change that happens before page load', async () => {
    const startingUrl = `${koaServer.baseUrl}/instant-hash`;
    const navigateToUrl = `${koaServer.baseUrl}/instant-hash#id=12343`;
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];

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
    // @ts-ignore
    const window = core.window;
    expect(window.sessionState.pages.history).toHaveLength(2);
    expect(window.sessionState.pages.history.map(x => x.finalUrl ?? x.requestedUrl)).toStrictEqual([
      startingUrl,
      navigateToUrl,
    ]);

    const currentUrl = await core.getLocationHref();
    expect(currentUrl).toBe(window.sessionState.pages.top.finalUrl);

    await core.close();
    runWaitForCbsSpy.mockRestore();
  });
});

afterAll(async () => {
  await Core.shutdown();
  await Helpers.closeAll();
});
