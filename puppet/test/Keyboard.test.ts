import { IKeyboardKey } from '@ulixee/hero-interfaces/IKeyboardLayoutUS';
import Log from '@ulixee/commons/Logger';
import IPuppetContext from '@ulixee/hero-interfaces/IPuppetContext';
import CorePlugins from '@ulixee/hero-core/lib/CorePlugins';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import Core from '@ulixee/hero-core';
import { TestServer } from './server';
import { createTestPage, ITestPage } from './TestPage';
import Puppet from '../index';
import CustomBrowserEmulator from './_CustomBrowserEmulator';

const { log } = Log(module);
const browserEmulatorId = CustomBrowserEmulator.id;
const MAC = process.platform === 'darwin';

describe('Keyboard', () => {
  let server: TestServer;
  let page: ITestPage;
  let puppet: Puppet;
  let context: IPuppetContext;

  beforeAll(async () => {
    Core.use(CustomBrowserEmulator);
    server = await TestServer.create(0);
    puppet = new Puppet(CustomBrowserEmulator.selectBrowserMeta().browserEngine);
    await puppet.start();
    const plugins = new CorePlugins({ browserEmulatorId }, log as IBoundLog);
    context = await puppet.newContext(plugins, log);
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

  it('should type into a textarea', async () => {
    await page.evaluate(`(() => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
    })()`);
    await page.click('textarea');
    const text = 'Hello world. I am the text that was typed!';
    await page.type(text);
    expect(await page.evaluate(`(() => document.querySelector('textarea').value)()`)).toBe(text);
  });

  it('should move with the arrow keys', async () => {
    await page.goto(`${server.baseUrl}/input/textarea.html`);
    await page.click('textarea');
    await page.type('Hello World!');
    expect(await page.evaluate(`document.querySelector('textarea').value`)).toBe('Hello World!');
    for (let i = 0; i < 'World!'.length; i += 1) await page.keyboard.press('ArrowLeft');
    await page.type('inserted ');
    expect(await page.evaluate(`document.querySelector('textarea').value`)).toBe(
      'Hello inserted World!',
    );
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'inserted '.length; i += 1) await page.keyboard.press('ArrowLeft');
    await page.keyboard.up('Shift');
    await page.keyboard.press('Backspace');
    expect(await page.evaluate(`document.querySelector('textarea').value`)).toBe('Hello World!');
  });

  it('should send a character with type', async () => {
    await page.goto(`${server.baseUrl}/input/textarea.html`);
    await page.click('textarea');
    await page.keyboard.sendCharacter('嗨');
    expect(await page.evaluate(`document.querySelector('textarea').value`)).toBe('嗨');
    await page.evaluate(`window.addEventListener('keydown', e => e.preventDefault(), true)`);
    await page.keyboard.sendCharacter('a');
    expect(await page.evaluate(`document.querySelector('textarea').value`)).toBe('嗨a');
  });

  it('should report shiftKey', async () => {
    await page.goto(`${server.baseUrl}/input/keyboard.html`);
    const keyboard = page.keyboard;
    const codeForKey = new Map<IKeyboardKey, number>([
      ['Shift', 16],
      ['Alt', 18],
      ['Control', 17],
    ]);
    for (const [modifierKey, modifierCode] of codeForKey) {
      await keyboard.down(modifierKey);
      expect(await page.evaluate('getResult()')).toBe(
        `Keydown: ${modifierKey} ${modifierKey}Left ${modifierCode} [${modifierKey}]`,
      );
      await keyboard.down('!');
      // Shift+! will generate a keypress
      if (modifierKey === 'Shift')
        expect(await page.evaluate('getResult()')).toBe(
          `Keydown: ! Digit1 49 [${modifierKey}]\nKeypress: ! Digit1 33 33 [${modifierKey}]`,
        );
      else expect(await page.evaluate('getResult()')).toBe(`Keydown: ! Digit1 49 [${modifierKey}]`);

      await keyboard.up('!');
      expect(await page.evaluate('getResult()')).toBe(`Keyup: ! Digit1 49 [${modifierKey}]`);
      await keyboard.up(modifierKey);
      expect(await page.evaluate('getResult()')).toBe(
        `Keyup: ${modifierKey} ${modifierKey}Left ${modifierCode} []`,
      );
    }
  });

  it('should report multiple modifiers', async () => {
    await page.goto(`${server.baseUrl}/input/keyboard.html`);
    const keyboard = page.keyboard;
    await keyboard.down('Control');
    expect(await page.evaluate('getResult()')).toBe('Keydown: Control ControlLeft 17 [Control]');
    await keyboard.down('Alt');
    expect(await page.evaluate('getResult()')).toBe('Keydown: Alt AltLeft 18 [Alt Control]');
    await keyboard.down(';');
    expect(await page.evaluate('getResult()')).toBe('Keydown: ; Semicolon 186 [Alt Control]');
    await keyboard.up(';');
    expect(await page.evaluate('getResult()')).toBe('Keyup: ; Semicolon 186 [Alt Control]');
    await keyboard.up('Control');
    expect(await page.evaluate('getResult()')).toBe('Keyup: Control ControlLeft 17 [Alt]');
    await keyboard.up('Alt');
    expect(await page.evaluate('getResult()')).toBe('Keyup: Alt AltLeft 18 []');
  });

  it('should send proper codes while typing', async () => {
    await page.goto(`${server.baseUrl}/input/keyboard.html`);
    await page.type('!');
    expect(await page.evaluate('getResult()')).toBe(
      ['Keydown: ! Digit1 49 []', 'Keypress: ! Digit1 33 33 []', 'Keyup: ! Digit1 49 []'].join(
        '\n',
      ),
    );
    await page.type('^');
    expect(await page.evaluate('getResult()')).toBe(
      ['Keydown: ^ Digit6 54 []', 'Keypress: ^ Digit6 94 94 []', 'Keyup: ^ Digit6 54 []'].join(
        '\n',
      ),
    );
  });

  it('should send proper codes while typing with shift', async () => {
    await page.goto(`${server.baseUrl}/input/keyboard.html`);
    const keyboard = page.keyboard;
    await keyboard.down('Shift');
    await page.type('~');
    expect(await page.evaluate('getResult()')).toBe(
      [
        'Keydown: Shift ShiftLeft 16 [Shift]',
        'Keydown: ~ Backquote 192 [Shift]', // 192 is ` keyCode
        'Keypress: ~ Backquote 126 126 [Shift]', // 126 is ~ charCode
        'Keyup: ~ Backquote 192 [Shift]',
      ].join('\n'),
    );
    await keyboard.up('Shift');
  });

  it('should not type canceled events', async () => {
    await page.goto(`${server.baseUrl}/input/textarea.html`);
    await page.click('textarea');
    await page.evaluate(`(() => {
      window.addEventListener('keydown', event => {
        event.stopPropagation();
        event.stopImmediatePropagation();
        if (event.key === 'l')
          event.preventDefault();
        if (event.key === 'o')
          event.preventDefault();
      }, false);
    })()`);
    await page.type('Hello World!');
    expect(await page.evaluate(`document.querySelector('textarea').value`)).toBe('He Wrd!');
  });

  it('should specify repeat property', async () => {
    await page.goto(`${server.baseUrl}/input/textarea.html`);
    await page.click('textarea');
    await page.keyboard.down('a');

    expect((await captureLastKeydown(page)).repeat).toBe(false);

    await page.keyboard.press('a');
    expect((await captureLastKeydown(page)).repeat).toBe(true);

    await page.keyboard.down('b');
    expect((await captureLastKeydown(page)).repeat).toBe(false);

    await page.keyboard.down('b');
    expect((await captureLastKeydown(page)).repeat).toBe(true);

    await page.keyboard.up('a');
    await page.keyboard.down('a');

    expect((await captureLastKeydown(page)).repeat).toBe(false);
  });

  it('should type all kinds of characters', async () => {
    await page.goto(`${server.baseUrl}/input/textarea.html`);
    await page.click('textarea');
    const text = 'This text goes onto two lines.\nThis character is 嗨.';
    await page.type(text);
    expect(await page.evaluate(`document.querySelector('textarea').value`)).toBe(text);
  });

  it('should specify location', async () => {
    await page.goto(`${server.baseUrl}/input/textarea.html`);
    await captureLastKeydown(page); // install
    await page.click(`textarea`);

    await page.keyboard.press('Digit5');
    expect((await captureLastKeydown(page)).location).toBe(0);

    await page.keyboard.press('ControlLeft');
    expect((await captureLastKeydown(page)).location).toBe(1);

    await page.keyboard.press('ControlRight');
    expect((await captureLastKeydown(page)).location).toBe(2);

    await page.keyboard.press('NumpadSubtract');
    expect((await captureLastKeydown(page)).location).toBe(3);
  });

  it('should press Enter', async () => {
    await page.setContent('<textarea></textarea>');
    await captureLastKeydown(page);
    await testEnterKey('Enter', 'Enter', 'Enter');
    await testEnterKey('NumpadEnter', 'Enter', 'NumpadEnter');
    await testEnterKey('\n', 'Enter', 'Enter');
    await testEnterKey('\r', 'Enter', 'Enter');

    async function testEnterKey(key, expectedKey, expectedCode) {
      await page.click('textarea');
      await page.keyboard.press(key);

      const lastEvent = await captureLastKeydown(page);
      expect(lastEvent.key).toBe(expectedKey); // had the wrong key
      expect(lastEvent.code).toBe(expectedCode); // had the wrong code
      const value = await page.evaluate(`document.querySelector('textarea').value`);
      expect(value).toBe('\n'); // failed to create a newline
      await page.evaluate(`document.querySelector('textarea').value = ''`);
    }
  });

  it('should throw on unknown keys', async () => {
    // @ts-ignore-error
    let error = await page.keyboard.press('NotARealKey').catch(e => e);
    expect(error.message).toBe('Unknown key: "NotARealKey"');

    // @ts-ignore-error
    error = await page.keyboard.press('ё').catch(e => e);
    expect(error && error.message).toBe('Unknown key: "ё"');

    // @ts-ignore-error
    error = await page.keyboard.press('😊').catch(e => e);
    expect(error && error.message).toBe('Unknown key: "😊"');
  });

  it('should type emoji', async () => {
    await page.goto(`${server.baseUrl}/input/textarea.html`);
    await page.click('textarea');
    await page.type('👹 Tokyo street Japan 🇯🇵');
    expect(await page.evaluate(`document.querySelector('textarea').value`)).toBe(
      '👹 Tokyo street Japan 🇯🇵',
    );
  });

  it('should type emoji into an iframe', async () => {
    await page.goto(server.emptyPage);
    await page.attachFrame('emoji-test', `${server.baseUrl}/input/textarea.html`);
    const textArea =
      'document.querySelector("#emoji-test").contentWindow.document.body.querySelector("textarea")';
    await page.evaluate(`(() => {

    const rect = ${textArea}.focus()
  })()`);
    await page.type('👹 Tokyo street Japan 🇯🇵');

    expect(await page.evaluate(`${textArea}.value`)).toBe('👹 Tokyo street Japan 🇯🇵');
  });

  // playwright test that we didn't copy the logic for - would need to add "mac editing shortcuts"
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('should handle selectAll', async () => {
    await page.goto(`${server.baseUrl}/input/textarea.html`);
    await page.click('textarea');
    await page.type('some text');
    const modifier = MAC ? 'Meta' : 'Control';
    await page.keyboard.down(modifier);
    await page.keyboard.press('a');
    await page.keyboard.up(modifier);
    await page.keyboard.press('Backspace');
    expect(await page.evaluate(`document.querySelector('textarea').value`)).toBe('');
  });

  it('should be able to prevent selectAll', async () => {
    await page.goto(`${server.baseUrl}/input/textarea.html`);
    await page.click('textarea');
    await page.type('some text');
    await page.evaluate(`(() => {
      document.querySelector('textarea').addEventListener(
        'keydown',
        event => {
          if (event.key === 'a' && (event.metaKey || event.ctrlKey)) event.preventDefault();
        },
        false,
      );
    })()`);
    const modifier = MAC ? 'Meta' : 'Control';
    await page.keyboard.down(modifier);
    await page.keyboard.press('a');
    await page.keyboard.up(modifier);
    await page.keyboard.press('Backspace');
    expect(await page.evaluate(`document.querySelector('textarea').value`)).toBe('some tex');
  });

  it('should press the meta key', async () => {
    await captureLastKeydown(page);
    await page.keyboard.press('Meta');
    const lastEvent = await captureLastKeydown(page);
    const { key, code, metaKey } = lastEvent;
    // if (options.FIREFOX && !MAC) expect(key).toBe('OS');
    // else
    expect(key).toBe('Meta');

    // if (options.FIREFOX) expect(code).toBe('OSLeft');
    // else
    expect(code).toBe('MetaLeft');

    // if (options.FIREFOX && !MAC) expect(metaKey).toBe(false);
    // else
    expect(metaKey).toBe(true);
  });

  it('should work after a cross origin navigation', async () => {
    await page.goto(`${server.baseUrl}/empty.html`);
    await page.goto(`${server.crossProcessBaseUrl}/empty.html`);
    await captureLastKeydown(page);
    await page.keyboard.press('a');
    const lastEvent = await captureLastKeydown(page);
    expect(lastEvent.key).toBe('a');
  });
});

async function captureLastKeydown(page: ITestPage): Promise<any> {
  return await page.evaluate(`(() => {
    if (window.lastEvent) return window.lastEvent;
    const lastEvent = {
      repeat: false,
      location: -1,
      code: '',
      key: '',
      metaKey: false,
      keyIdentifier: 'unsupported',
    };
    window.lastEvent = lastEvent;
    document.addEventListener(
      'keydown',
      e => {
        lastEvent.repeat = e.repeat;
        lastEvent.location = e.location;
        lastEvent.key = e.key;
        lastEvent.code = e.code;
        lastEvent.metaKey = e.metaKey;
        // keyIdentifier only exists in WebKit, and isn't in TypeScript's lib.
        lastEvent.keyIdentifier = 'keyIdentifier' in e && e.keyIdentifier;
      },
      true,
    );
    return lastEvent;
  })()`);
}
