import { IKeyboardKey } from '@unblocked-web/specifications/agent/interact/IKeyboardLayoutUS';
import TestLogger from '@unblocked-web/agent-testing/TestLogger';
import { defaultBrowserEngine } from '@unblocked-web/agent-testing/browserUtils';
import { TestServer } from './server';
import { Browser, BrowserContext, Page } from '../index';
import { setContent } from './_pageTestUtils';

describe('Mouse', () => {
  let server: TestServer;
  let page: Page;
  let browser: Browser;
  let context: BrowserContext;

  beforeAll(async () => {
    server = await TestServer.create(0);
    browser = new Browser(defaultBrowserEngine);
    await browser.launch();
    const logger = TestLogger.forTest(module);
    context = await browser.newContext({ logger });
  });

  afterEach(async () => {
    await page.close();
  });

  beforeEach(async () => {
    TestLogger.testNumber += 1;
    page = await context.newPage();
    server.reset();
  });

  afterAll(async () => {
    await server.stop();
    await context.close();
    await browser.close();
  });

  it('should click the document', async () => {
    await page.evaluate(`(() => {
      window.clickPromise = new Promise(resolve => {
        document.addEventListener('click', event => {
          resolve({
            type: event.type,
            detail: event.detail,
            clientX: event.clientX,
            clientY: event.clientY,
            isTrusted: event.isTrusted,
            button: event.button,
          });
        });
      });
    })()`);
    await page.mouse.move(50, 60);
    await page.mouse.down();
    await page.mouse.up();
    const event: any = await page.evaluate(`window.clickPromise`);
    expect(event.type).toBe('click');
    expect(event.detail).toBe(1);
    expect(event.clientX).toBe(50);
    expect(event.clientY).toBe(60);
    expect(event.isTrusted).toBe(true);
    expect(event.button).toBe(0);
  });

  it('should dblclick the div', async () => {
    await setContent(page, `<div style='width: 100px; height: 100px;'>Click me</div>`);
    await page.evaluate(`(() => {
      window.dblclickPromise = new Promise(resolve => {
        document.querySelector('div').addEventListener('dblclick', event => {
          resolve({
            type: event.type,
            detail: event.detail,
            clientX: event.clientX,
            clientY: event.clientY,
            isTrusted: event.isTrusted,
            button: event.button,
          });
        });
      });
    })()`);
    await page.mouse.move(50, 60);
    const opts = { clickCount: 2 };
    await page.mouse.down(opts);
    await page.mouse.up(opts);
    const event: any = await page.evaluate(`window.dblclickPromise`);
    expect(event.type).toBe('dblclick');
    expect(event.detail).toBe(2);
    expect(event.clientX).toBe(50);
    expect(event.clientY).toBe(60);
    expect(event.isTrusted).toBe(true);
    expect(event.button).toBe(0);
  });

  it('should select the text with mouse', async () => {
    await page.goto(`${server.baseUrl}/input/textarea.html`);
    await page.waitForLoad('AllContentLoaded');
    await page.click('textarea');
    const text = "This is the text that we are going to try to select. Let's see how it goes.";
    await page.interact([{ command: 'type', keyboardCommands: [{ string: text }] }]);
    // Firefox needs an extra frame here after typing or it will fail to set the scrollTop
    await page.evaluate(`new Promise(requestAnimationFrame)`);
    await page.evaluate(`(document.querySelector('textarea').scrollTop = 0)`);
    const { x, y } = await page.evaluate(textareaDimensions);
    await page.mouse.move(x + 2, y + 2);
    await page.mouse.down();
    await page.mouse.move(200, 200);
    await page.mouse.up();
    expect(
      await page.evaluate(`(() => {
        const textarea = document.querySelector('textarea');
        return textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      })()`),
    ).toBe(text);
  });

  it('should trigger hover state', async () => {
    await page.goto(`${server.baseUrl}/input/scrollable.html`);
    await page.waitForLoad('AllContentLoaded');
    await hover(page, '#button-6');
    expect(await page.evaluate(`document.querySelector('button:hover').id`)).toBe('button-6');
    await hover(page, '#button-2');
    expect(await page.evaluate(`document.querySelector('button:hover').id`)).toBe('button-2');
  });

  it('should trigger hover state on disabled button', async () => {
    await page.goto(`${server.baseUrl}/input/scrollable.html`);
    await page.waitForLoad('AllContentLoaded');
    await page.evaluate('document.querySelector("#button-6").disabled = true');
    await hover(page, '#button-6');
    expect(await page.evaluate(`document.querySelector('button:hover').id`)).toBe('button-6');
  });

  it('should trigger hover state with removed window.Node', async () => {
    await page.goto(`${server.baseUrl}/input/scrollable.html`);
    await page.waitForLoad('AllContentLoaded');
    await page.evaluate(`delete window.Node`);
    await hover(page, '#button-6');
    expect(await page.evaluate(` document.querySelector('button:hover').id`)).toBe('button-6');
  });

  it('should set modifier keys on click', async () => {
    await page.goto(`${server.baseUrl}/input/scrollable.html`);
    await page.waitForLoad('AllContentLoaded');
    await page.evaluate(`document
        .querySelector('#button-3')
        .addEventListener('mousedown', e => (window.lastEvent = e), true);`);

    const modifiers = new Map<IKeyboardKey, string>([
      ['Shift', 'shiftKey'],
      ['Control', 'ctrlKey'],
      ['Alt', 'altKey'],
      ['Meta', 'metaKey'],
    ]);

    for (const [modifier, key] of modifiers) {
      await page.keyboard.down(modifier);
      await page.click('#button-3');
      if (!(await page.evaluate(`window.lastEvent['${key}']`)))
        throw new Error(`${key} should be true`);
      await page.keyboard.up(modifier);
    }
    await page.click('#button-3');
    for (const [, key] of modifiers) {
      const result = await page.evaluate(`window.lastEvent['${key}']`);
      expect(result).not.toBe(true);
    }
  });

  // PUPPETEER doesn't support drag and drop. Playwright has a solution that dispatches events to the page, a la
  // https://gist.github.com/wardnath/0aa9f293ee964c3a2bc149d9e924822e
  // eslint-disable-next-line jest/no-disabled-tests
  describe.skip('Drag and Drop', () => {
    it('should work', async () => {
      await page.goto(`${server.baseUrl}/drag-n-drop.html`);
      await hover(page, '#source');
      await page.mouse.down();
      await hover(page, '#target');
      await page.mouse.up();
      expect(
        await page.evaluate(
          `document.querySelector('#target').contains(document.querySelector('#source'))`,
        ),
      ).toBe(true); // could not find source in target
    });
  });
});

const textareaDimensions = `(()=>{
        const rect = document.querySelector('textarea').getBoundingClientRect();
        return {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        };
      })();`;

async function hover(page: Page, selector: string) {
  const dimensions: any = await page.evaluate(`(()=>{
        const rect = document.querySelector('${selector}').getBoundingClientRect();
        return {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
          scrollY: window.scrollY
        };
      })();`);
  await page.mouse.move(dimensions.x, dimensions.y);
}
