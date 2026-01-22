"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Keyboard = void 0;
const utils_1 = require("@ulixee/commons/lib/utils");
const KeyboardLayoutUS_1 = require("./KeyboardLayoutUS");
class Keyboard {
    constructor(devtoolsSession) {
        this.modifiers = 0;
        this.pressedKeys = new Set();
        this.devtoolsSession = devtoolsSession;
    }
    async down(key) {
        const description = this.keyDescriptionForString(key);
        const autoRepeat = this.pressedKeys.has(description.code);
        this.pressedKeys.add(description.code);
        this.modifiers |= Keyboard.modifierBit(description.key);
        const commands = this.macCommandsForCode(description.code);
        const text = description.text;
        await this.devtoolsSession.send('Input.dispatchKeyEvent', {
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
            commands,
        });
    }
    async command(command) {
        await this.devtoolsSession.send('Input.dispatchKeyEvent', {
            type: 'rawKeyDown',
            commands: [command],
        });
    }
    async up(key) {
        const description = this.keyDescriptionForString(key);
        this.modifiers &= ~Keyboard.modifierBit(description.key);
        this.pressedKeys.delete(description.code);
        await this.devtoolsSession.send('Input.dispatchKeyEvent', {
            type: 'keyUp',
            modifiers: this.modifiers,
            key: description.key,
            windowsVirtualKeyCode: description.keyCode,
            code: description.code,
            location: description.location,
        });
    }
    async sendCharacter(char) {
        await this.devtoolsSession.send('Input.insertText', { text: char });
    }
    async press(key, keyupDelay) {
        await this.down(key);
        if (keyupDelay)
            await new Promise(resolve => setTimeout(resolve, keyupDelay));
        await this.up(key);
    }
    async insertText(text) {
        await this.devtoolsSession.send('Input.insertText', { text });
    }
    keyDescriptionForString(keyString) {
        const shift = this.modifiers & 8;
        const description = {
            key: '',
            keyCode: 0,
            code: '',
            text: '',
            location: 0,
        };
        const definition = KeyboardLayoutUS_1.keyDefinitions[keyString];
        (0, utils_1.assert)(definition, `Unknown key: "${keyString}"`);
        if (definition.key)
            description.key = definition.key;
        if (shift && definition.shiftKey)
            description.key = definition.shiftKey;
        if (definition.keyCode)
            description.keyCode = definition.keyCode;
        if (shift && definition.shiftKeyCode)
            description.keyCode = definition.shiftKeyCode;
        if (definition.code)
            description.code = definition.code;
        if (definition.location)
            description.location = definition.location;
        if (description.key.length === 1)
            description.text = description.key;
        if (definition.text)
            description.text = definition.text;
        if (shift && definition.shiftText)
            description.text = definition.shiftText;
        // if any modifiers besides shift are pressed, no text should be sent
        if (this.modifiers & ~8)
            description.text = '';
        return description;
    }
    macCommandsForCode(code) {
        const parts = ['Shift', 'Control', 'Alt', 'Meta'].filter(x => this.isModifierActive(x));
        parts.push(code);
        const shortcut = parts.join('+');
        const commandShortcuts = process.platform === 'darwin' ? macEditingCommands : otherOsEditingCommands;
        let commands = sharedEditingCommands[shortcut] ?? commandShortcuts[shortcut] ?? [];
        if (typeof commands === 'string')
            commands = [commands];
        // Commands that insert text are not supported
        commands = commands.filter(x => !x.startsWith('insert'));
        // remove the trailing : to match the Chromium command names.
        return commands;
    }
    isModifierActive(key) {
        return (this.modifiers & Keyboard.modifierBit(key)) !== 0;
    }
    static modifierBit(key) {
        if (key === 'Alt')
            return 1;
        if (key === 'Control')
            return 2;
        if (key === 'Meta')
            return 4;
        if (key === 'Shift')
            return 8;
        return 0;
    }
}
exports.Keyboard = Keyboard;
const sharedEditingCommands = {
    Backspace: 'deleteBackward',
    Enter: 'insertNewline',
    Insert: 'overWrite',
    NumpadEnter: 'insertNewline',
    Escape: 'cancelOperation',
    ArrowUp: 'moveUp',
    ArrowDown: 'moveDown',
    ArrowLeft: 'moveLeft',
    ArrowRight: 'moveRight',
    F5: 'complete',
    Delete: 'deleteForward',
    Home: 'scrollToBeginningOfDocument', // chromium says MoveToBeginningOfLine
    End: 'scrollToEndOfDocument', // chromium says MoveToEndOfLine
    PageUp: 'scrollPageUp',
    PageDown: 'scrollPageDown',
    'Shift+Backspace': 'deleteBackward',
    'Shift+Enter': 'insertNewline',
    'Shift+NumpadEnter': 'insertNewline',
    'Shift+Escape': 'cancelOperation',
    'Shift+ArrowUp': 'moveUpAndModifySelection',
    'Shift+ArrowDown': 'moveDownAndModifySelection',
    'Shift+ArrowLeft': 'moveLeftAndModifySelection',
    'Shift+ArrowRight': 'moveRightAndModifySelection',
    'Shift+F5': 'complete',
    'Shift+Home': 'moveToBeginningOfDocumentAndModifySelection',
    'Shift+End': 'moveToEndOfDocumentAndModifySelection',
    'Shift+PageUp': 'pageUpAndModifySelection',
    'Shift+PageDown': 'pageDownAndModifySelection',
    'Shift+Numpad5': 'delete',
    'Shift+Tab': 'insertBacktab',
    'Shift+Insert': 'paste',
    'Control+Insert': 'copy',
    'Shift+Delete': 'cut',
    'Shift+Control': 'cut',
    'Control+KeyU': 'toggleUnderline',
    'Shift+Alt+Enter': 'insertNewline',
};
// BAB: copied from Playwright (https://github.com/microsoft/playwright/blob/afae5bef5db1e0e8147a614b9933e31fc56c0076/src/server/macEditingCommands.ts)
const macEditingCommands = {
    'Control+Tab': 'selectNextKeyView',
    'Control+Enter': 'insertLineBreak',
    'Control+NumpadEnter': 'insertLineBreak',
    'Control+Quote': 'insertSingleQuoteIgnoringSubstitution',
    'Control+KeyA': 'moveToBeginningOfParagraph',
    'Control+KeyB': 'moveBackward',
    'Control+KeyD': 'deleteForward',
    'Control+KeyE': 'moveToEndOfParagraph',
    'Control+KeyF': 'moveForward',
    'Control+KeyH': 'deleteBackward',
    'Control+KeyK': 'deleteToEndOfParagraph',
    'Control+KeyL': 'centerSelectionInVisibleArea',
    'Control+KeyN': 'moveDown',
    'Control+KeyO': ['insertNewlineIgnoringFieldEditor', 'moveBackward'],
    'Control+KeyP': 'moveUp',
    'Control+KeyT': 'transpose',
    'Control+KeyV': 'pageDown',
    'Control+KeyY': 'yank',
    'Control+Backspace': 'deleteBackwardByDecomposingPreviousCharacter',
    'Control+ArrowUp': 'scrollPageUp',
    'Control+ArrowDown': 'scrollPageDown',
    'Control+ArrowLeft': 'moveToLeftEndOfLine',
    'Control+ArrowRight': 'moveToRightEndOfLine',
    'Shift+Control+Enter': 'insertLineBreak',
    'Shift+Control+NumpadEnter': 'insertLineBreak',
    'Shift+Control+Tab': 'selectPreviousKeyView',
    'Shift+Control+Quote': 'insertDoubleQuoteIgnoringSubstitution',
    'Shift+Control+KeyA': 'moveToBeginningOfParagraphAndModifySelection',
    'Shift+Control+KeyB': 'moveBackwardAndModifySelection',
    'Shift+Control+KeyE': 'moveToEndOfParagraphAndModifySelection',
    'Shift+Control+KeyF': 'moveForwardAndModifySelection',
    'Shift+Control+KeyN': 'moveDownAndModifySelection',
    'Shift+Control+KeyP': 'moveUpAndModifySelection',
    'Shift+Control+KeyV': 'pageDownAndModifySelection',
    'Shift+Control+Backspace': 'deleteBackwardByDecomposingPreviousCharacter',
    'Shift+Control+ArrowUp': 'scrollPageUp',
    'Shift+Control+ArrowDown': 'scrollPageDown',
    'Shift+Control+ArrowLeft': 'moveToLeftEndOfLineAndModifySelection',
    'Shift+Control+ArrowRight': 'moveToRightEndOfLineAndModifySelection',
    'Alt+Backspace': 'deleteWordBackward',
    'Alt+Enter': 'insertNewlineIgnoringFieldEditor',
    'Alt+NumpadEnter': 'insertNewlineIgnoringFieldEditor',
    'Alt+Escape': 'complete',
    'Alt+ArrowUp': ['moveBackward', 'moveToBeginningOfParagraph'],
    'Alt+ArrowDown': ['moveForward', 'moveToEndOfParagraph'],
    'Alt+ArrowLeft': 'moveWordLeft',
    'Alt+ArrowRight': 'moveWordRight',
    'Alt+Delete': 'deleteWordForward',
    'Alt+PageUp': 'pageUp',
    'Alt+PageDown': 'pageDown',
    'Shift+Alt+Backspace': 'deleteWordBackward',
    'Shift+Alt+Enter': 'insertNewlineIgnoringFieldEditor',
    'Shift+Alt+NumpadEnter': 'insertNewlineIgnoringFieldEditor',
    'Shift+Alt+Escape': 'complete',
    'Shift+Alt+ArrowUp': 'moveParagraphBackwardAndModifySelection',
    'Shift+Alt+ArrowDown': 'moveParagraphForwardAndModifySelection',
    'Shift+Alt+ArrowLeft': 'moveWordLeftAndModifySelection',
    'Shift+Alt+ArrowRight': 'moveWordRightAndModifySelection',
    'Shift+Alt+Delete': 'deleteWordForward',
    'Shift+Alt+PageUp': 'pageUp',
    'Shift+Alt+PageDown': 'pageDown',
    'Control+Alt+KeyB': 'moveWordBackward',
    'Control+Alt+KeyF': 'moveWordForward',
    'Control+Alt+Backspace': 'deleteWordBackward',
    'Shift+Control+Alt+KeyB': 'moveWordBackwardAndModifySelection',
    'Shift+Control+Alt+KeyF': 'moveWordForwardAndModifySelection',
    'Shift+Control+Alt+Backspace': 'deleteWordBackward',
    'Meta+NumpadSubtract': 'cancel',
    'Meta+Backspace': 'deleteToBeginningOfLine',
    'Meta+ArrowUp': 'moveToBeginningOfDocument',
    'Meta+ArrowDown': 'moveToEndOfDocument',
    'Meta+ArrowLeft': 'moveToLeftEndOfLine',
    'Meta+ArrowRight': 'moveToRightEndOfLine',
    'Shift+Meta+NumpadSubtract': 'cancel',
    'Shift+Meta+Backspace': 'deleteToBeginningOfLine',
    'Shift+Meta+ArrowUp': 'moveToBeginningOfDocumentAndModifySelection',
    'Shift+Meta+ArrowDown': 'moveToEndOfDocumentAndModifySelection',
    'Shift+Meta+ArrowLeft': 'moveToLeftEndOfLineAndModifySelection',
    'Shift+Meta+ArrowRight': 'moveToRightEndOfLineAndModifySelection',
    'Meta+KeyA': 'selectAll',
    'Meta+KeyC': 'copy',
    'Meta+KeyX': 'cut',
    'Meta+KeyV': 'paste',
    'Meta+KeyZ': 'undo',
    'Meta+KeyY': 'redo',
    'Shift+Meta+KeyV': 'pasteAndMatchStyle',
};
// https://github.com/chromium/chromium/blob/c4d3c31083a2e1481253ff2d24298a1dfe19c754/third_party/blink/renderer/core/editing/editing_behavior.cc
const otherOsEditingCommands = {
    'Control+ArrowLeft': 'moveWordLeft',
    'Control+ArrowRight': 'moveWordRight',
    'Control+Home': 'moveToBeginningOfDocument',
    'Control+End': 'moveToEndOfDocument',
    'Control+Backspace': 'deleteWordBackward',
    'Control+Delete': 'deleteWordForward',
    'Control+KeyB': 'toggleBold',
    'Control+KeyI': 'toggleItalic',
    'Shift+Control+ArrowLeft': 'moveWordLeftAndModifySelection',
    'Shift+Control+ArrowRight': 'moveWordRightAndModifySelection',
    'Shift+Control+Home': 'moveToBeginningOfDocumentAndModifySelection',
    'Shift+Control+End': 'moveToEndOfDocumentAndModifySelection',
    'Control+KeyA': 'selectAll',
    'Control+KeyC': 'copy',
    'Control+KeyX': 'cut',
    'Control+KeyV': 'paste',
    'Control+KeyZ': 'undo',
    'Control+KeyY': 'redo',
    'Shift+Control+KeyZ': 'redo',
    'Shift+Control+KeyV': 'pasteAndMatchStyle',
};
//# sourceMappingURL=Keyboard.js.map