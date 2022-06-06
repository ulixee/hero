import { Helpers, Hero } from '@ulixee/hero-testing';
import { KeyboardKey } from '@unblocked-web/specifications/agent/interact/IKeyboardLayoutUS';
import { Command } from '@ulixee/hero/interfaces/IInteractions';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import { Session } from '@ulixee/hero-core';
import { LocationStatus } from '@ulixee/hero';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer(true);
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

    const hero = new Hero();
    Helpers.needsClosing.push(hero);

    await hero.goto(`${url}page1`);
    await hero.waitForPaintingStable();
    await hero.document.querySelector('#input').focus();
    await hero.waitForMillis(50);
    await hero.interact({ type: text });
    await hero.waitForMillis(20);
    await hero.click(hero.document.querySelector('#submit-button'));
    await hero.waitForLocation('change');
    await hero.activeTab.waitForLoad('DomContentLoaded');
    const html = await hero.document.documentElement.outerHTML;
    expect(html).toBe(`<html><head></head><body>${text}</body></html>`);
    expect(onPost).toHaveBeenCalledTimes(1);

    await hero.close();
    await httpServer.close();
  }, 30e3);

  it('should clean up cookies between runs', async () => {
    const hero1 = new Hero();
    let setCookieValue = 'ulixee=test1';
    const httpServer = await Helpers.runHttpServer({
      addToResponse: response => {
        response.setHeader('Set-Cookie', setCookieValue);
      },
    });
    const url = httpServer.url;

    Helpers.needsClosing.push(hero1);
    {
      await hero1.goto(url);

      const cookie = await hero1.activeTab.cookieStorage.getItem('ulixee');
      expect(cookie.value).toBe('test1');
    }

    {
      setCookieValue = 'ulixee2=test2';
      await hero1.goto(url);

      const cookieStorage = await hero1.activeTab.cookieStorage;
      expect(await cookieStorage.length).toBe(2);
      const cookie1 = await cookieStorage.getItem('ulixee');
      expect(cookie1.value).toBe('test1');
      const cookie2 = await cookieStorage.getItem('ulixee2');
      expect(cookie2.value).toBe('test2');
    }

    {
      setCookieValue = 'ulixee3=test3';
      // should be able to get a second hero out of the pool
      const hero2 = new Hero();
      Helpers.needsClosing.push(hero2);
      await hero2.goto(url);

      const cookieStorage = await hero2.activeTab.cookieStorage;
      expect(await cookieStorage.length).toBe(1);
      const cookie = await cookieStorage.getItem('ulixee3');
      expect(cookie.value).toBe('test3');

      await hero2.close();
    }

    await hero1.close();
  }, 20e3);

  it('should be able to type various combinations of characters', async () => {
    koaServer.get('/keys', ctx => {
      ctx.body = `
        <body>
          <h1>Text Area</h1>
          <textarea></textarea>
        </body>
      `;
    });
    const hero = new Hero();
    Helpers.needsClosing.push(hero);
    await hero.goto(`${koaServer.baseUrl}/keys`);
    await hero.waitForPaintingStable();
    const textarea = hero.document.querySelector('textarea');
    await hero.click(textarea);
    await hero.type('Test!');
    expect(await textarea.value).toBe('Test!');
    await hero.type(KeyboardKey.Backspace);
    expect(await textarea.value).toBe('Test');

    await hero.interact(
      { [Command.keyDown]: KeyboardKey.Shift },
      { [Command.keyPress]: KeyboardKey.ArrowLeft },
      { [Command.keyPress]: KeyboardKey.ArrowLeft },
      { [Command.keyPress]: KeyboardKey.ArrowLeft },
      { [Command.keyUp]: KeyboardKey.Shift },
      { [Command.keyPress]: KeyboardKey.Delete },
    );

    expect(await textarea.value).toBe('T');
    await hero.close();
  });

  it('should be able to click on the same element twice', async () => {
    koaServer.get('/twice', ctx => {
      ctx.body = `
        <body>
          <div id="spot">Twice spot</div>
        </body>
      `;
    });
    const hero = new Hero();
    Helpers.needsClosing.push(hero);
    await hero.goto(`${koaServer.baseUrl}/twice`);
    await hero.activeTab.waitForLoad(LocationStatus.DomContentLoaded);
    const logo = hero.document.querySelector('#spot');
    await expect(hero.interact({ click: logo })).resolves.toBeUndefined();
    await hero.waitForMillis(100);
    await expect(hero.interact({ click: logo })).resolves.toBeUndefined();
    await hero.close();
  });

  it('can accept empty commands', async () => {
    koaServer.get('/empty-click', ctx => {
      ctx.body = `
        <body>
           <div style="margin-top: 200px">
             <a href="#none" onclick="clickit()">Empty clicker</a>
           </div>
          <script>
            let lastClicked = '';
            function clickit() {
              lastClicked = 'clickedit';
            }
          </script>
        </body>
      `;
    });
    const hero = new Hero();
    Helpers.needsClosing.push(hero);
    await hero.goto(`${koaServer.baseUrl}/empty-click`);
    await hero.activeTab.waitForLoad(LocationStatus.PaintingStable);
    await hero.interact(
      {
        [Command.move]: hero.document.querySelector('a'),
      },
      'click',
    );

    expect(await hero.activeTab.getJsValue('lastClicked')).toBe('clickedit');
  });

  it('should be able to click an element in an iframe', async () => {
    koaServer.get('/interact-frame', ctx => {
      ctx.body = `
        <body>
        <h1>Iframe Page</h1>
        <br/><br/>
        <iframe src="/innerFrame" id="frame1" style="height:300px"></iframe>
        </body>
      `;
    });
    koaServer.get('/innerFrame', ctx => {
      ctx.body = `<body>
   <div style="margin-top: 200px">
     <a href="#none" onclick="clickit()">Empty clicker</a>
   </div>
  <script>
    let lastClicked = '';
    function clickit() {
      lastClicked = 'clickedit';
    }
  </script>

</body>`;
    });

    const hero = new Hero();
    Helpers.needsClosing.push(hero);
    await hero.goto(`${koaServer.baseUrl}/interact-frame`);
    await hero.waitForPaintingStable();

    const frameElement = hero.document.querySelector('#frame1');
    await hero.waitForElement(frameElement);
    const frameEnv = await hero.activeTab.getFrameEnvironment(frameElement);
    await frameEnv.waitForLoad(LocationStatus.AllContentLoaded);

    await hero.click(frameEnv.document.querySelector('a'));
    expect(await frameEnv.getJsValue('lastClicked')).toBe('clickedit');

    await hero.close();
  });

  it('should be able to click elements when iterating in a list', async () => {
    // test putting next to an image that will only space after it loads
    koaServer.get('/replace-list', ctx => {
      ctx.body = `
      <body>
          <div id="app" style="height: 2700px">&nbsp;</div>
          <div id="outer">
            <div class="inner">
              <ul id="test">
                <li class="class1">Li 1</li>
                <li class="class1">Li 2</li>
                <li class="class1">Li 3</li>
              </ul>
            </div>
            <div class="inner">
              <ul id="test">
                <li class="class1">Li 3</li>
                <li class="class1">Li 4</li>
                <li class="class1">Li 5</li>
              </ul>
            </div>
          </div>
        <script>
          
          let hasrun = false;
          document.querySelector('#app').addEventListener('mouseleave', () => {
             if (hasrun) return;
             hasrun = true;
             
             document.querySelector('#outer').innerHTML = \`<div class="inner">
              <ul id="test">
                <li class="class1">Li 1</li>
                <li class="class1">Li 2</li>
                <li class="class1">Li 3</li>
              </ul>
            </div>
            <div class="inner">
              <ul id="test">
                <li class="class1">Li 3</li>
                <li class="class1">Li 4</li>
                <li class="class1">Li 5</li>
              </ul>
            </div>\`;
          });
        </script>
      </body>
    `;
    });

    const hero = new Hero();
    const sessionId = await hero.sessionId;
    const tabId = await hero.activeTab.tabId;
    const tab = Session.getTab({ tabId, sessionId });
    const interactor = tab.mainFrameEnvironment.frame.interactor;
    const reloadSpy = jest.spyOn(interactor, 'reloadJsPath');
    await hero.goto(`${koaServer.baseUrl}/replace-list`);
    await hero.activeTab.waitForLoad(LocationStatus.PaintingStable);

    for (const result of await hero.querySelectorAll('#outer .inner')) {
      for (const inner of await result.querySelectorAll('ul')) {
        await inner.dataset;
        await inner.querySelector('li').$click();
      }
    }
    expect(reloadSpy).toHaveBeenCalledTimes(2);
  });
});
