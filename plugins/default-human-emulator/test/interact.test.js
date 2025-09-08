"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const IInteractions_1 = require("@ulixee/unblocked-specification/agent/interact/IInteractions");
const helpers_1 = require("@ulixee/unblocked-agent-testing/helpers");
const IJsPathFunctions_1 = require("@ulixee/unblocked-specification/agent/browser/IJsPathFunctions");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
const unblocked_agent_1 = require("@ulixee/unblocked-agent");
const __1 = require("..");
let koaServer;
let pool;
beforeAll(async () => {
    pool = new unblocked_agent_1.Pool({
        defaultBrowserEngine: unblocked_agent_testing_1.BrowserUtils.defaultBrowserEngine,
        plugins: [__1.default],
    });
    unblocked_agent_testing_1.Helpers.onClose(() => pool.close(), true);
    await pool.start();
    __1.default.minScrollVectorPoints = 2;
    __1.default.maxMoveVectorPoints = 5;
    __1.default.maxScrollIncrement = 1000;
    __1.default.minScrollVectorPoints = 3;
    __1.default.maxScrollVectorPoints = 5;
    __1.default.maxDelayBetweenInteractions = 0;
    __1.default.maxScrollDelayMillis = 0;
    koaServer = await unblocked_agent_testing_1.Helpers.runKoaServer();
});
beforeEach(unblocked_agent_testing_1.Helpers.beforeEach);
afterAll(unblocked_agent_testing_1.Helpers.afterAll, 30e3);
afterEach(unblocked_agent_testing_1.Helpers.afterEach);
async function createAgent(configuration) {
    const agent = pool.createAgent({ logger: unblocked_agent_testing_1.TestLogger.forTest(module) });
    unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
    if (configuration) {
        const { viewport } = configuration;
        agent.hook({
            onNewPage(page) {
                return page.devtoolsSession
                    .send('Emulation.setDeviceMetricsOverride', {
                    width: viewport.width,
                    height: viewport.height,
                    deviceScaleFactor: 1,
                    positionX: viewport.positionX,
                    positionY: viewport.positionY,
                    screenWidth: viewport.screenWidth,
                    screenHeight: viewport.screenHeight,
                    mobile: false,
                })
                    .catch(() => null);
            },
        });
    }
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
                mousePosition: ['window', 'document', ['querySelector', 'button']],
            },
        ]);
        expect(spy).toHaveBeenCalledTimes(1);
        const interactGroups = spy.mock.calls[0][0];
        expect(interactGroups).toHaveLength(1);
        expect(interactGroups[0]).toHaveLength(2);
        expect(interactGroups[0][0].command).toBe('scroll');
        const buttonClass = await page.execJsPath([
            'document',
            ['querySelector', 'button.clicked'],
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
        const buttonRect = await page.execJsPath([
            'document',
            ['querySelector', 'button'],
            [IJsPathFunctions_1.getClientRectFnName],
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
    it('moves over a select box to simulate clicking an option', async () => {
        const agent = await createAgent();
        const page = await agent.newPage();
        koaServer.get('/click-option', ctx => {
            ctx.body = `
      <body>
        <div style="margin-top:1500px">
          <select onchange="changed()" onmouseenter="mousedOver = true">
            <option id="option1">1</option>
            <option id="option2">2</option>
          </select>
        </div>
        <script>
          let didChangeOption = false;
          let mousedOver= false;
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
        await expect(page.evaluate('mousedOver')).resolves.toEqual(true);
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
        const agent = await createAgent({
            viewport: {
                width: 1920,
                height: 1080,
                screenWidth: 1920,
                screenHeight: 1080,
                positionX: 0,
                positionY: 0,
            },
        });
        const page = await agent.newPage();
        await page.goto(`${koaServer.baseUrl}/longpage`);
        await page.waitForLoad('DomContentLoaded');
        const click = async (selector) => {
            await page.interact([
                {
                    command: IInteractions_1.InteractionCommand.click,
                    mousePosition: ['window', 'document', ['querySelector', selector]],
                },
            ]);
            return await page.evaluate('lastClicked');
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
    it('should scroll around obstructions', async () => {
        koaServer.get('/obstructions', ctx => {
            ctx.body = `
      <body>
        <button id="button-2" onclick="click2()" style="width: 150px; margin-top: 150px; height: 30px;display:block">Test 2</button>
        <div style="height:1200px; position: relative;margin-bottom: 150px">
           <button id="button-3" onclick="click3()" style="position:absolute; top: 0; width: 150px;height: 30px;display:block">Test 3</button>
           <button id="button-1" onclick="click1()" style="position:absolute; bottom: 30px; width: 150px;height: 30px;display:block">Test 1</button>
        </div>
         
        <div id="top-obstruction" style="position: fixed; width: 100%; top: 0; height: 150px;background: red; z-index: 2">Overlay</div>
        <div id="bottom-obstruction" style="position: fixed; width: 100%; bottom: 0; height: 150px;background: blue; z-index: 2">Overlay</div>
        
        <script>
          let lastClicked = '';
          function click1() {
            lastClicked = 'click1';
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
        const agent = await createAgent({
            viewport: {
                width: 1920,
                height: 1080,
                screenWidth: 1920,
                screenHeight: 1080,
                positionX: 0,
                positionY: 0,
            },
        });
        const page = await agent.newPage();
        await page.goto(`${koaServer.baseUrl}/obstructions`);
        const click = async (selector) => {
            await page.interact([
                {
                    command: IInteractions_1.InteractionCommand.click,
                    mousePosition: ['window', 'document', ['querySelector', selector]],
                },
            ]);
            return await page.evaluate('lastClicked');
        };
        let lastClicked = await click('#button-1');
        expect(lastClicked).toBe('click1');
        lastClicked = await click('#button-2');
        expect(lastClicked).toBe('click2');
        lastClicked = await click('#button-3');
        expect(lastClicked).toBe('click3');
    }, 20e3);
    it('should be able to click elements that move on load', async () => {
        koaServer.get('/img.png', async (ctx) => {
            ctx.set('Content-Type', 'image/png');
            await new Promise(resolve => setTimeout(resolve, 50));
            ctx.body = (0, helpers_1.getLogo)();
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
        const agent = await createAgent();
        const page = await agent.newPage();
        const interactor = page.mainFrame.interactor;
        const originalFn = interactor.lookupBoundingRect.bind(interactor);
        const lookupSpy = jest.spyOn(interactor, 'lookupBoundingRect');
        lookupSpy.mockImplementationOnce(async (mousePosition) => {
            const data = await originalFn(mousePosition);
            data.y -= 500;
            return data;
        });
        await page.goto(`${koaServer.baseUrl}/move-on-load`);
        await page.interact([
            {
                command: IInteractions_1.InteractionCommand.click,
                mousePosition: ['window', 'document', ['querySelector', '#button-1']],
            },
        ]);
        expect(lookupSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
        const lastClicked = await page.evaluate('lastClicked');
        expect(lastClicked).toBe('clickedit');
    });
    it('will not click the wrong element', async () => {
        koaServer.get('/wrong-element', ctx => {
            ctx.body = `
      <body>
          <div style="position: relative; margin-top:1400px">
            <button id="button-1" onmousedown="clickit('down')" onmouseup="clickit('up')"  style="width:100px;top:0;left:0;position: absolute;">Click me</button>
            <button id="button-2" onmousedown="clickit2()" style="width:100px;top:0;left:0;position: absolute;">Click me</button>
        </div>
        <script>

          let lastClicked = '';
          function clickit(where) {
            lastClicked = 'wrongone-' + where;
          }
          function clickit2() {
            lastClicked = 'rightone';
          }
        </script>
      </body>
    `;
        });
        const agent = await createAgent();
        const page = await agent.newPage();
        const mouseDown = page.mouse.down.bind(page.mouse);
        const mouseSpy = jest.spyOn(page.mouse, 'down');
        mouseSpy.mockImplementationOnce(async (key) => {
            await page.evaluate('document.querySelector("#button-2").remove()');
            return await mouseDown(key);
        });
        await page.goto(`${koaServer.baseUrl}/wrong-element`);
        await expect(page.interact([
            {
                command: IInteractions_1.InteractionCommand.click,
                mousePosition: ['window', 'document', ['querySelector', '#button-2']],
            },
        ])).rejects.toThrow();
        const lastClicked = await page.evaluate('lastClicked');
        expect(lastClicked).toBe('');
    });
    it('should be able to click elements that are replaced', async () => {
        // test putting next to an image that will only space after it loads
        koaServer.get('/replace-node', ctx => {
            ctx.body = `
      <body>
          <div id="app" style="height: 2700px">&nbsp;</div>
          <ul id="test"><li class="class1">Li 1</li></ul>
        <script>
          
          let hasrun = false;
          document.querySelector('#app').addEventListener('mouseleave', () => {
             if (hasrun) return;
             hasrun = true;
             
             document.querySelector('#test').remove();
             const replaceNodes = document.createElement('ul');
             replaceNodes.id = 'test';
             replaceNodes.innerHTML = "<li class=class1>Li 1</li>";
             document.body.append(replaceNodes);
          })
        </script>
      </body>
    `;
        });
        const agent = await createAgent();
        const page = await agent.newPage();
        const interactor = page.mainFrame.interactor;
        const reloadSpy = jest.spyOn(interactor, 'reloadJsPath');
        await page.goto(`${koaServer.baseUrl}/replace-node`);
        await page.waitForLoad(Location_1.LocationStatus.PaintingStable);
        const ul = await page.execJsPath([
            'document',
            ['querySelector', '#test'],
            [IJsPathFunctions_1.getNodePointerFnName],
        ]);
        // if node is exact, expect it to say that element is now gone
        await expect(page.interact([
            {
                command: IInteractions_1.InteractionCommand.click,
                mousePosition: [ul.nodePointer.id, ['querySelector', '.class1']],
                verification: 'exactElement',
            },
        ])).rejects.toThrow(`element isn't connected to the DOM`);
        // should not try to reload
        expect(reloadSpy).toHaveBeenCalledTimes(0);
        await expect(page.interact([
            {
                command: IInteractions_1.InteractionCommand.click,
                mousePosition: [ul.nodePointer.id, ['querySelector', '.class1']],
                verification: 'elementAtPath',
            },
        ])).resolves.toBeUndefined();
        expect(reloadSpy).toHaveBeenCalledTimes(1);
    });
    it('should be able to click an element without verification', async () => {
        koaServer.get('/no-verify', ctx => {
            ctx.body = `
      <body>
          <div id="app" style="height: 2700px">&nbsp;</div>
          <ul id="test"><li class="class1">Li 1</li></ul>
        <script>
          
          let hasrun = false;
          document.querySelector('#app').addEventListener('mouseleave', () => {
             if (hasrun) return;
             hasrun = true;
             document.querySelector('#test').remove();
          })
        </script>
      </body>
    `;
        });
        const agent = await createAgent();
        const page = await agent.newPage();
        const jsPathExecSpy = jest.spyOn(page.mainFrame.jsPath, 'exec');
        await page.goto(`${koaServer.baseUrl}/no-verify`);
        await expect(page.interact([
            {
                command: IInteractions_1.InteractionCommand.scroll,
                mousePosition: [0, 1400],
            },
        ])).resolves.toBeUndefined();
        const ul = await page.execJsPath([
            'document',
            ['querySelector', '#test'],
            [IJsPathFunctions_1.getClientRectFnName],
        ]);
        // if node is exact, expect it to say that element is now gone
        await expect(page.interact([
            {
                command: IInteractions_1.InteractionCommand.click,
                mousePosition: [ul.nodePointer.id],
                verification: 'none',
            },
        ])).resolves.toBeUndefined();
        // should only make one dom call
        expect(jsPathExecSpy).toHaveBeenCalledTimes(1);
    }, 20e3);
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