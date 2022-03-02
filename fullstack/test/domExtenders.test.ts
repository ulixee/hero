import { Helpers } from '@ulixee/hero-testing';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import Hero from '../index';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic DomExtender tests', () => {
  it('can run xpathSelector', async () => {
    koaServer.get('/domextender-xpath', ctx => {
      ctx.body = `
        <body>
          <h2>here</h2>
        </body>
      `;
    });
    const hero = await openBrowser(`/domextender-xpath`);

    await expect(hero.xpathSelector('//h2').textContent).resolves.toBe('here');
  });

  it('can run xpathSelectorAll', async () => {
    koaServer.get('/domextender-xpath-all', ctx => {
      ctx.body = `
        <body>
          <h2>here 1</h2>
          <h2>here 2</h2>
          <h2>here 3</h2>
        </body>
      `;
    });
    const hero = await openBrowser(`/domextender-xpath-all`);

    const xpathAll = await hero.xpathSelectorAll('//h2');

    let counter = 0;
    for (const entry of xpathAll) {
      counter += 1;
      await expect(entry.textContent).resolves.toBe(`here ${counter}`);
    }
  });

  it('can find the focused field', async () => {
    koaServer.get('/domextender-focused', ctx => {
      ctx.body = `<body><input id="field" type="text"/></body>`;
    });
    const hero = await openBrowser(`/domextender-focused`);
    await expect(hero.querySelector('#field').$hasFocus).resolves.toBe(false);
    await expect(hero.querySelector('#field').$click()).resolves.toBe(undefined);
    await expect(hero.querySelector('#field').$hasFocus).resolves.toBe(true);
  });

  it('can clear a field', async () => {
    koaServer.get('/domextender-clear', ctx => {
      ctx.body = `<body><input id="field" type="text" value="1234Test"/></body>`;
    });
    const hero = await openBrowser(`/domextender-clear`);
    await expect(hero.querySelector('#field').$clearInputText()).resolves.toBe(undefined);
    await expect(hero.querySelector('#field').value).resolves.toBe('');
  });
});

async function openBrowser(path: string) {
  const hero = new Hero();
  Helpers.needsClosing.push(hero);
  await hero.goto(`${koaServer.baseUrl}${path}`);
  await hero.waitForPaintingStable();
  return hero;
}
