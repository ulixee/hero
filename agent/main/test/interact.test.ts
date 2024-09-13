import { Helpers, TestLogger } from '@ulixee/unblocked-agent-testing';
import { InteractionCommand } from '@ulixee/unblocked-specification/agent/interact/IInteractions';
import { ITestKoaServer } from '@ulixee/unblocked-agent-testing/helpers';
import { LoadStatus, LocationStatus } from '@ulixee/unblocked-specification/agent/browser/Location';
import IViewport from '@ulixee/unblocked-specification/agent/browser/IViewport';
import { defaultBrowserEngine, PageHooks } from '@ulixee/unblocked-agent-testing/browserUtils';
import { Agent, Pool } from '../index';
import { IAgentCreateOptions } from '../lib/Agent';

let koaServer: ITestKoaServer;
let pool: Pool;
beforeAll(async () => {
  pool = new Pool({ defaultBrowserEngine });
  Helpers.onClose(() => pool.close(), true);
  await pool.start();

  koaServer = await Helpers.runKoaServer();
});
beforeEach(async () => {
  TestLogger.testNumber += 1;
});

afterAll(Helpers.afterAll, 30e3);
afterEach(Helpers.afterEach);

async function createAgent(options?: { viewport: IViewport }): Promise<Agent> {
  const agentOptions = new PageHooks(options) as Partial<IAgentCreateOptions>;
  agentOptions.logger = TestLogger.forTest(module);
  const agent = pool.createAgent(agentOptions);
  Helpers.needsClosing.push(agent);
  return agent;
}

describe('basic interaction tests', () => {
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

    const agent = await createAgent();
    const page = await agent.newPage();
    await page.goto(`${koaServer.baseUrl}/mouse`);

    const spy = jest.spyOn<any, any>(page.mainFrame.interactor, 'playAllInteractions');
    await page.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['document', ['querySelector', 'button']],
      },
    ]);

    expect(spy).toHaveBeenCalledTimes(1);
    const interactGroups = spy.mock.calls[0][0];
    expect(interactGroups).toHaveLength(1);
    expect(interactGroups[0]).toHaveLength(2);
    expect(interactGroups[0][0].command).toBe('scroll');

    const buttonClass = await page.execJsPath([
      'document',
      ['querySelector', 'button'],
      'classList',
    ]);
    expect(buttonClass.value).toStrictEqual({ 0: 'clicked' });
  });

  it('can click an XY coordinate off screen', async () => {
    koaServer.get('/point', ctx => {
      ctx.body = `<body>
        <div>
          <button style="margin-top:1500px">Test</button>
        </div>
        
        <script>
          document.querySelector('button').addEventListener('click', event => {
            document.querySelector('button').classList.add('clicked');
          });
        </script>
      </body>`;
    });

    const agent = await createAgent();
    const page = await agent.newPage();
    await page.goto(`${koaServer.baseUrl}/point`);
    await page.waitForLoad(LoadStatus.AllContentLoaded);

    const buttonRect = await page.mainFrame.jsPath.getClientRect([
      'document',
      ['querySelector', 'button'],
    ]);

    await expect(
      page.interact([
        {
          command: InteractionCommand.click,
          mousePosition: [buttonRect.value.x, buttonRect.value.y],
        },
      ]),
    ).resolves.toBeUndefined();

    const buttonClass = await page.execJsPath([
      'document',
      ['querySelector', 'button'],
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

    const agent = await createAgent();
    const page = await agent.newPage();

    await page.goto(`${koaServer.baseUrl}/input`);
    await page.waitForLoad(LocationStatus.PaintingStable);
    await page.execJsPath(['document', ['querySelector', 'input'], ['focus']]);
    await page.interact([
      {
        command: InteractionCommand.type,
        keyboardCommands: [{ string: 'Hello world!' }],
      },
    ]);
    const inputValue = await page.execJsPath(['document', ['querySelector', 'input'], 'value']);
    expect(inputValue.value).toBe('Hello world!');
  });

  it('should throw an error if a node cannot be found', async () => {
    const agent = await createAgent();
    const page = await agent.newPage();

    await page.goto(`${koaServer.baseUrl}/`);
    await expect(
      page.interact([
        {
          command: InteractionCommand.click,
          mousePosition: ['document', ['querySelector', 'not-there']],
        },
      ]),
    ).rejects.toThrow('Element does not exist');
  });

  it('simulates clicking an option', async () => {
    const agent = await createAgent();
    const page = await agent.newPage();
    koaServer.get('/click-option', ctx => {
      ctx.body = `
      <body>
        <div style="margin-top:1500px">
          <select onchange="changed()" >
            <option id="option1">1</option>
            <option id="option2">2</option>
          </select>
        </div>
        <script>
          let didChangeOption = false;
          function changed() {
            didChangeOption = true;
          }
        </script>
      </body>
    `;
    });

    await page.goto(`${koaServer.baseUrl}/click-option`);
    await page.waitForLoad(LoadStatus.DomContentLoaded);
    await expect(
      page.interact([
        {
          command: InteractionCommand.click,
          mousePosition: ['document', ['querySelector', '#option1']],
        },
      ]),
    ).resolves.toBeUndefined();

    await expect(page.evaluate<boolean>('didChangeOption')).resolves.toEqual(true);
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
            }, { once: true })
        </script>
      </body>
    `;
    });

    const agent = await createAgent();
    const page = await agent.newPage();
    await page.goto(`${koaServer.baseUrl}/redirect-on-move`);
    await page.waitForLoad('DomContentLoaded');
    await page.interact([
      {
        command: 'move',
        mousePosition: [1, 10],
      },
      {
        command: 'move',
        mousePosition: [3, 10],
      },
      {
        command: 'move',
        mousePosition: [4, 10],
      },
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', '#button-1']],
      },
    ]);

    await page.mainFrame.waitForLocation('change');
    const url = page.mainFrame.url;
    expect(url).toBe(`${koaServer.baseUrl}/`);
  });
});
