import { Helpers } from '@secret-agent/testing';
import { LocationStatus, LocationTrigger } from '@secret-agent/core-interfaces/Location';
import { InteractionCommand } from '@secret-agent/core-interfaces/IInteractions';
import { ITestKoaServer } from '@secret-agent/testing/helpers';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import Core, { Tab } from '../index';
import LocationTracker from '../lib/LocationTracker';
import CoreServerConnection from '../lib/CoreServerConnection';
import Session from '../lib/Session';

let koaServer: ITestKoaServer;
let connection: CoreServerConnection;
beforeAll(async () => {
  connection = Core.addConnection();
  await connection.connect();
  Helpers.onClose(() => connection.disconnect(), true);
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic LocationTracker tests', () => {
  it('handles unformatted urls', async () => {
    const unformattedUrl = koaServer.baseUrl;
    const { tab } = await createSession();
    await tab.goto(unformattedUrl);
    const formattedUrl = await tab.getLocationHref();

    expect(formattedUrl).toBe(`${unformattedUrl}/`);

    await tab.close();
  });

  it('works without explicit waitForLocation', async () => {
    const { tab } = await createSession();
    await tab.goto(koaServer.baseUrl);

    const elem = await tab.execJsPath(
      ['document', ['querySelector', 'a']],
      ['nodeName', 'baseURI'],
    );
    const hrefAttribute = await tab.execJsPath(['document', ['querySelector', 'a'], 'href']);
    expect(elem.value).toMatchObject({ nodeName: 'A' });
    expect(hrefAttribute.value).toBe('https://www.iana.org/domains/example');

    await tab.close();
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

    const runWaitForCbsSpy = jest.spyOn<any, any>(LocationTracker.prototype, 'runWaitForCbs');
    await tab.goto(startingUrl);
    await tab.waitForLocation(LocationTrigger.reload);

    const text = await tab.execJsPath(['document', 'body', 'textContent']);
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
    await tab.close();
    runWaitForCbsSpy.mockRestore();
  });

  it('handles page that navigates to another url', async () => {
    const startingUrl = `${koaServer.baseUrl}/navigate`;
    const navigateToUrl = `${koaServer.baseUrl}/`;
    const { tab } = await createSession();

    koaServer.get('/navigate', ctx => {
      ctx.body = `<body><script>window.location = '${navigateToUrl}'</script></body>`;
    });

    const runWaitForCbsSpy = jest.spyOn<any, any>(LocationTracker.prototype, 'runWaitForCbs');
    await tab.goto(startingUrl);
    await tab.waitForLocation(LocationTrigger.change);

    const currentUrl = await tab.getLocationHref();
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

    await tab.close();
    runWaitForCbsSpy.mockRestore();
  });

  it('handles submitting a form', async () => {
    const startingUrl = `${koaServer.baseUrl}/form`;
    const navigateToUrl = `${koaServer.baseUrl}/`;
    const { tab } = await createSession();

    koaServer.get('/form', ctx => {
      ctx.body = `<body><form action="${navigateToUrl}" method="post"><input type="submit" id="button"></form></body>`;
    });

    const runWaitForCbsSpy = jest.spyOn<any, any>(LocationTracker.prototype, 'runWaitForCbs');
    await tab.goto(startingUrl);

    await tab.waitForLoad(LocationStatus.AllContentLoaded);
    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', '#button']],
      },
    ]);

    await tab.waitForLocation(LocationTrigger.change);

    const currentUrl = await tab.getLocationHref();
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

    await tab.close();
    runWaitForCbsSpy.mockRestore();
  });

  it('handles page that navigates via click', async () => {
    const startingUrl = `${koaServer.baseUrl}/click`;
    const navigateToUrl = `${koaServer.baseUrl}/`;
    const { tab } = await createSession();

    koaServer.get('/click', ctx => {
      ctx.body = `<body><a href='${navigateToUrl}'>Clicker</a></body>`;
    });

    const runWaitForCbsSpy = jest.spyOn<any, any>(LocationTracker.prototype, 'runWaitForCbs');
    await tab.goto(startingUrl);

    await tab.waitForLoad(LocationStatus.AllContentLoaded);
    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'a']],
      },
    ]);

    await tab.waitForLocation(LocationTrigger.change);

    const currentUrl = await tab.getLocationHref();
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

    await tab.close();
    runWaitForCbsSpy.mockRestore();
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

    const runWaitForCbsSpy = jest.spyOn<any, any>(LocationTracker.prototype, 'runWaitForCbs');
    await tab.goto(startingUrl);

    await tab.waitForLoad(LocationStatus.AllContentLoaded);
    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'a']],
      },
    ]);

    await tab.waitForLocation(LocationTrigger.change);

    const currentUrl = await tab.getLocationHref();
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
    const pages = tab.navigationTracker;
    expect(pages.history).toHaveLength(2);

    await tab.close();
    runWaitForCbsSpy.mockRestore();
  });

  it('handles an in-page navigation change that happens before page load', async () => {
    const startingUrl = `${koaServer.baseUrl}/instant-hash`;
    const navigateToUrl = `${koaServer.baseUrl}/instant-hash#id=12343`;
    const { tab } = await createSession();

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
    await tab.goto(startingUrl);

    await tab.waitForLoad(LocationStatus.AllContentLoaded);
    await tab.waitForMillis(50);
    // @ts-ignore
    const pages = tab.navigationTracker;
    expect(pages.history).toHaveLength(3);
    expect(pages.history.map(x => x.finalUrl ?? x.requestedUrl)).toStrictEqual([
      startingUrl,
      navigateToUrl,
      startingUrl,
    ]);

    const currentUrl = await tab.getLocationHref();
    expect(currentUrl).toBe(pages.top.finalUrl);

    await tab.close();
    runWaitForCbsSpy.mockRestore();
  });

  it.todo('handles going to about:blank');

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

    // clear data before this run
    const popupTab = await tab.waitForNewTab();
    const waitForChange = popupTab.waitForLocation('change', { timeoutMs: 1e3 });
    await popupTab.waitForLoad('AllContentLoaded');
    // should not trigger a change for this
    await expect(waitForChange).rejects.toThrowError('Timeout');
  });

  it('handles a new tab that redirects', async () => {
    const runWaitForCbsSpy = jest.spyOn<any, any>(LocationTracker.prototype, 'runWaitForCbs');
    const { tab } = await createSession();

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

    await tab.goto(`${koaServer.baseUrl}/popup-start`);

    await tab.waitForLoad(LocationStatus.AllContentLoaded);
    runWaitForCbsSpy.mockClear();
    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'a']],
      },
    ]);

    // clear data before this run
    const popupTab = await tab.waitForNewTab();

    await popupTab.waitForLoad('DomContentLoaded');
    await popupTab.waitForLocation(LocationTrigger.change);
    await popupTab.waitForLoad('AllContentLoaded');

    expect(await popupTab.getLocationHref()).toBe(`${koaServer.baseUrl}/popup-redirect3`);

    const locationStatusHistory = runWaitForCbsSpy.mock.calls.map(x => x[0]);

    const history = popupTab.navigationTracker.history;
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

    await tab.close();
    runWaitForCbsSpy.mockRestore();
  });
});

async function createSession(
  options?: ICreateSessionOptions,
): Promise<{ session: Session; tab: Tab }> {
  const meta = await connection.createSession(options);
  const tab = Session.getTab(meta);
  Helpers.needsClosing.push(tab.session);
  return { session: tab.session, tab };
}
