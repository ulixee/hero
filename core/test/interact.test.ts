import { Helpers } from '@ulixee/hero-testing';
import { InteractionCommand } from '@ulixee/hero-interfaces/IInteractions';
import HumanEmulator from '@ulixee/default-human-emulator';
import { getLogo, ITestKoaServer } from '@ulixee/hero-testing/helpers';
import Core, { Session } from '../index';
import ConnectionToClient from '../connections/ConnectionToClient';

let koaServer: ITestKoaServer;
let connection: ConnectionToClient;
beforeAll(async () => {
  connection = Core.addConnection();
  await connection.connect();
  Helpers.onClose(() => connection.disconnect(), true);

  HumanEmulator.maxDelayBetweenInteractions = 0;
  HumanEmulator.maxScrollDelayMillis = 0;
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll, 30e3);
afterEach(Helpers.afterEach);

const humanEmulatorId = HumanEmulator.id;

describe('%s interaction tests', () => {
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
    const meta = await connection.createSession({ humanEmulatorId });
    const session = Session.get(meta.sessionId);
    Helpers.needsClosing.push(session);
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/mouse`);

    const spy = jest.spyOn(session.plugins, 'playInteractions');
    await tab.interact([
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

    const buttonClass = await tab.execJsPath([
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
    const meta = await connection.createSession({ humanEmulatorId });
    const session = Session.get(meta.sessionId);
    Helpers.needsClosing.push(session);
    const tab = Session.getTab(meta);

    await tab.goto(`${koaServer.baseUrl}/input`);
    await tab.execJsPath(['document', ['querySelector', 'input'], ['focus']]);
    await tab.interact([
      {
        command: InteractionCommand.type,
        keyboardCommands: [{ string: 'Hello world!' }],
      },
    ]);
    const inputValue = await tab.execJsPath(['document', ['querySelector', 'input'], 'value']);
    expect(inputValue.value).toBe('Hello world!');
  });

  it('should be able to click elements off screen', async () => {
    koaServer.get('/longpage', ctx => {
      ctx.body = `
      <body>
        <div style="height:500px">
          <button id="button-1" onclick="click1(event)">Test</button>
        </div>
        <div style="margin-top:1100px; flex: content; justify-content: center">
          <button id="button-2" onclick="click2()" style="width: 30px; height: 20px;">Test 2</button>
        </div>
        <div style="margin-top:2161px; float:right;clear:both: width:20px; height: 20px;">
          <button id="button-3" onclick="click3()">Test 3</button>
        </div>
        <script>
          let lastClicked = '';
          function click1(ev) {
            lastClicked = 'click1' + (ev.isTrusted ? '' : '!!untrusted');
          }
          function click2() {
            lastClicked = 'click2';
          }
          function click3() {
            lastClicked = 'click3';
          }
        </script>
      </body>
    `;
    });

    const meta = await connection.createSession({
      humanEmulatorId,
      viewport: {
        width: 1920,
        height: 1080,
        screenWidth: 1920,
        screenHeight: 1080,
        positionX: 0,
        positionY: 0,
      },
    });
    const session = Session.get(meta.sessionId);
    Helpers.needsClosing.push(session);
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/longpage`);

    const click = async (selector: string) => {
      await tab.interact([
        {
          command: InteractionCommand.click,
          mousePosition: ['window', 'document', ['querySelector', selector]],
        },
      ]);
      return await tab.getJsValue('lastClicked');
    };

    let lastClicked = await click('#button-1');
    expect(lastClicked).toBe('click1');

    lastClicked = await click('#button-2');
    expect(lastClicked).toBe('click2');

    lastClicked = await click('#button-3');
    expect(lastClicked).toBe('click3');

    lastClicked = await click('#button-1');
    expect(lastClicked).toBe('click1');
  }, 60e3);

  it('should be able to click elements that move on load', async () => {
    koaServer.get('/img.png', async ctx => {
      ctx.set('Content-Type', 'image/png');
      await new Promise(resolve => setTimeout(resolve, 50));
      ctx.body = getLogo();
    });

    // test putting next to an image that will only space after it loads
    koaServer.get('/move-on-load', ctx => {
      ctx.body = `
      <body>
          <div style="height: 1800px"></div>
          <div>
            <img src="/img.png" />
            <img src="/img.png?test=1" />
            <img src="/img.png?test=3" />
            <button onclick="clickit()" id="button-1">Click me</button>
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

    const meta = await connection.createSession({ humanEmulatorId });
    const session = Session.get(meta.sessionId);
    Helpers.needsClosing.push(session);

    const tab = Session.getTab(meta);
    // @ts-ignore
    const interactor = tab.mainFrameEnvironment.interactor;
    // @ts-ignore
    const originalFn = interactor.lookupBoundingRect.bind(interactor);
    const lookupSpy = jest.spyOn(interactor, 'lookupBoundingRect');
    lookupSpy.mockImplementationOnce(async mousePosition => {
      const data = await originalFn(mousePosition);
      data.y -= 500;
      return data;
    });

    await tab.goto(`${koaServer.baseUrl}/move-on-load`);
    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', '#button-1']],
      },
    ]);
    expect(lookupSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    const lastClicked = await tab.getJsValue('lastClicked');
    expect(lastClicked).toBe('clickedit');
  });

  it('should cancel pending interactions after a page clears', async () => {
    koaServer.get('/redirect-on-move', ctx => {
      ctx.body = `
      <body>
          <div style="height: 1000px"></div>
          <div><button id="button-1">Click me</button></div>
        <script>
            document.addEventListener('mousemove', () => {
               window.location = '${koaServer.baseUrl}/';
            })
        </script>
      </body>
    `;
    });
    const meta = await connection.createSession({ humanEmulatorId });
    const session = Session.get(meta.sessionId);
    Helpers.needsClosing.push(session);
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/redirect-on-move`);
    await tab.waitForLoad('DomContentLoaded');
    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', '#button-1']],
      },
    ]);

    await tab.waitForLocation('change');
    const url = await tab.url;
    expect(url).toBe(`${koaServer.baseUrl}/`);
  });
});
