import { Helpers } from '@ulixee/hero-testing';
import { createSession, ITestKoaServer } from '@ulixee/hero-testing/helpers';
import PageStateGenerator from '@ulixee/hero-timetravel/lib/PageStateGenerator';
import { LoadStatus } from '@ulixee/hero-interfaces/Location';
import Core from '@ulixee/hero-core';
import * as Fs from 'fs';
import Hero from '../index';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('can wait for a url', async () => {
  const hero = await openBrowser('/');
  koaServer.get('/waitForPageState1', ctx => {
    ctx.body = `<body><h1>Hi</h1></body>`;
  });

  await hero.goto(`${koaServer.baseUrl}/waitForPageState1`);
  const state = await hero.activeTab.waitForPageState({
    page1({ assert }) {
      assert(hero.url, url => url.includes('waitForPageState'));
    },
    page2({ assert }) {
      assert(hero.url, url => url.includes('page2'));
    },
  });
  expect(state).toBe('page1');
});

test('can wait for a domElement', async () => {
  const hero = await openBrowser('/');
  koaServer.get('/waitForPageState2', ctx => {
    ctx.body = `<body><h1>Hi</h1>
<script>
let count = 0;
setInterval(() => {
  count += 1;
  const div = document.createElement('div');
  div.textContent = 'hi'  + count;
  document.body.append(div)
}, 100)
</script>
</body>`;
  });

  await hero.goto(`${koaServer.baseUrl}/waitForPageState2`);
  const state = await hero.activeTab.waitForPageState({
    fourDivs({ assert }) {
      assert(hero.document.querySelectorAll('div').length, x => x >= 4);
    },
    fiveDivs({ assert }) {
      assert(hero.document.querySelectorAll('div').length, 5);
    },
    twoHeaders({ assert }) {
      assert(hero.document.querySelectorAll('h1').length, 2);
    },
  });
  expect(state).toBe('fourDivs');
});

test('can test for page state across redirects', async () => {
  koaServer.get('/waitForPageStateRedirect1', ctx => {
    ctx.body = `<body>
      <a href="/waitForPageStateRedirect2">Click Me</a>
    </body>`;
  });
  koaServer.get('/waitForPageStateRedirect2', ctx => {
    ctx.redirect('/waitForPageStateRedirect3');
  });

  koaServer.get('/waitForPageStateRedirect3', ctx => {
    ctx.body = `<head>
        <title>HTML Meta Tag</title>
        <meta http-equiv = "refresh" content = "0; url = ${koaServer.baseUrl}/waitForPageStateRedirect4" />
     </head>
     <body>
        <p>This page won't be here long.</p>
     </body>`;
  });

  koaServer.get('/waitForPageStateRedirect4', ctx => {
    ctx.redirect('/waitForPageStateRedirectLast');
  });
  koaServer.get('/waitForPageStateRedirectLast', ctx => {
    ctx.body = `<body><h1 data-final="true">Hi</h1></body>`;
  });
  const hero = await openBrowser('/waitForPageStateRedirect1');

  await hero.click(hero.document.querySelector('a'));

  const state = hero.activeTab.waitForPageState({
    lastRedirect({ assert }) {
      assert(hero.url, x => x.startsWith(koaServer.baseUrl));
      assert(hero.isPaintingStable);
      assert(hero.document.querySelector('h1').dataset, x => x.final === 'true');
    },
  });
  await expect(state).resolves.toBe('lastRedirect');
});

test('surfaces errors in assertions', async () => {
  koaServer.get('/waitForPageStateError', ctx => {
    ctx.body = `<body><h1>Hi</h1></body>`;
  });
  const hero = await openBrowser('/waitForPageStateError');

  const state = hero.activeTab.waitForPageState({
    shouldNotThrowNullError({ assert }) {
      assert(hero.document.querySelector('h1').getAttribute('id'), x => x.includes('1'));
    },
    shouldThrowError({ assert }) {
      // @ts-ignore
      assert(hero.document.querySelector('h1').getAttribute('id'), x => test.includes(x));
    },
    nonUrl({ assert }) {
      assert(hero.url, x => x.includes('notGonnaHappen'));
    },
  });
  await expect(state).rejects.toThrowError('test.includes is not a function');
});

test('surfaces errors in query selectors that are invalid (vs simply not there)', async () => {
  koaServer.get('/waitForPageStateSelectorError', ctx => {
    ctx.body = `<body><h1>Hi</h1></body>`;
  });
  const hero = await openBrowser('/waitForPageStateSelectorError');

  const state = hero.activeTab.waitForPageState({
    shouldNotThrowNullError({ assert }) {
      // @ts-ignore
      assert(hero.document.querySelector('h2').getAttribute('id'), '2');
    },
    shouldThrowError({ assert }) {
      // @ts-ignore
      assert(hero.document.querySelector('h1[id@1]').getAttribute('id'), '1');
    },
  });
  await expect(state).rejects.toThrowError('not a valid selector');
});

test('can match on X of many (assert.any) conditions', async () => {
  koaServer.get('/waitForPageStateAny', ctx => {
    ctx.body = `<body>
<h1>Hi</h1>
<script>
let count = 0;
setInterval(() => {
  count += 1;

  if (count === 2) {
    document.cookie = 'cookieTest=1'
  }

  if (count === 3) {
    localStorage.setItem('Loaded', 'true');
  }
  const div = document.createElement('div');
  div.textContent = 'hi'  + count;
  document.body.append(div)
}, 100)
</script>
</body>`;
  });
  const hero = await openBrowser('/waitForPageStateAny');

  const state = await hero.waitForPageState({
    gotDivs({ assert, assertAny }) {
      assert(hero.url, x => x.includes('waitForPageStateAny'));
      assert(hero.isPaintingStable);
      assertAny(3, [
        assert(hero.document.querySelectorAll('ul').length, 1),
        assert(hero.document.querySelectorAll('h1').length, x => x > 2),
        assert(hero.mainFrameEnvironment.cookieStorage.getItem('cookieTest'), x => x.value === '1'),
        assert(hero.mainFrameEnvironment.localStorage.getItem('Loaded'), 'true'),
        assert(hero.document.querySelectorAll('div')[3].textContent, 'hi4'),
        assert(hero.document.querySelector('h1').textContent, 'hi'), // capitalization wrong
      ]);
    },
    pageAll({ assert }) {
      assert(hero.url, x => x.includes('waitForPageStateAll'));
    },
  });
  expect(state).toBe('gotDivs');
  await new Promise(resolve => setTimeout(resolve, 500));
});

test('can load a generated pageState', async () => {
  koaServer.get('/img.png', ctx => {
    ctx.set('Content-Type', 'image/png');
    ctx.body = Helpers.getLogo();
  });
  koaServer.get('/logo.png', ctx => {
    ctx.set('Content-Type', 'image/png');
    ctx.body = Helpers.getLogo();
  });
  koaServer.get('/waitForPageStateGenerated1', ctx => {
    ctx.body = `<body>
<h1>Hi</h1>
<img src="/img.png">
</body>`;
  });
  koaServer.get('/waitForPageStateGenerated2', ctx => {
    ctx.body = `<body>
<h2>Hi</h2>
<img src="/logo.png"></body>`;
  });

  /////// generate state
  const pageStateGenerator = new PageStateGenerator('1');
  await Promise.all(
    ['1', '1', '2', '2'].map(async x => {
      const { tab, session } = await createSession();
      const resource = await tab.goto(`${koaServer.baseUrl}/waitForPageStateGenerated${x}`);
      const startTime = resource.response.timestamp;
      await tab.waitForLoad(LoadStatus.PaintingStable);
      await tab.flushDomChanges();
      await tab.close();
      pageStateGenerator.addSession(session.db, tab.id, [startTime, Date.now()]);
      pageStateGenerator.addState(x, session.id);
    }),
  );
  await pageStateGenerator.evaluate();
  const state1 = pageStateGenerator.export('1');
  const state2 = `${Core.dataDir}/waitForPageState2.json`;
  Fs.writeFileSync(state2, JSON.stringify(pageStateGenerator.export('2')));

  // create a page that sort of matches, but also doesn't
  koaServer.get('/waitForPageStatePrep', async ctx => {
    await new Promise(resolve => setTimeout(resolve, 100));
    ctx.body = `<body><h2>Hi</h2>
<script>
setTimeout(() => {
  location.href = "${koaServer.baseUrl}/waitForPageStateGenerated1"
}, 50)
</script>
</body>`;
  });

  const hero = await openBrowser('/waitForPageStatePrep');
  const state = hero.activeTab.waitForPageState({
    state1({ loadFrom }) {
      loadFrom(state1);
    },
    state2({ loadFrom }) {
      loadFrom(state2);
    },
  });
  await expect(state).resolves.toBe('state1');
});

async function openBrowser(path: string) {
  const hero = new Hero();
  Helpers.needsClosing.push(hero);
  await hero.goto(`${koaServer.baseUrl}${path}`);
  await hero.waitForPaintingStable();
  return hero;
}
