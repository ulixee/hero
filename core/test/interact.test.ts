import { Helpers } from '@secret-agent/testing';
import { InteractionCommand } from '@secret-agent/core-interfaces/IInteractions';
import Core from '../index';

let koaServer;
beforeAll(async () => {
  await Core.start();
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Interaction tests', () => {
  it('executes basic click command', async () => {
    koaServer.get('/mouse', ctx => {
      ctx.body = `
        <body>
          <button>Test</button>
          <script>
            document.querySelector('button').addEventListener('click', event => {
              document.querySelector('button').classList.add('clicked');
            });
          </script>
        </body>
      `;
    });
    const mouseUrl = `${koaServer.baseUrl}/mouse`;
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];
    // @ts-ignore
    const session = core.session;
    await core.goto(mouseUrl);

    const spy = jest.spyOn(session.humanoid, 'playInteractions');
    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'button']],
      },
    ]);

    expect(spy).toHaveBeenCalledTimes(1);
    const interactGroups = spy.mock.calls[0][0];
    expect(interactGroups).toHaveLength(1);
    expect(interactGroups[0]).toHaveLength(2);
    expect(interactGroups[0][0].command).toBe('scroll');

    const buttonClass = await core.execJsPath([
      'document',
      ['querySelector', 'button.clicked'],
      'classList',
    ]);
    expect(buttonClass.value).toStrictEqual({ 0: 'clicked' });
    await core.close();
  });

  it('executes basic type command', async () => {
    koaServer.get('/input', ctx => {
      ctx.set('Content-Security-Policy', "script-src 'unsafe-eval'");
      ctx.body = `
        <body>
          <input type="text" />
        </body>
      `;
    });
    const inputUrl = `${koaServer.baseUrl}/input`;
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];

    await core.goto(inputUrl);
    await core.execJsPath(['document', ['querySelector', 'input'], ['focus']]);
    await core.interact([
      {
        command: InteractionCommand.type,
        keyboardCommands: [{ string: 'Hello world!' }],
      },
    ]);
    const inputValue = await core.execJsPath(['document', ['querySelector', 'input'], 'value']);
    expect(inputValue.value).toBe('Hello world!');
    await core.close();
  });

  it('can operate when unsafe eval not on', async () => {
    koaServer.get('/unsafe', ctx => {
      ctx.set('Content-Security-Policy', "script-src 'self'");
      ctx.body = `
        <body>
          <input type="text" />
        </body>
      `;
    });
    const inputUrl = `${koaServer.baseUrl}/unsafe`;
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];

    await core.goto(inputUrl);
    const input = await core.execJsPath(['document', ['querySelector', 'input'], 'value']);
    expect(input.value).toBe('');
    const x = await core.execJsPath([['document.querySelector', 'body'], 'scrollTop']);
    expect(x.value).toBe(0);
    await core.close();
  });

  it('should be able to get window variables', async () => {
    koaServer.get('/vars', ctx => {
      ctx.set('Content-Security-Policy', "default-src 'self'; script-src 'unsafe-inline'");
      ctx.body = `
        <body>
          <script type="text/javascript">
          const pageClicks = [1,2,3];
          function add(item){
            pageClicks.push(item)
          }
          </script>
        </body>
      `;
    });

    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];
    await core.goto(`${koaServer.baseUrl}/vars`);
    await core.waitForLoad('DomContentLoaded');

    const pageClicks = await core.getJsValue('pageClicks');
    expect(pageClicks.value).toStrictEqual([1, 2, 3]);

    await core.getJsValue(`add('item4')`);
    const pageClicks2 = await core.getJsValue('pageClicks');

    expect(pageClicks2.value).toStrictEqual([1, 2, 3, 'item4']);
    await core.close();
  });

  it('should be able to click elements off screen', async () => {
    koaServer.get('/longpage', ctx => {
      ctx.body = `
        <body>
          <div style="height:500px">
            <button id="button-1" onclick="click1()">Test</button>
          </div>
          <div style="margin-top:1500px">
            <button id="button-2" onclick="click2()">Test 2</button>
          </div>
          <script>
            var lastClicked = '';
            function click1() {
              lastClicked = 'click1';
            }
            function click2() {
              lastClicked = 'click2';
            }
          </script>
        </body>
      `;
    });
    const mouseUrl = `${koaServer.baseUrl}/longpage`;
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];
    await core.goto(mouseUrl);

    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', '#button-1']],
      },
    ]);
    let lastClicked = await core.getJsValue('lastClicked');
    expect(lastClicked.value).toBe('click1');

    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', '#button-2']],
      },
    ]);
    lastClicked = await core.getJsValue('lastClicked');
    expect(lastClicked.value).toBe('click2');

    await core.close();
  });
});
