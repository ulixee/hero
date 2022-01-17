import { Helpers } from '@ulixee/hero-testing';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import Hero, { ConnectionToCore } from '../index';

let koaServer: ITestKoaServer;
const sendRequestSpy = jest.spyOn(ConnectionToCore.prototype, 'sendRequest');
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
    await test1Element.$extractLater('a');
    await test1Element.nextElementSibling.$extractLater('b');

    await hero.importFragments(await hero.sessionId);

    expect(hero.getFragment('a')).toBeTruthy();
    await expect(hero.getFragment('a').innerText).resolves.toBe('test 1');

    expect(hero.getFragment('b')).toBeTruthy();
    await expect(hero.getFragment('b').childElementCount).resolves.toBe(1);
    await expect(hero.getFragment('b').querySelectorAll('li').length).resolves.toBe(1);
  });

  it('can prefetch fragment commands', async () => {
    koaServer.get('/fragment-learn', ctx => {
      ctx.body = `
        <body>
          <div class="test1">test 1</div>
          <div class="test2" ready="true">test 2</div>
        </body>
      `;
    });
    {
      // run 1
      const hero = await openBrowser(`/fragment-learn`);
      const test1Element = await hero.document.querySelector('.test1');
      await test1Element.$extractLater('test1');
      await test1Element.nextElementSibling.$extractLater('test2');

      sendRequestSpy.mockClear();
      await hero.importFragments(await hero.sessionId);

      expect(hero.getFragment('test1')).toBeTruthy();
      await expect(hero.getFragment('test1').innerText).resolves.toBe('test 1');
      await expect(hero.getFragment('test1').hasAttribute('ready')).resolves.toBe(false);

      expect(hero.getFragment('test2')).toBeTruthy();
      await expect(hero.getFragment('test2').innerText).resolves.toBe('test 2');
      await expect(hero.getFragment('test2').hasAttribute('ready')).resolves.toBe(true);
      expect(sendRequestSpy).toHaveBeenCalledTimes(5);
      // need to close to record jspaths
      await hero.close();
    }
    {
      // run 1
      const hero = await openBrowser(`/fragment-learn`);
      const test1Element = await hero.document.querySelector('.test1');
      await test1Element.$extractLater('test1');
      await test1Element.nextElementSibling.$extractLater('test2');

      sendRequestSpy.mockClear();
      await hero.importFragments(await hero.sessionId);

      expect(hero.getFragment('test1')).toBeTruthy();
      await expect(hero.getFragment('test1').innerText).resolves.toBe('test 1');
      await expect(hero.getFragment('test1').hasAttribute('ready')).resolves.toBe(false);

      expect(hero.getFragment('test2')).toBeTruthy();
      await expect(hero.getFragment('test2').innerText).resolves.toBe('test 2');
      await expect(hero.getFragment('test2').hasAttribute('ready')).resolves.toBe(true);
      expect(sendRequestSpy).toHaveBeenCalledTimes(1);
    }
  });
});

async function openBrowser(path: string) {
  const hero = new Hero();
  Helpers.needsClosing.push(hero);
  await hero.goto(`${koaServer.baseUrl}${path}`);
  await hero.waitForPaintingStable();
  return hero;
}
