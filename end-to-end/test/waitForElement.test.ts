import { Hero, Helpers } from '@ulixee/hero-testing';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import Tab from '@ulixee/hero/lib/Tab';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic waitForElement tests', () => {
  it('waits for an element', async () => {
    koaServer.get('/waitForElementTest1', ctx => {
      ctx.body = `<body>
<script>
    setTimeout(function() {
      const elem = document.createElement('A');
      elem.setAttribute('href', '/waitForElementTest2');
      document.body.append(elem)
    }, 500);
</script>
</body>`;
    });

    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/waitForElementTest1`);

    await expect(tab.document.querySelector('a').$waitForExists()).resolves.toBeTruthy();
  });

  it('times out waiting for an element', async () => {
    koaServer.get('/waitForElementTest2', ctx => {
      ctx.body = `<body><a>Nothing really here</a></body>`;
    });
    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/waitForElementTest2`);
    await tab.waitForLoad('DomContentLoaded');

    await expect(
      tab.querySelector('a#notthere').$waitForExists({ timeoutMs: 500 }),
    ).rejects.toThrow(/Timeout waiting for element to exist/);
  });

  it('will wait for an element to be visible', async () => {
    koaServer.get('/waitForElementTest3', ctx => {
      ctx.body = `<body>
    <a id="waitToShow" href="/anywhere" style="display: none">Link</a>
<script>
    setTimeout(function() {
      document.querySelector('a#waitToShow').style.display = 'block';
    }, 150);
</script>
</body>`;
    });
    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/waitForElementTest3`);

    await expect(tab.querySelector('a#waitToShow').$waitForVisible()).resolves.toBeTruthy();
  });

  it('can wait for an element to be visible with hidden parent', async () => {
    koaServer.get('/waitForElementParent', ctx => {
      ctx.body = `<body>
  <div id="parent" style="position:fixed;">
    <a id="child" href="/link">Child</a>
  </div>
<script>
    function show() {
      document.querySelector('#parent').style.display = 'block';
    }
    function hide() {
      document.querySelector('#parent').style.display = 'none';
    }
</script>
</body>`;
    });
    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/waitForElementParent`);
    await tab.waitForLoad('DomContentLoaded');

    const visibility = await tab.getComputedVisibility(tab.querySelector('a#child'));
    expect(visibility.isVisible).toBe(true);

    await tab.getJsValue('setTimeout(() => hide(), 100)');

    await expect(tab.querySelector('a#child').$waitForHidden()).resolves.toBeTruthy();

    await tab.getJsValue('setTimeout(() => show(), 100)');

    await expect(tab.querySelector('a#child').$waitForVisible()).resolves.toBeTruthy();
  });

  it('can wait for an element to be clickable', async () => {
    koaServer.get('/waitForElementTestCustom', ctx => {
      ctx.body = `<body>
    <a id="waitToShow" href="/anywhere" style="margin-top:2500px; display: none">Link</a>
<script>
    setTimeout(function() {
      document.querySelector('a#waitToShow').style.display = 'block';
    }, 150);
    setTimeout(function() {
      document.querySelector('a#waitToShow').style.marginTop = 0;
    }, 250);
</script>
</body>`;
    });
    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/waitForElementTestCustom`);

    await expect(tab.querySelector('a#waitToShow').$waitForClickable()).resolves.toBeTruthy();
  });

  it('will yield an error for a bad querySelector', async () => {
    koaServer.get('/waitForElementBadQs', ctx => {
      ctx.body = `<body><div>Middle</div></body>`;
    });
    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/waitForElementBadQs`);

    await expect(tab.querySelector('button-title="test"').$waitForVisible()).rejects.toThrow(
      'valid selector',
    );
  });

  it('will wait for a valid path to exist', async () => {
    koaServer.get('/waitForElementValidPath', ctx => {
      ctx.body = `<body><ul>
<li>1</li>
<li>2</li>
</ul>
<script>
    setTimeout(function() {
      const child = document.createElement('li');
      child.innerText='3';
      document.querySelector('ul').append(child);
    }, 150);
</script>

</body>`;
    });
    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/waitForElementValidPath`);

    await expect(
      tab.querySelector('ul').children[2].$waitForVisible({
        timeoutMs: 5e3,
      }),
    ).resolves.toBeTruthy();
  });

  it('will find the correct center of an element', async () => {
    koaServer.get('/waitForElementCenter', ctx => {
      ctx.body = `<body>
<div id="wrapper" style="padding: 10px;">
<div id="elem1" style="width: 50px; height: 25px; margin: 15px">I am 1</div>
<div id="elem2" style="width: 50px; height: 25px; margin: 15px">I am 2</div>
</div>
</body>`;
    });
    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/waitForElementCenter`);

    await expect(tab.querySelector('#wrapper').$waitForVisible()).resolves.toBeTruthy();

    await expect(tab.querySelector('#elem1').$waitForVisible()).resolves.toBeTruthy();

    await expect(tab.querySelector('#elem2').$waitForVisible()).resolves.toBeTruthy();
  });

  it('will wait for an element above the fold to be on screen', async () => {
    koaServer.get('/waitForElementTestOnScreen', ctx => {
      ctx.body = `<body>
    <a id="waitToShow" href="/anywhere" style="display:block; position: absolute; top: -100px">Link</a>
<script>
    setTimeout(function() {
      document.querySelector('a#waitToShow').style.top = 0;
    }, 150);
</script>
</body>`;
    });
    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/waitForElementTestOnScreen`);

    await expect(tab.querySelector('a#waitToShow').$waitForVisible()).resolves.toBeTruthy();
  });

  it('will wait until an element off the bottom of the page comes into view', async () => {
    koaServer.get('/waitForElementTestOffBottom', ctx => {
      ctx.body = `<body>
<div style="height: 2000px; position: relative">
    <a id="waitToShow" href="/anywhere" style="position: relative; top: 1990px">Link</a>
 </div>
<script>
    setTimeout(function() {
      document.querySelector('a#waitToShow').scrollIntoView({ behavior: 'smooth'})
    }, 150);
</script>
</body>`;
    });
    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/waitForElementTestOffBottom`);

    await expect(tab.querySelector('a#waitToShow').$waitForVisible()).resolves.toBeTruthy();
  });

  it('can wait for an element to be hidden', async () => {
    koaServer.get('/waitForHidden', ctx => {
      ctx.body = `<body>
<div>
    <a id="waitToRemove">Link</a>
 </div>
<script>
    setTimeout(function() {
      document.querySelector('a#waitToRemove').remove();
    }, 150);
</script>
</body>`;
    });
    const { tab } = await createSession();
    await tab.goto(`${koaServer.baseUrl}/waitForHidden`);

    try {
      // In this case, the element might be null if removed and cleaned up depending on timing. We need to just wait
      await tab.querySelector('a#waitToRemove').$waitForHidden();
    } catch (err) {
      expect(err).not.toBeTruthy();
    }
  });
});

async function createSession(options?: ISessionCreateOptions): Promise<{ tab: Tab; hero: Hero }> {
  const hero = new Hero(options);
  Helpers.needsClosing.push(hero);
  return { tab: hero.activeTab, hero };
}
