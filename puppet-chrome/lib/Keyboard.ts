import { IKeyboardKey } from "@secret-agent/core-interfaces/IKeyboardLayoutUS";
import { assert } from "@secret-agent/commons/utils";
import { IKeyDefinition, keyDefinitions } from "../interfaces/USKeyboardLayout";
import { CDPSession } from "./CDPSession";

type KeyDescription = Required<Pick<IKeyDefinition, 'key' | 'text' | 'code' | 'location'>> & {
  keyCode: number;
};

/**
 * Keyboard provides an api for managing a virtual keyboard.
 * The high level api is {@link Keyboard."type"},
 * which takes raw characters and generates proper keydown, keypress/input,
 * and keyup events on your page.
 *
 * @remarks
 * For finer control, you can use {@link Keyboard.down},
 * {@link Keyboard.up}, and {@link Keyboard.sendCharacter}
 * to manually fire events as if they were generated from a real keyboard.
 *
 * On MacOS, keyboard shortcuts like `⌘ A` -\> Select All do not work.
 * See {@link https://github.com/puppeteer/puppeteer/issues/1313 | #1313}.
 *
 * @example
 * An example of holding down `Shift` in order to select and delete some text:
 * ```js
 * await page.keyboard.type('Hello World!');
 * await page.keyboard.press('ArrowLeft');
 *
 * await page.keyboard.down('Shift');
 * for (let i = 0; i < ' World'.length; i++)
 *   await page.keyboard.press('ArrowLeft');
 * await page.keyboard.up('Shift');
 *
 * await page.keyboard.press('Backspace');
 * // Result text will end up saying 'Hello!'
 * ```
 *
 * @example
 * An example of pressing `A`
 * ```js
 * await page.keyboard.down('Shift');
 * await page.keyboard.press('KeyA');
 * await page.keyboard.up('Shift');
 * ```
 *
 * @public
 */
export class Keyboard {
  public modifiers = 0;
  private cdpSession: CDPSession;
  private pressedKeys = new Set<string>();

  constructor(cdpSession: CDPSession) {
    this.cdpSession = cdpSession;
  }

  /**
   * Dispatches a `keydown` event.
   *
   * @remarks
   * If `key` is a single character and no modifier keys besides `Shift`
   * are being held down, a `keypress`/`input` event will also generated.
   * The `text` option can be specified to force an input event to be generated.
   * If `key` is a modifier key, `Shift`, `Meta`, `Control`, or `Alt`,
   * subsequent key presses will be sent with that modifier active.
   * To release the modifier key, use {@link Keyboard.up}.
   *
   * After the key is pressed once, subsequent calls to
   * {@link Keyboard.down} will have
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat | repeat}
   * set to true. To release the key, use {@link Keyboard.up}.
   *
   * Modifier keys DO influence {@link Keyboard.down}.
   * Holding down `Shift` will type the text in upper case.
   *
   * @param key - Name of key to press, such as `ArrowLeft`.
   * See {@link KeyInput} for a list of all key names.
   *
   * @param options - An object of options. Accepts text which, if specified,
   * generates an input event with this text.
   */
  async down(key: IKeyboardKey, options: { text?: string } = { text: undefined }): Promise<void> {
    const description = this._keyDescriptionForString(key);

    const autoRepeat = this.pressedKeys.has(description.code);
    this.pressedKeys.add(description.code);
    this.modifiers |= this._modifierBit(description.key);

    const text = options.text === undefined ? description.text : options.text;
    await this.cdpSession.send('Input.dispatchKeyEvent', {
      type: text ? 'keyDown' : 'rawKeyDown',
      modifiers: this.modifiers,
      windowsVirtualKeyCode: description.keyCode,
      code: description.code,
      key: description.key,
      text,
      unmodifiedText: text,
      autoRepeat,
      location: description.location,
      isKeypad: description.location === 3,
    });
  }

  /**
   * Dispatches a `keyup` event.
   *
   * @param key - Name of key to release, such as `ArrowLeft`.
   * See {@link KeyInput | KeyInput}
   * for a list of all key names.
   */
  async up(key: IKeyboardKey): Promise<void> {
    const description = this._keyDescriptionForString(key);

    this.modifiers &= ~this._modifierBit(description.key);
    this.pressedKeys.delete(description.code);
    await this.cdpSession.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      modifiers: this.modifiers,
      key: description.key,
      windowsVirtualKeyCode: description.keyCode,
      code: description.code,
      location: description.location,
    });
  }

  /**
   * Dispatches a `keypress` and `input` event.
   * This does not send a `keydown` or `keyup` event.
   *
   * @remarks
   * Modifier keys DO NOT effect {@link Keyboard.sendCharacter | Keyboard.sendCharacter}.
   * Holding down `Shift` will not type the text in upper case.
   *
   * @example
   * ```js
   * page.keyboard.sendCharacter('嗨');
   * ```
   *
   * @param char - Character to send into the page.
   */
  async sendCharacter(char: string): Promise<void> {
    await this.cdpSession.send('Input.insertText', { text: char });
  }

  /**
   * Sends a `keydown`, `keypress`/`input`,
   * and `keyup` event for each character in the text.
   *
   * @remarks
   * To press a special key, like `Control` or `ArrowDown`,
   * use {@link Keyboard.press}.
   *
   * Modifier keys DO NOT effect `keyboard.type`.
   * Holding down `Shift` will not type the text in upper case.
   *
   * @example
   * ```js
   * await page.keyboard.type('Hello'); // Types instantly
   * await page.keyboard.type('World', {delay: 100}); // Types slower, like a user
   * ```
   *
   * @param text - A text to type into a focused element.
   * @param options - An object of options. Accepts delay which,
   * if specified, is the time to wait between `keydown` and `keyup` in milliseconds.
   * Defaults to 0.
   */
  async type(text: string, options: { delay?: number } = {}): Promise<void> {
    const delay = options.delay || null;
    for (const char of text) {
      if (this.charIsKey(char)) {
        await this.press(char, { delay });
      } else {
        if (delay) await new Promise(resolve => setTimeout(resolve, delay));
        await this.sendCharacter(char);
      }
    }
  }

  /**
   * Shortcut for {@link Keyboard.down}
   * and {@link Keyboard.up}.
   *
   * @remarks
   * If `key` is a single character and no modifier keys besides `Shift`
   * are being held down, a `keypress`/`input` event will also generated.
   * The `text` option can be specified to force an input event to be generated.
   *
   * Modifier keys DO effect {@link Keyboard.press}.
   * Holding down `Shift` will type the text in upper case.
   *
   * @param key - Name of key to press, such as `ArrowLeft`.
   * See {@link KeyInput} for a list of all key names.
   *
   * @param options - An object of options. Accepts text which, if specified,
   * generates an input event with this text. Accepts delay which,
   * if specified, is the time to wait between `keydown` and `keyup` in milliseconds.
   * Defaults to 0.
   */
  async press(key: IKeyboardKey, options: { delay?: number; text?: string } = {}): Promise<void> {
    const { delay = null } = options;
    await this.down(key, options);
    if (delay) await new Promise(resolve => setTimeout(resolve, options.delay));
    await this.up(key);
  }

  private _modifierBit(key: string): number {
    if (key === 'Alt') return 1;
    if (key === 'Control') return 2;
    if (key === 'Meta') return 4;
    if (key === 'Shift') return 8;
    return 0;
  }

  private _keyDescriptionForString(keyString: IKeyboardKey): KeyDescription {
    const shift = this.modifiers & 8;
    const description = {
      key: '',
      keyCode: 0,
      code: '',
      text: '',
      location: 0,
    };

    const definition = keyDefinitions[keyString];
    assert(definition, `Unknown key: "${keyString}"`);

    if (definition.key) description.key = definition.key;
    if (shift && definition.shiftKey) description.key = definition.shiftKey;

    if (definition.keyCode) description.keyCode = definition.keyCode;
    if (shift && definition.shiftKeyCode) description.keyCode = definition.shiftKeyCode;

    if (definition.code) description.code = definition.code;

    if (definition.location) description.location = definition.location;

    if (description.key.length === 1) description.text = description.key;

    if (definition.text) description.text = definition.text;
    if (shift && definition.shiftText) description.text = definition.shiftText;

    // if any modifiers besides shift are pressed, no text should be sent
    if (this.modifiers & ~8) description.text = '';

    return description;
  }

  private charIsKey(char: string): char is IKeyboardKey {
    return !!keyDefinitions[char];
  }
}
