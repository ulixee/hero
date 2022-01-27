import { Helpers } from '@ulixee/hero-testing';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import Hero from '../index';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Fragment tests', () => {
  it('can create fragments', async () => {
    koaServer.get('/fragment-basic', ctx => {
      ctx.body = `
        <body>
          <div class="test1">test 1</div>
          <div class="test2">
            <ul><li>Test 2</li></ul>
          </div>
        </body>
      `;
    });
    const hero = await openBrowser(`/fragment-basic`);
    const test1Element = await hero.document.querySelector('.test1');
    await test1Element.$collect('a');
    await test1Element.nextElementSibling.$collect('b');

    const fragmentsA = await hero.getCollectedFragments(hero.sessionId, 'a');
    expect(fragmentsA).toHaveLength(1);
    expect(fragmentsA[0].outerHTML).toBe('<div class="test1">test 1</div>');

    const fragmentsB = await hero.getCollectedFragments(hero.sessionId, 'b');
    expect(fragmentsB[0].outerHTML).toBe(`<div class="test2">
            <ul><li>Test 2</li></ul>
          </div>`);
  });

  it('can save fragment children', async () => {
    koaServer.get('/fragment-list', ctx => {
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
    const hero = await openBrowser(`/fragment-list`);
    await hero.document.querySelectorAll('.valid').$collect('valid');

    const valid = await hero.getCollectedFragments(hero.sessionId, 'valid');
    expect(valid).toHaveLength(3);
    expect(valid[0].outerHTML).toBe('<li class="valid">Test 1</li>');
    expect(valid[1].outerHTML).toBe('<li class="valid">Test 4</li>');
    expect(valid[2].outerHTML).toBe('<li class="valid">Test 5</li>');
  });
});

async function openBrowser(path: string) {
  const hero = new Hero();
  Helpers.needsClosing.push(hero);
  await hero.goto(`${koaServer.baseUrl}${path}`);
  await hero.waitForPaintingStable();
  return hero;
}
