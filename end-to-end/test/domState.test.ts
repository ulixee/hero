import { Helpers, Hero } from '@ulixee/hero-testing';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import DomState from '@ulixee/hero/lib/DomState';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('can wait for a url', async () => {
  const hero = await openBrowser('/');
  koaServer.get('/waitForDomState1', ctx => {
    ctx.body = `<body><h1>Hi</h1></body>`;
  });

  await hero.goto(`${koaServer.baseUrl}/waitForDomState1`);
  const state1 = hero.activeTab.waitForState({
    all(assert) {
      assert(hero.url, url => url.includes('waitForDomState'));
    },
  });
  await expect(state1).resolves.toBeUndefined();

  const state2 = hero.activeTab.validateState({
    all(assert) {
      assert(hero.url, url => url.includes('page2'));
    },
  });
  await expect(state2).resolves.toBe(false);
});

test('does not allow nested "waitFor" commands', async () => {
  const hero = await openBrowser('/');
  await expect(
    hero.activeTab.waitForState({
      all(assert) {
        assert(hero.waitForPaintingStable());
      },
    }),
  ).rejects.toThrow("can't be used inside a State assertion block");
});

test('can wait for a domElement', async () => {
  const hero = await openBrowser('/');
  koaServer.get('/waitForDomState2', ctx => {
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

  await hero.goto(`${koaServer.baseUrl}/waitForDomState2`);
  const domState = {
    all(assert) {
      assert(hero.document.querySelectorAll('div').length, x => x >= 4);
    },
  };
  await expect(hero.activeTab.waitForState(domState)).resolves.toBeUndefined();
  await expect(hero.activeTab.validateState(domState)).resolves.toBe(true);
});

test('can wait for a domElement on a second tab', async () => {
  const hero = await openBrowser('/');
  koaServer.get('/waitForDomStateTabs', ctx => {
    ctx.body = `<body><h1>Hi</h1>
<a target="_blank" href="/waitForDomStateTab2">Click Me</a>
</body>`;
  });

  koaServer.get('/waitForDomStateTab2', ctx => {
    ctx.body = `<body><h2>Here</h2>
<div id="wait-for-me" style="display: none">Not here yet</div>
<script>
setTimeout(() => {
  document.querySelector('#wait-for-me').style.display = 'block';
}, 100)
</script>
</body>`;
  });

  await hero.goto(`${koaServer.baseUrl}/waitForDomStateTabs`);
  await hero.querySelector('a').$click();
  const newTab = await hero.waitForNewTab();
  await newTab.focus();

  const domState = {
    all(assert) {
      assert(hero.url, x => x.includes('/waitForDomStateTab2'));
      assert(hero.querySelector('h2').$isVisible);
      assert(hero.querySelector('#wait-for-me').$isVisible);
    },
  };
  await expect(hero.activeTab.waitForState(domState)).resolves.toBeUndefined();
  await expect(hero.activeTab.validateState(domState)).resolves.toBe(true);
});

test('can test for state across redirects', async () => {
  koaServer.get('/waitForDomStateRedirect1', ctx => {
    ctx.body = `<body>
      <a href="/waitForDomStateRedirect2">Click Me</a>
    </body>`;
  });
  koaServer.get('/waitForDomStateRedirect2', ctx => {
    ctx.redirect('/waitForDomStateRedirect3');
  });

  koaServer.get('/waitForDomStateRedirect3', ctx => {
    ctx.body = `<head>
        <title>HTML Meta Tag</title>
        <meta http-equiv = "refresh" content = "0; url = ${koaServer.baseUrl}/waitForDomStateRedirect4" />
     </head>
     <body>
        <p>This page won't be here long.</p>
     </body>`;
  });

  koaServer.get('/waitForDomStateRedirect4', ctx => {
    ctx.redirect('/waitForDomStateRedirectLast');
  });
  koaServer.get('/waitForDomStateRedirectLast', ctx => {
    ctx.body = `<body><h1 data-final="true">Hi</h1></body>`;
  });
  const hero = await openBrowser('/waitForDomStateRedirect1');

  await hero.click(hero.document.querySelector('a'));

  const state = new DomState({
    all(assert) {
      assert(hero.url, x => x.includes('waitForDomStateRedirectLast'));
      assert(hero.isPaintingStable);
      assert(hero.document.querySelector('h1').dataset, x => x.final === 'true');
    },
  });
  await expect(hero.activeTab.waitForState(state)).resolves.toBeUndefined();
  await expect(hero.activeTab.validateState(state)).resolves.toBe(true);
});

test('surfaces errors in assertions', async () => {
  koaServer.get('/waitForDomStateError', ctx => {
    ctx.body = `<body><h1>Hi</h1></body>`;
  });
  const hero = await openBrowser('/waitForDomStateError');
  const domState = {
    all(assert) {
      // @ts-ignore
      assert(hero.document.querySelector('h1').getAttribute('id'), x => test.includes(x));
    },
  };

  await expect(hero.activeTab.waitForState(domState)).rejects.toThrow(
    'test.includes is not a function',
  );

  await expect(hero.activeTab.validateState(domState)).rejects.toThrow(
    'test.includes is not a function',
  );
});

test('can wait for resources', async () => {
  koaServer.get('/waitForDomStateResource', ctx => {
    ctx.body = `<body><h1>Hi</h1></body>`;
  });
  const hero = await openBrowser('/waitForDomStateResource');
  const domState = {
    all(assert) {
      assert(hero.findResource({ httpRequest: { statusCode: 200 } }));
    },
  };

  await expect(hero.activeTab.waitForState(domState)).resolves.toBeUndefined();
});

test('surfaces errors in query selectors that are invalid (vs simply not there)', async () => {
  koaServer.get('/waitForDomStateSelectorError', ctx => {
    ctx.body = `<body><h1>Hi</h1></body>`;
  });
  const hero = await openBrowser('/waitForDomStateSelectorError');

  const state = new DomState({
    all(assert) {
      // @ts-ignore
      assert(hero.document.querySelector('h1[id@1]').getAttribute('id'), '1');
    },
  });

  await expect(hero.activeTab.waitForState(state)).rejects.toThrow('not a valid selector');
});

async function openBrowser(path: string) {
  const hero = new Hero();
  Helpers.needsClosing.push(hero);
  await hero.goto(`${koaServer.baseUrl}${path}`);
  await hero.waitForPaintingStable();
  return hero;
}
