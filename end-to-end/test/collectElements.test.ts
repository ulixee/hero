import { Helpers, Hero } from '@ulixee/hero-testing';
import { InternalPropertiesSymbol } from '@ulixee/hero/lib/internal';
import { awaitedPathState } from '@ulixee/hero/lib/DomExtender';
import { ISuperElement, ISuperNodeList } from 'awaited-dom/base/interfaces/super';
import CoreSession from '@ulixee/hero/lib/CoreSession';

let koaServer: Helpers.ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic collect Element tests', () => {
  it('can extract elements', async () => {
    koaServer.get('/element-basic', ctx => {
      ctx.body = `
        <body>
          <div class="test1">test 1</div>
          <div class="test2">
            <ul><li>Test 2</li></ul>
          </div>
        </body>
      `;
    });
    const [hero, coreSession] = await openBrowser(`/element-basic`);
    const sessionId = await hero.sessionId;
    const test1Element = await hero.document.querySelector('.test1');
    await collectElement(test1Element, 'a');
    await collectElement(test1Element.nextElementSibling, 'b');

    const elementsA = await coreSession.getCollectedElements(sessionId, 'a');
    expect(elementsA).toHaveLength(1);
    expect(elementsA[0].outerHTML).toBe('<div class="test1">test 1</div>');

    const elementsB = await coreSession.getCollectedElements(sessionId, 'b');
    expect(elementsB[0].outerHTML).toBe(`<div class="test2">
            <ul><li>Test 2</li></ul>
          </div>`);
  });

  it('can extract selectorAll lists', async () => {
    koaServer.get('/element-list', ctx => {
      ctx.body = `
        <body>

            <ul>
              <li class="valid">Test 1</li>
              <li class="invalid">Test 2</li>
              <li class="invalid">Test 3</li>
              <li class="valid">Test 4</li>
              <li class="valid">Test 5</li>
            </ul>
        </body>
      `;
    });
    const [hero, coreSession] = await openBrowser(`/element-list`);
    const sessionId = await hero.sessionId;
    await collectElement(hero.document.querySelectorAll('.valid'), 'valid');

    const valid = await coreSession.getCollectedElements(sessionId, 'valid');
    expect(valid).toHaveLength(3);
    expect(valid[0].outerHTML).toBe('<li class="valid">Test 1</li>');
    expect(valid[1].outerHTML).toBe('<li class="valid">Test 4</li>');
    expect(valid[2].outerHTML).toBe('<li class="valid">Test 5</li>');
  });

  it('can extract elements across timestamps', async () => {
    koaServer.get('/growing-list', ctx => {
      ctx.body = `
        <body>

            <ul>
            </ul>
            <script>
            
            function add(text) {
              const li = document.createElement('LI');
              li.textContent = text;
              document.querySelector('ul').appendChild(li);  
            }
</script>
        </body>
      `;
    });
    const [hero, coreSession] = await openBrowser(`/growing-list`);
    const sessionId = await hero.sessionId;

    for (let i = 0; i < 25; i += 1) {
      await hero.getJsValue(`add('Text ${i}')`);
      await collectElement(hero.document.querySelector('li:last-child'), 'item' + i);
    }
    for (let i = 0; i < 25; i += 1) {
      const valid = await coreSession.getCollectedElements(sessionId, 'item' + i);
      expect(valid).toHaveLength(1);
      expect(valid[0].outerHTML).toBe(`<li>Text ${i}</li>`);
    }
  });

  test('can collect elements on a second tab', async () => {
    const [hero, coreSession] = await openBrowser('/');
    koaServer.get('/collectTab', ctx => {
      ctx.body = `<body><h1>Hi</h1>
<a target="_blank" href="/collectTab2">Click Me</a>
</body>`;
    });

    koaServer.get('/collectTab2', ctx => {
      ctx.body = `<body><h2>Here</h2>
<ul>
<li class="item">1</li>
<li class="item">2</li>
<li class="item">3</li>
</ul>
</body>`;
    });

    await hero.goto(`${koaServer.baseUrl}/collectTab`);
    await hero.querySelector('a').$click();
    const newTab = await hero.waitForNewTab();
    await newTab.focus();
    await newTab.waitForLoad('DomContentLoaded')

    await collectElement(hero.document.querySelectorAll('.item'), 'items');
    await expect(coreSession.getCollectedElements(null, 'items')).resolves.toHaveLength(3);
  });
});

async function openBrowser(path: string): Promise<[Hero, CoreSession]> {
  const hero = new Hero();
  const coreSession = await hero[InternalPropertiesSymbol].coreSessionPromise;
  Helpers.needsClosing.push(hero);
  await hero.goto(`${koaServer.baseUrl}${path}`);
  await hero.waitForPaintingStable();
  return [hero, coreSession];
}

async function collectElement(
  element: ISuperElement | ISuperNodeList,
  name: string,
): Promise<void> {
  const { awaitedPath, awaitedOptions } = awaitedPathState.getState(element);
  const coreFrame = await awaitedOptions.coreFrame;
  await coreFrame.collectElement(name, awaitedPath.toJSON());
}
