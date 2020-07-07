import { Helpers } from '@secret-agent/testing';
import Core from '../index';
import { InteractionCommand } from '@secret-agent/core-interfaces/IInteractions';

let koaServer;
beforeAll(async () => {
  await Core.start();
  koaServer = await Helpers.runKoaServer();
});

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
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
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
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];

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
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];

    await core.goto(inputUrl);
    const input = await core.execJsPath(['document', ['querySelector', 'input'], 'value']);
    expect(input.value).toBe('');
    const x = await core.execJsPath([['document.querySelector', 'body'], 'scrollTop']);
    expect(x.value).toBe(0);
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

    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
    await core.goto(`${koaServer.baseUrl}/vars`);
    await core.waitForLoad('DomContentLoaded');

    const pageClicks = await core.getJsValue('pageClicks');
    expect(pageClicks.value).toStrictEqual([1, 2, 3]);

    await core.getJsValue(`add('item4')`);
    const pageClicks2 = await core.getJsValue('pageClicks');

    expect(pageClicks2.value).toStrictEqual([1, 2, 3, 'item4']);
  });
});

afterAll(async () => {
  await Core.shutdown();
  await Helpers.closeAll();
});
