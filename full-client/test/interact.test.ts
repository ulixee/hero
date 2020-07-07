import { Helpers } from '@secret-agent/shared-testing';
import SecretAgent from '../index';
import { GlobalPool } from '@secret-agent/core';
import { KeyboardKeys } from '@secret-agent/core-interfaces/IKeyboardLayoutUS';
import { Command } from '@secret-agent/client/interfaces/IInteractions';

beforeAll(async () => {
  GlobalPool.maxActiveSessionCount = 3;
}, 60000);

describe('basic Interact tests', () => {
  it('should be able to go to a second page', async () => {
    const text = "hello, is it me you're looking for?";
    const onPost = jest.fn().mockImplementation(body => {
      expect(body).toBe(text);
    });
    const httpServer = await Helpers.runHttpServer('', onPost);
    const url = httpServer.url;

    const browser = await SecretAgent.createBrowser();
    Helpers.needsClosing.push(browser);

    await browser.goto(`${url}page1`);
    await browser.document.querySelector('#input').focus();
    await browser.waitForMillis(3000);
    await browser.interact({ type: text });
    await browser.waitForMillis(2000);
    await browser.click(browser.document.querySelector('#submit-button'));
    await browser.waitForLocation('change');
    const html = await browser.document.documentElement.outerHTML;
    expect(html).toBe(`<html><head></head><body>${text}</body></html>`);
    expect(onPost).toHaveBeenCalledTimes(1);

    await browser.close();
    await httpServer.close();
  }, 20e3);

  it('should be able to get multiple entries out of the pool', async () => {
    const httpServer = await Helpers.runHttpServer('ulixee=test1');
    expect(GlobalPool.maxActiveSessionCount).toBe(3);
    expect(GlobalPool.activeSessionCount).toBe(0);

    const browser1 = await SecretAgent.createBrowser();
    Helpers.needsClosing.push(browser1);
    {
      // #1
      await browser1.goto(httpServer.url);
      expect(GlobalPool.activeSessionCount).toBe(1);
    }

    const browser2 = await SecretAgent.createBrowser();
    Helpers.needsClosing.push(browser2);
    {
      // #2
      await browser2.goto(httpServer.url);
      expect(GlobalPool.activeSessionCount).toBe(2);
    }

    const browser3 = await SecretAgent.createBrowser();
    Helpers.needsClosing.push(browser3);
    {
      // #3
      await browser3.goto(httpServer.url);
      expect(GlobalPool.activeSessionCount).toBe(3);
    }

    {
      // #4
      const browser4Promise = SecretAgent.createBrowser();
      expect(GlobalPool.activeSessionCount).toBe(3);
      await browser1.close();
      const browser4 = await browser4Promise;
      Helpers.needsClosing.push(browser4);

      // should give straight to this waiting promise
      expect(GlobalPool.activeSessionCount).toBe(3);
      await browser4.goto(httpServer.url);
      await browser4.close();
      expect(GlobalPool.activeSessionCount).toBe(2);
    }

    await browser1.close();
    await browser2.close();
    await browser3.close();
    expect(GlobalPool.activeSessionCount).toBe(0);
    await httpServer.close();
  }, 30e3);

  it('should clean up cookies between runs', async () => {
    const browser1 = await SecretAgent.createBrowser();
    Helpers.needsClosing.push(browser1);
    {
      const httpServer = await Helpers.runHttpServer('ulixee=test1');
      const url = httpServer.url;
      await browser1.goto(url);

      const cookies = await browser1.cookies;
      expect(cookies[0].name).toBe('ulixee');
      expect(cookies[0].value).toBe('test1');

      await httpServer.close();
    }

    {
      const httpServer = await Helpers.runHttpServer('ulixee2=test2');
      const url = httpServer.url;
      await browser1.goto(url);

      const cookies = await browser1.cookies;
      expect(cookies).toHaveLength(2);
      expect(cookies.find(x => x.name === 'ulixee').value).toBe('test1');
      expect(cookies.find(x => x.name === 'ulixee2').value).toBe('test2');

      await httpServer.close();
    }

    {
      // should be able to get a second agent out of the pool
      const browser2 = await SecretAgent.createBrowser();
      Helpers.needsClosing.push(browser2);
      const httpServer = await Helpers.runHttpServer('ulixee3=test3');
      const url = httpServer.url;
      await browser2.goto(url);

      const cookies = await browser2.cookies;
      expect(cookies).toHaveLength(1);
      expect(cookies[0].name).toBe('ulixee3');
      expect(cookies[0].value).toBe('test3');

      await httpServer.close();
      await browser2.close();
    }

    await browser1.close();
  }, 20000);

  it('should be able to combine a waitForElementVisible and a click', async () => {
    const koaServer = await Helpers.runKoaServer();
    koaServer.get('/page1', ctx => {
      ctx.body = `
        <body>
          <a href="/finish">Click Me</a>
           <script>
            setTimeout(() => {
              document.querySelector('a').classList.add('ready');
            }, 200);
          </script>
        </body>
      `;
    });
    koaServer.get('/finish', ctx => (ctx.body = `Finished!`));
    const browser = await SecretAgent.createBrowser();
    Helpers.needsClosing.push(browser);
    await browser.goto(`${koaServer.baseUrl}/page1`);
    await browser.waitForAllContentLoaded();
    const readyLink = browser.document.querySelector('a.ready');
    await browser.interact({ click: readyLink, waitForElementVisible: readyLink });
    await browser.waitForLocation('change');
    const finalUrl = await browser.url;
    expect(finalUrl).toBe(`${koaServer.baseUrl}/finish`);

    await browser.close();
    await koaServer.close();
  });

  it('should be able to type various combinations of characters', async () => {
    const koaServer = await Helpers.runKoaServer();
    koaServer.get('/keys', ctx => {
      ctx.body = `
        <body>
          <textarea></textarea>
        </body>
      `;
    });
    const browser = await SecretAgent.createBrowser();
    Helpers.needsClosing.push(browser);
    await browser.goto(`${koaServer.baseUrl}/keys`);
    await browser.waitForAllContentLoaded();
    const textarea = browser.document.querySelector('textarea');
    await browser.click(textarea);
    await browser.type('Test!');
    expect(await textarea.value).toBe('Test!');
    await browser.type(KeyboardKeys.Backspace);
    expect(await textarea.value).toBe('Test');

    await browser.interact(
      { [Command.keyDown]: KeyboardKeys.Shift },
      { [Command.keyPress]: KeyboardKeys.ArrowLeft },
      { [Command.keyPress]: KeyboardKeys.ArrowLeft },
      { [Command.keyPress]: KeyboardKeys.ArrowLeft },
      { [Command.keyUp]: KeyboardKeys.Shift },
      { [Command.keyPress]: KeyboardKeys.Delete },
    );

    expect(await textarea.value).toBe('T');
    await browser.close();
  });
});

afterEach(async () => await Helpers.closeAll(), 20000);
afterAll(async () => {
  await SecretAgent.shutdown();
}, 30000);
