import { Helpers } from '@secret-agent/testing';
import { GlobalPool } from '@secret-agent/core';
import { KeyboardKeys } from '@secret-agent/core-interfaces/IKeyboardLayoutUS';
import { Command } from '@secret-agent/client/interfaces/IInteractions';
import { ITestKoaServer } from '@secret-agent/testing/helpers';
import { Handler } from '../index';

let koaServer: ITestKoaServer;
let handler: Handler;
beforeAll(async () => {
  handler = new Handler();
  Helpers.onClose(() => handler.close(), true);
  koaServer = await Helpers.runKoaServer(true);
  GlobalPool.maxConcurrentAgentsCount = 3;
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Interact tests', () => {
  it('should be able to go to a second page', async () => {
    const text = "hello, is it me you're looking for?";
    const onPost = jest.fn().mockImplementation(body => {
      expect(body).toBe(text);
    });
    const httpServer = await Helpers.runHttpServer({ onPost });
    const url = httpServer.url;

    const agent = await handler.createAgent();
    Helpers.needsClosing.push(agent);

    await agent.goto(`${url}page1`);
    await agent.document.querySelector('#input').focus();
    await agent.waitForMillis(50);
    await agent.interact({ type: text });
    await agent.waitForMillis(20);
    await agent.click(agent.document.querySelector('#submit-button'));
    await agent.waitForLocation('change');
    const html = await agent.document.documentElement.outerHTML;
    expect(html).toBe(`<html><head></head><body>${text}</body></html>`);
    expect(onPost).toHaveBeenCalledTimes(1);

    await agent.close();
    await httpServer.close();
  }, 20e3);

  it('should be able to get multiple entries out of the pool', async () => {
    const httpServer = await Helpers.runHttpServer({
      addToResponse: response => {
        response.setHeader('Set-Cookie', 'ulixee=test1');
      },
    });
    expect(GlobalPool.maxConcurrentAgentsCount).toBe(3);
    expect(GlobalPool.activeSessionCount).toBe(0);

    const browser1 = await handler.createAgent();
    Helpers.needsClosing.push(browser1);
    // #1
    await browser1.goto(httpServer.url);
    expect(GlobalPool.activeSessionCount).toBe(1);

    const browser2 = await handler.createAgent();
    Helpers.needsClosing.push(browser2);

    // #2
    await browser2.goto(httpServer.url);
    expect(GlobalPool.activeSessionCount).toBe(2);

    const browser3 = await handler.createAgent();
    Helpers.needsClosing.push(browser3);

    // #3
    await browser3.goto(httpServer.url);
    expect(GlobalPool.activeSessionCount).toBe(3);

    // #4
    const browser4Promise = handler.createAgent();
    expect(GlobalPool.activeSessionCount).toBe(3);
    await browser1.close();
    const browser4 = await browser4Promise;
    Helpers.needsClosing.push(browser4);

    // should give straight to this waiting promise
    expect(GlobalPool.activeSessionCount).toBe(3);
    await browser4.goto(httpServer.url);
    await browser4.close();
    expect(GlobalPool.activeSessionCount).toBe(2);

    await Promise.all([browser1.close(), browser2.close(), browser3.close()]);
    expect(GlobalPool.activeSessionCount).toBe(0);
    await httpServer.close();
  }, 15e3);

  it('should clean up cookies between runs', async () => {
    const agent1 = await handler.createAgent();
    let setCookieValue = 'ulixee=test1';
    const httpServer = await Helpers.runHttpServer({
      addToResponse: response => {
        response.setHeader('Set-Cookie', setCookieValue);
      },
    });
    const url = httpServer.url;

    Helpers.needsClosing.push(agent1);
    {
      await agent1.goto(url);

      const cookie = await agent1.activeTab.cookieStorage.getItem('ulixee');
      expect(cookie.value).toBe('test1');
    }

    {
      setCookieValue = 'ulixee2=test2';
      await agent1.goto(url);

      const cookieStorage = await agent1.activeTab.cookieStorage;
      expect(await cookieStorage.length).toBe(2);
      const cookie1 = await cookieStorage.getItem('ulixee');
      expect(cookie1.value).toBe('test1');
      const cookie2 = await cookieStorage.getItem('ulixee2');
      expect(cookie2.value).toBe('test2');
    }

    {
      setCookieValue = 'ulixee3=test3';
      // should be able to get a second agent out of the pool
      const agent2 = await handler.createAgent();
      Helpers.needsClosing.push(agent2);
      await agent2.goto(url);

      const cookieStorage = await agent2.activeTab.cookieStorage;
      expect(await cookieStorage.length).toBe(1);
      const cookie = await cookieStorage.getItem('ulixee3');
      expect(cookie.value).toBe('test3');

      await agent2.close();
    }

    await agent1.close();
  }, 20e3);

  it('should be able to combine a waitForElementVisible and a click', async () => {
    koaServer.get('/waitTest', ctx => {
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
    const agent = await handler.createAgent();
    Helpers.needsClosing.push(agent);
    await agent.goto(`${koaServer.baseUrl}/waitTest`);
    await agent.waitForAllContentLoaded();
    const readyLink = agent.document.querySelector('a.ready');
    await agent.interact({ click: readyLink, waitForElementVisible: readyLink });
    await agent.waitForLocation('change');
    const finalUrl = await agent.url;
    expect(finalUrl).toBe(`${koaServer.baseUrl}/finish`);

    await agent.close();
  });

  it('should be able to type various combinations of characters', async () => {
    koaServer.get('/keys', ctx => {
      ctx.body = `
        <body>
          <textarea></textarea>
        </body>
      `;
    });
    const agent = await handler.createAgent();
    Helpers.needsClosing.push(agent);
    await agent.goto(`${koaServer.baseUrl}/keys`);
    await agent.waitForAllContentLoaded();
    const textarea = agent.document.querySelector('textarea');
    await agent.click(textarea);
    await agent.type('Test!');
    expect(await textarea.value).toBe('Test!');
    await agent.type(KeyboardKeys.Backspace);
    expect(await textarea.value).toBe('Test');

    await agent.interact(
      { [Command.keyDown]: KeyboardKeys.Shift },
      { [Command.keyPress]: KeyboardKeys.ArrowLeft },
      { [Command.keyPress]: KeyboardKeys.ArrowLeft },
      { [Command.keyPress]: KeyboardKeys.ArrowLeft },
      { [Command.keyUp]: KeyboardKeys.Shift },
      { [Command.keyPress]: KeyboardKeys.Delete },
    );

    expect(await textarea.value).toBe('T');
    await agent.close();
  });
});
