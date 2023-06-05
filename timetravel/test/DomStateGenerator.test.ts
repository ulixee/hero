import { createSession, ITestKoaServer } from '@ulixee/hero-testing/helpers';
import { Helpers } from '@ulixee/hero-testing';
import { LoadStatus } from '@ulixee/unblocked-specification/agent/browser/Location';
import Core from '@ulixee/hero-core';
import DomStateGenerator from '../lib/DomStateGenerator';
import DomStateAssertions from '../lib/DomStateAssertions';

let koaServer: ITestKoaServer;
let core: Core;
beforeAll(async () => {
  core = await Core.start();
  koaServer = await Helpers.runKoaServer(true);
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('domStateGenerator', () => {
  test('extracts common asserts only from the given time range', async () => {
    koaServer.get('/domStateGeneratorRange1', ctx => {
      ctx.body = `
  <body>
    <h1>Title 1</h1>
    <div id="div1">This is page 1</div>
    <ul>
      <li class="li">1</li>
    </ul>
    <script>
    window.add = function () {
      const li = document.createElement('li');
      li.classList.add('li');
      li.textContent = 'add';
      document.querySelector('ul').append(li);
    }
    </script>
  </body>
      `;
    });

    const domStateGenerator = new DomStateGenerator('1', core);
    async function run() {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2e3));
      const { tab, session } = await createSession();
      await tab.goto(`${koaServer.baseUrl}/domStateGeneratorRange1`);
      await tab.waitForLoad(LoadStatus.PaintingStable);
      await tab.flushDomChanges();
      const startTime = Date.now();
      await tab.getJsValue(`add()`);
      await tab.getJsValue(`add()`);
      await session.close();
      domStateGenerator.addSession(session.db, tab.id, [startTime, Date.now()]);
    }
    await Promise.all([run(), run(), run()]);

    await domStateGenerator.evaluate();
    const state = domStateGenerator;
    expect(state).toBeTruthy();
    expect(state.sessionsById.size).toBe(3);
    expect(Object.keys(state.assertsByFrameId)).toHaveLength(1);
    const asserts = Object.values(state.assertsByFrameId[1]);
    expect(
      asserts.filter(x => {
        return (
          x.args[0].includes('TITLE') || x.args[0].includes('DIV') || x.args[0].endsWith('/UL)')
        );
      }),
    ).toHaveLength(0);

    expect(asserts.find(x => x.args[0] === 'count(/HTML/BODY/UL/LI)').result).toBe(3);
  }, 20e3);

  test('can find removed elements', async () => {
    koaServer.get('/domStateRemove', ctx => {
      ctx.body = `
  <body>
    <h1>Remove Page</h1>
    <ul>
      <li class="li">1</li>
      <li class="li">2</li>
      <li class="li">3</li>
    </ul>

    <script>
    window.remove = function () {
      document.querySelector('li').remove()
    }
    </script>
  </body>
      `;
    });

    const domStateGenerator = new DomStateGenerator('id', core);
    async function run() {
      // just give some time randomization
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2e3));
      const { tab, session } = await createSession();
      await tab.goto(`${koaServer.baseUrl}/domStateRemove`);
      await tab.waitForLoad(LoadStatus.PaintingStable);
      await tab.flushDomChanges();
      const startTime = Date.now();
      await tab.getJsValue(`remove()`);
      await tab.getJsValue(`remove()`);
      await session.close();
      domStateGenerator.addSession(session.db, tab.id, [startTime, Date.now()]);
    }

    await Promise.all([run(), run(), run(), run()]);

    await domStateGenerator.evaluate();

    const states1 = domStateGenerator.assertsByFrameId[1];

    const liKey = DomStateAssertions.generateKey('xpath', ['count(/HTML/BODY/UL/LI)']);

    expect(states1[liKey].result).toBe(1);
  }, 20e3);

  test('can find attribute changes', async () => {
    koaServer.get('/domStateAttr', ctx => {
      ctx.body = `
  <body>
    <h1>Attributes Page</h1>
    <div class="slider" style="width:0;">&nbsp;</div>

    <script>
    window.tick = function (pct) {
      document.querySelector('.slider').style.width = pct + '%';
    }
    </script>
  </body>
      `;
    });

    const domStateGenerator = new DomStateGenerator('id', core);
    async function run() {
      // just give some time randomization
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2e3));
      const { tab, session } = await createSession();
      await tab.goto(`${koaServer.baseUrl}/domStateAttr`);
      await tab.waitForLoad(LoadStatus.PaintingStable);
      await tab.flushDomChanges();
      const startTime = Date.now();
      await tab.getJsValue(`tick(50)`);
      await tab.flushDomChanges();
      await session.close();
      domStateGenerator.addSession(session.db, tab.id, [startTime, Date.now()]);
    }

    await Promise.all([run(), run(), run(), run()]);

    await domStateGenerator.evaluate();

    const asserts = domStateGenerator.assertsByFrameId[1];

    const sliderKey50 = DomStateAssertions.generateKey('xpath', [
      'count(/HTML/BODY/DIV[@class="slider"][@style="width: 50%;"])',
    ]);
    expect(asserts[sliderKey50].result).toBe(1);
  }, 20e3);

  test('can track storage changes', async () => {
    koaServer.get('/storage', ctx => {
      ctx.set('set-cookie', `test=${ctx.query.state}`);
      ctx.body = `
  <body>
    <h1>Storage Page</h1>

    <script>
    window.storage = function () {
      localStorage.setItem('test', '1');
      localStorage.setItem('test2', '2');
      localStorage.removeItem('test2');
      const openDBRequest = indexedDB.open('db1', 1);
      openDBRequest.onupgradeneeded = function(ev) {
        const db = ev.target.result;
        const store1 = db.createObjectStore('store1', {
          keyPath: 'id',
          autoIncrement: false
        });
        store1.transaction.oncomplete = function() {
          const insertStore = db
            .transaction('store1', 'readwrite')
            .objectStore('store1');
          insertStore.add({ id: 1, child: { name: 'Richard', age: new Date() }});
          insertStore.add({ id: 2, child: { name: 'Jill' } });
          insertStore.transaction.oncomplete = () => {
            document.body.classList.add('db-ready');
          }
        };
      }
    }
    </script>
  </body>
      `;
    });

    const domStateGenerator = new DomStateGenerator('id', core);
    async function run() {
      // just give some time randomization
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2e3));
      const { tab, session } = await createSession();
      const startTime = Date.now();
      await tab.goto(`${koaServer.baseUrl}/storage?state=cookieValue`);
      await tab.waitForLoad(LoadStatus.PaintingStable);
      await tab.getJsValue(`storage()`);
      await Helpers.waitForElement(
        ['document', ['querySelector', '.db-ready']],
        tab.mainFrameEnvironment,
      );
      await tab.flushDomChanges();
      await session.close();

      domStateGenerator.addSession(session.db, tab.id, [startTime, Date.now()]);
    }
    await Promise.all([run(), run(), run(), run()]);

    await domStateGenerator.evaluate();

    const asserts = domStateGenerator.assertsByFrameId[1];
    expect(
      Object.values(asserts).filter(
        x => x.args?.length && x.args[0].type === 'cookie' && x.result === 'cookieValue',
      ),
    ).toHaveLength(1);
    expect(
      Object.values(asserts).filter(x => x.args?.length && x.args[0].type === 'indexedDB').length,
    ).toBeGreaterThanOrEqual(1);

    expect(
      Object.values(asserts).filter(x => x.args?.length && x.args[0].type === 'localStorage')
        .length,
    ).toBeGreaterThanOrEqual(1);
  }, 20e3);

  test('can handle redirects', async () => {
    koaServer.get('/domStateRedirect', ctx => {
      ctx.body = `
<head><meta http-equiv = "refresh" content = "0; url = ${koaServer.baseUrl}/domStateRedirectsEnd1"</head>
<body><h1>Redirect Page</h1></body>`;
    });

    koaServer.get('/domStateRedirectsEnd1', ctx => {
      ctx.body = `<body><h1>Page 1</h1></body>`;
    });

    const domStateGenerator = new DomStateGenerator('id', core);
    async function run() {
      // just give some time randomization
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2e3));
      const { tab, session } = await createSession();
      const goto = tab.goto(`${koaServer.baseUrl}/domStateRedirect`);
      await goto;
      await tab.waitForLocation('change');

      await tab.waitForLoad(LoadStatus.HttpResponded);
      const startTime = tab.navigations.top.statusChanges.get('HttpResponded');
      await tab.waitForLoad(LoadStatus.PaintingStable);

      await session.close();
      domStateGenerator.addSession(session.db, tab.id, [startTime, Date.now()]);
    }

    await Promise.all([run(), run(), run(), run()]);

    await domStateGenerator.evaluate();

    const asserts = domStateGenerator.assertsByFrameId[1];
    const h1Key = DomStateAssertions.generateKey('xpath', ['string(/HTML/BODY/H1)']);
    expect(asserts[h1Key]).toBeTruthy();
    expect(asserts[h1Key].result).toBe('Page 1');
    expect(
      asserts[DomStateAssertions.generateKey('xpath', ['count(//H1[text()="Page 1"])'])].result,
    ).toBe(1);
  }, 20e3);

  test('can find resources', async () => {
    koaServer.get('/domStateResources', ctx => {
      const xhrParam = ctx.query.state;

      ctx.body = `
<body>
<h1>Resources Page</h1>
<script>
  fetch('/xhr?param=${xhrParam}')
    .then(x => x.text())
    .then(text => {
      const div = document.createElement('div');
      div.textContent = text;
      div.id="ready";
      document.body.appendChild(div)
    })
</script>
</body>`;
    });

    koaServer.get('/xhr', ctx => {
      ctx.body = `ok ${ctx.query.param}`;
    });

    const domStateGenerator = new DomStateGenerator('id', core);
    async function run() {
      // just give some time randomization
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2e3));
      const { tab, session } = await createSession();
      await tab.goto(`${koaServer.baseUrl}/domStateResources?state=key`);
      const startTime = Date.now();

      await tab.waitForLoad(LoadStatus.PaintingStable);
      await Helpers.waitForElement(
        ['document', ['querySelector', '#ready']],
        tab.mainFrameEnvironment,
      );

      await session.close();
      domStateGenerator.addSession(session.db, tab.id, [startTime, Date.now()]);
    }

    await Promise.all([run(), run(), run(), run()]);

    await domStateGenerator.evaluate();

    const states1 = domStateGenerator.assertsByFrameId[1];

    expect(Object.values(states1).filter(x => x.type === 'resource')).toHaveLength(1);
  }, 20e3);

  test('can export and re-import states', async () => {
    let changeTitle = false;
    koaServer.get('/restorePage', ctx => {
      if (changeTitle) {
        ctx.body = `<body><h2>Title 3</h2></body>`;
      } else {
        ctx.body = `<body><h2>Title 2</h2></body>`;
      }
    });

    async function run(domStateGenerator: DomStateGenerator) {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2e3));
      const { tab, session } = await createSession();
      const startTime = Date.now();
      await tab.goto(`${koaServer.baseUrl}/restorePage`);
      await tab.waitForLoad('PaintingStable');
      await session.close();
      domStateGenerator.addSession(session.db, tab.id, [startTime, Date.now()]);
    }

    const psg1 = new DomStateGenerator('id', core);

    await Promise.all([run(psg1), run(psg1), run(psg1), run(psg1)]);

    await psg1.evaluate();

    const state1 = psg1.export();
    expect(state1).toBeTruthy();
    expect(state1.assertions.length).toBeGreaterThanOrEqual(3);
    expect(state1.sessions).toHaveLength(4);

    const psg2 = new DomStateGenerator('id', core);
    await psg2.import(state1);

    changeTitle = true;
    // add sessions to the second round
    await Promise.all([run(psg2), run(psg2)]);
    await psg2.evaluate();

    const state2 = psg2.export();

    expect(state2.sessions).toHaveLength(6);
    // should take into account the new change
    expect(state1.assertions).not.toEqual(state2.assertions);
    expect(state2.assertions.filter(x => x.toString().includes('Title 2'))).toHaveLength(0);
  }, 30e3);
});
