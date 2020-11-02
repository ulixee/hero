# Keyboard
Keyboard provides an api for managing the user's input. The high level api is keyboard.type(), which takes raw characters and generates proper keydown, keypress/input, and keyup events on your page. It also uses our [Huminoids](../advanced-functionality/humanoids) plugins to create realistic, human-like interactions.

Alternatively, you can use keyboard.down, keyboard.up, and keyboard.sendCharacter to manually fire events.

An example of holding down Shift in order to select and delete some text:

```js
await user.keyboard.type('Hello World!');
await user.keyboard.press('ArrowLeft');

await user.keyboard.down('Shift');
for (let i = 0; i < ' World'.length; i++)
  await user.keyboard.press('ArrowLeft');
await user.keyboard.up('Shift');

await user.keyboard.press('Backspace');
// Result text will end up saying 'Hello!'
```

## Constructor
An instance is automatically created during [new SecretAgent()](./secret-agent#constructor). You cannot directly create one.

## Methods

Only the keyboard.type method fully emulates human-like behavior, which is why it's the recommended approach. Other methods should be used sparingly to avoid bot-blockers.

### keyboard.interact*(...interactions)*
Execute a series of keyboard interactions on the page.
#### **Arguments**:
- interactions `Interactions`
#### **Returns**: `Promise`

### keyboard.type<em>(chars\[, chars, ...])</em>
Sends a stream of characters to whichever element currently has focus.
#### **Arguments**:
  - chars `string | object`
#### **Returns**: `Promise`

### keyboard.down<em>(key)</em>
Presses a specific key within the context of whichever element currently on focus.

#### **Arguments**:
  - key `string`
#### **Returns**: `Promise`

If key is a single character and no modifier keys besides Shift are being held down, a keypress/input event will also generated. The text option can be specified to force an input event to be generated.

If key is a modifier key, Shift, Meta, Control, or Alt, subsequent key presses will be sent with that modifier active. To release the modifier key, use keyboard.up.

After the key is pressed once, subsequent calls to keyboard.down will have repeat set to true. To release the key, use keyboard.up.

NOTE Modifier keys DO influence keyboard.down. Holding down Shift will type the text in upper case.

### keyboard.up<em>(key)</em>
Releases a specific key within the context of whichever element currently on focus.

#### **Arguments**:
- key `string`
#### **Returns**: `Promise`

### keyboard.press<em>(key)</em>
Presses and releases a specific key within the context of whichever element currently has focus.

#### **Arguments**:
  - key `string`
#### **Returns**: `Promise`
