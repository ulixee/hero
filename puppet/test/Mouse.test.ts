import Chrome80 from '@secret-agent/emulate-chrome-80';
import Chrome83 from '@secret-agent/emulate-chrome-83';
import { IKeyboardKey } from '@secret-agent/core-interfaces/IKeyboardLayoutUS';
import { TestServer } from './server';
import { createTestPage, ITestPage } from './TestPage';
import Puppet from '../index';
import IPuppetContext from '../interfaces/IPuppetContext';
import { getExecutablePath } from '../lib/browserPaths';

describe.each([
  [Chrome80.engine.browser, Chrome80.engine.revision],
  [Chrome83.engine.browser, Chrome83.engine.revision],
])('Frames for %s@%s', (browserEngine: string, revision: string) => {
  let server: TestServer;
  let page: ITestPage;
  let puppet: Puppet;
  let context: IPuppetContext;

  beforeAll(async () => {
    server = await TestServer.create(0);
    const engineExecutablePath = getExecutablePath(browserEngine, revision);
    puppet = new Puppet({ engine: { browser: browserEngine, revision }, engineExecutablePath });
    await puppet.start();
    context = await puppet.newContext({
      userAgent: 'Page tests',
      acceptLanguage: 'en',
      platform: 'Linux',
      proxyPassword: '',
    });
  });

  afterEach(async () => {
    await page.close();
  });

  beforeEach(async () => {
    page = createTestPage(await context.newPage());
    server.reset();
  });

  afterAll(async () => {
    await server.stop();
    await context.close();
    await puppet.close();
  });

  it('should click the document', async () => {
    // Occasionally times out on options.FIREFOX on Windows: https://github.com/microsoft/playwright/pull/1911/checks?check_run_id=607149016
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
    await page.mouse.click(50, 60);
    const event: any = await page.evaluate(`window.clickPromise`);
    expect(event.type).toBe('click');
    expect(event.detail).toBe(1);
    expect(event.clientX).toBe(50);
    expect(event.clientY).toBe(60);
    expect(event.isTrusted).toBe(true);
    expect(event.button).toBe(0);
  });

  it('should dblclick the div', async () => {
    await page.setContent(`<div style='width: 100px; height: 100px;'>Click me</div>`);
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
    await page.mouse.click(50, 60, { clickCount: 2 });
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
    await page.click('textarea');
    const text = "This is the text that we are going to try to select. Let's see how it goes.";
    await page.keyboard.type(text);
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
    await hover(page, '#button-6');
    expect(await page.evaluate(`document.querySelector('button:hover').id`)).toBe('button-6');
    await hover(page, '#button-2');
    expect(await page.evaluate(`document.querySelector('button:hover').id`)).toBe('button-2');
  });

  it('should trigger hover state on disabled button', async () => {
    await page.goto(`${server.baseUrl}/input/scrollable.html`);
    await page.evaluate('document.querySelector("#button-6").disabled = true');
    await hover(page, '#button-6');
    expect(await page.evaluate(`document.querySelector('button:hover').id`)).toBe('button-6');
  });

  it('should trigger hover state with removed window.Node', async () => {
    await page.goto(`${server.baseUrl}/input/scrollable.html`);
    await page.evaluate(`delete window.Node`);
    await hover(page, '#button-6');
    expect(await page.evaluate(` document.querySelector('button:hover').id`)).toBe('button-6');
  });

  it('should set modifier keys on click', async () => {
    await page.goto(`${server.baseUrl}/input/scrollable.html`);
    await page.evaluate(`document
          .querySelector('#button-3')
          .addEventListener('mousedown', e => (window.lastEvent = e), true);`);

    const modifiers = new Map<IKeyboardKey, string>([
      ['Shift', 'shiftKey'],
      ['Control', 'ctrlKey'],
      ['Alt', 'altKey'],
      ['Meta', 'metaKey'],
    ]);

    // In Firefox, the Meta modifier only exists on Mac
    // if (options.FIREFOX && !MAC) delete modifiers.Meta;
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

  it('should tween mouse movement', async () => {
    // The test becomes flaky on WebKit without next line.
    // if (options.WEBKIT) await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.mouse.move(100, 100);
    await page.evaluate(`(() => {
        window.result = [];
        document.addEventListener('mousemove', event => {
          window.result.push([event.clientX, event.clientY]);
        });
      })()`);
    await page.mouse.move(200, 300, { steps: 5 });
    expect(await page.evaluate('result')).toEqual([
      [120, 140],
      [140, 180],
      [160, 220],
      [180, 260],
      [200, 300],
    ]);
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

async function hover(page: ITestPage, selector: string) {
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
