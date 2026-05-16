"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const browserUtils_1 = require("@ulixee/unblocked-agent-testing/browserUtils");
const index_1 = require("@ulixee/unblocked-agent-testing/index");
const server_1 = require("./server");
const index_2 = require("../index");
let server;
let page;
let browser;
let context;
beforeAll(async () => {
    server = await server_1.TestServer.create(0);
    browser = new index_2.Browser(browserUtils_1.defaultBrowserEngine);
    await browser.launch();
    const logger = index_1.TestLogger.forTest(module);
    context = await browser.newContext({ logger });
});
afterAll(async () => {
    await server.stop();
    await context.close();
    await browser.close();
});
afterEach(async () => {
    await page.close();
});
beforeEach(async () => {
    index_1.TestLogger.testNumber += 1;
    page = await context.newPage();
    server.reset();
});
it('can dismiss dialogs', async () => {
    server.setRoute('/dialog', (req, res) => {
        res.end(`
        <body>
          <h1>Dialog page</h1>
          <script type="text/javascript">
           setTimeout(() => confirm('Do you want to do this'), 500);
          </script>
        </body>
      `);
    });
    const dialogPromise = new Promise(resolve => page.once('dialog-opening', resolve));
    await page.goto(server.url('dialog'));
    await expect(dialogPromise).resolves.toBeTruthy();
    await dialogPromise;
    await expect(page.dismissDialog(true)).resolves.toBeUndefined();
    // test that we don't hang here
    await expect(page.execJsPath(['document', ['querySelector', 'h1'], 'textContent'])).resolves.toBeTruthy();
});
it('can wait for file prompts', async () => {
    server.setRoute('/file', (req, res) => {
        res.end(`
        <body>
          <h1>File prompt page</h1>
          <input type='file' id='file'/>
        </body>
      `);
    });
    await page.goto(server.url('file'));
    const filechooserPromise = new Promise(resolve => page.once('filechooser', resolve));
    await expect(page.click(['document', ['querySelector', '#file']])).resolves.toBeUndefined();
    await expect(filechooserPromise).resolves.toBeTruthy();
    const { prompt } = await filechooserPromise;
    expect(prompt.frameId).toBe(page.mainFrame.frameId);
    // should be a node pointer
    expect(prompt.jsPath[0]).toEqual(expect.any(Number));
});
it('can wait for file prompts after a cross process navigation', async () => {
    server.setRoute('/fileprompt-start', (req, res) => {
        res.end(`<body><h1>File prompt navigation start</h1></body>`);
    });
    server.setRoute('/fileprompt2', (req, res) => {
        res.end(`
        <body>
          <h1>File prompt page 2</h1>
          <input type='file' id='file2'/>
        </body>
      `);
    });
    await page.goto(`${server.crossProcessBaseUrl}/fileprompt-start`);
    await page.goto(server.url('fileprompt2'));
    const filechooserPromise = new Promise(resolve => page.once('filechooser', resolve));
    await expect(page.click(['document', ['querySelector', '#file2']])).resolves.toBeUndefined();
    await expect(filechooserPromise).resolves.toBeTruthy();
    const { prompt } = await filechooserPromise;
    expect(prompt.frameId).toBe(page.mainFrame.frameId);
    // should be a node pointer
    expect(prompt.jsPath[0]).toEqual(expect.any(Number));
});
//# sourceMappingURL=prompts.test.js.map