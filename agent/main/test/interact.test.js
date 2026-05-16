"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const IInteractions_1 = require("@ulixee/unblocked-specification/agent/interact/IInteractions");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
const browserUtils_1 = require("@ulixee/unblocked-agent-testing/browserUtils");
const index_1 = require("../index");
let koaServer;
let pool;
beforeAll(async () => {
    pool = new index_1.Pool({ defaultBrowserEngine: browserUtils_1.defaultBrowserEngine });
    unblocked_agent_testing_1.Helpers.onClose(() => pool.close(), true);
    await pool.start();
    koaServer = await unblocked_agent_testing_1.Helpers.runKoaServer();
});
beforeEach(async () => {
    unblocked_agent_testing_1.TestLogger.testNumber += 1;
});
afterAll(unblocked_agent_testing_1.Helpers.afterAll, 30e3);
afterEach(unblocked_agent_testing_1.Helpers.afterEach);
async function createAgent(options) {
    const agentOptions = new browserUtils_1.PageHooks(options);
    agentOptions.logger = unblocked_agent_testing_1.TestLogger.forTest(module);
    const agent = pool.createAgent(agentOptions);
    unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
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
        const spy = jest.spyOn(page.mainFrame.interactor, 'playAllInteractions');
        await page.interact([
            {
                command: IInteractions_1.InteractionCommand.click,
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
        await page.waitForLoad(Location_1.LoadStatus.AllContentLoaded);
        const buttonRect = await page.mainFrame.jsPath.getClientRect([
            'document',
            ['querySelector', 'button'],
        ]);
        await expect(page.interact([
            {
                command: IInteractions_1.InteractionCommand.click,
                mousePosition: [buttonRect.value.x, buttonRect.value.y],
            },
        ])).resolves.toBeUndefined();
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
        await page.waitForLoad(Location_1.LocationStatus.PaintingStable);
        await page.execJsPath(['document', ['querySelector', 'input'], ['focus']]);
        await page.interact([
            {
                command: IInteractions_1.InteractionCommand.type,
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
        await expect(page.interact([
            {
                command: IInteractions_1.InteractionCommand.click,
                mousePosition: ['document', ['querySelector', 'not-there']],
            },
        ])).rejects.toThrow('Element does not exist');
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
        await page.waitForLoad(Location_1.LoadStatus.DomContentLoaded);
        await expect(page.interact([
            {
                command: IInteractions_1.InteractionCommand.click,
                mousePosition: ['document', ['querySelector', '#option1']],
            },
        ])).resolves.toBeUndefined();
        await expect(page.evaluate('didChangeOption')).resolves.toEqual(true);
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
                command: IInteractions_1.InteractionCommand.click,
                mousePosition: ['window', 'document', ['querySelector', '#button-1']],
            },
        ]);
        await page.mainFrame.waitForLocation('change');
        const url = page.mainFrame.url;
        expect(url).toBe(`${koaServer.baseUrl}/`);
    });
});
//# sourceMappingURL=interact.test.js.map