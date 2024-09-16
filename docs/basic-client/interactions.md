# Interactions

Every Hero instance has an `interact()` method, which allow you to control the mouse and keyboard. `Interactions` are simple key/value objects you pass into this method:

```js
hero.interact({ move: [100, 356] });
```

Multiple Interactions can be passed through as multiple arguments:

```js
hero.interact({ click: [250, 356] }, { type: 'hello world' });
```

The timing of Interactions are controlled by the [Unblocked Agent](https://github.com/ulixee/hero/tree/main/agent) and its [Plugins](https://github.com/ulixee/hero/tree/main/specification), which powers the core browser engine underneath Hero. This allows for realistic-looking, human-like movements on the remote webpage.

Interaction Commands fall into three broad categories:

- Mouse Commands
- Keyboard Commands

## The Six Mouse Commands

- scroll [`MousePosition`](#mouseposition) Scroll page to the desired position.
- move [`MousePosition`](#mouseposition) Move cursor to the desired position.
- click [`MousePosition`](#mouseposition) Press and release the mouse button as a single click.
- clickDown [`MousePosition`](#mouseposition) Press the mouse button.
- clickUp [`MousePosition`](#mouseposition) Release the mouse button.
- doubleclick [`MousePosition`](#mouseposition) Press and release the mouse button twice in rapid succession.

#### **MousePosition**:

Every mouse command include a [`MousePosition`](#mouseposition) value, which specifies where the interaction takes place. It accepts three possible options:

- `[x, y]` These are pixels relative to the top-left corner of the viewport.
- [`SuperElement`](../awaited-dom/super-element.md) Any element from the AwaitedDOM, which are translated into x/y coordinates.
- { element: [`SuperElement`](../awaited-dom/super-element.md), verification: [`ClickVerification`](#clickverification) } An element with a specified click verification strategy.
- `null` Leave the mouse in its current position.

For example, here's how to hover over a link:

```js
const aElem = hero.document.querySelector('a.more-information');
hero.interact({ move: aElem });
```

Or double-click on a specific x/y coordinate:

```js
hero.interact({ doubleclick: [50, 150] });
```

#### **Dictating Left, Middle or Right**:

All button commands (click, doubleclick, etc) operate on the `Left` button by default. However, you can affix any of these commands with `Left`, `Middle` or `Right` to specify a specific button. For example:

```js
hero.interact({ clickRight: [55, 42] });
```

#### **ClickVerification**: {#click-verification}

Click commands can include a click verification when a [`SuperElement`](../awaited-dom/super-element.md) is provided as the `MousePosition`. This is the strategy used to confirm that a specific element is clicked after scrolling and moving the mouse over the target. The default verification is `elementAtPath` if none is provided.

The web has evolved to include sites where "Elements" on some sites are swapped in and out many times as the site is rendered with new data (think React, Vue, Svelte, etc).

During a normal interaction, the [`SuperElement`](../awaited-dom/super-element.md) will be looked up at the beginning of the operation to confirm location and current visibility/clickability. Verification that the given element was actually clicked are:

- `exactElement`. This verification strategy checks that the original node is clicked. This works on most sites, but can fail on dynamic sites, or where data is updating the site (eg, a select list being updated by your type interactions).
- `elementAtPath` Default Option. This verification approach will first check `exactElement`. If the original element is no longer attached or visible, it will re-check the full path to the [`SuperElement`](../awaited-dom/super-element.md) and click on any refreshed node.
- `none`. Do not verify clicks. This approach will scroll and click on the last known position of the element - eg, you ran [`hero.getComputedVisibility *(element)*`](./hero.md#get-computed-visibility) or `element.getBoundingClientRect()`. If the position hasn't been previously looked up, it will be looked up once during the interact command. The position of the element will be used to scroll, move the mouse and click.

Verification strategies can be provided to click/doubleclick commands with a [`SuperElement`](../awaited-dom/super-element.md) as the `MousePosition`. If you don't provide a verification strategy, `elementAtPath` will be used by default.

```js
const aElem = hero.document.querySelector('a.more-information');
hero.interact({ click: { element: aElem, verification: 'exactElement' } });
```

## The Four Keyboard Commands

- keyPress: `KeyboardChar`
- keyDown: `KeyboardChar`
- keyUp: `KeyboardChar`
- type: `(string | KeyboardChar)[]`

Import KeyboardKey from IKeyboardLayoutUS for all valid KeyboardChar values (e.g. `KeyboardKey['\n']`, `KeyboardKey.Enter`).

## Using Shortcuts

If you have no need to change the position of the mouse between commands you can create Interactions using simple `Command` strings.

For example, follow up a move command with click:

```js
hero.interact({ move: [55, 42] }, 'click');
```

## Combining Commands

A single Interaction can include multiple commands. Multiple commands within a single Interaction are executed in rapid succession by the HumanEmulator.

Interactions are similar to paragraphs. The HumanEmulator adds a longer pause between Interactions then it does between commands within a single Interaction.

For example, this allows you to implement simple drag and drop interactions:

```js
hero.interact({ clickDown: [55, 42], move: [155, 142] }, 'clickUp');
```

When multiple commands are combined within a single Interaction, their execution takes the following order:

1. waitForMillis
2. click
3. doubleclick
4. clickDown
5. scroll
6. move
7. clickUp
8. keyPress
9. keyDown
10. type
11. keyUp

Note: Although commands within a single Interaction are sometimes executed at "nearly" the same time, it is never at the same precise moment. Their execution always follows the order listed above.

## When You Shouldn't Combine Commands

It's important to understand that combining multiple commands into a single Interaction usually produces different effects than splitting across multiple Interactions.

For example, there is a subtle but important difference between the following three code blocks:

<label>
  Example #1
</label>

```js
hero.interact({ clickDown: [55, 42] });
```

<label>
  Example #2
</label>

```js
hero.interact({ move: [55, 42], clickDown: [5, 5] });
```

<label>
  Example #2
</label>

```js
hero.interact({ move: [55, 42] }, { clickDown: [5, 5] });
```

The first example moves the cursor to 55x42 before pressing the mouse down.

The second example does the opposite. It presses the mouse down at 5x5 before moving the cursor to 55x42 (see Combining Commands section above).

The third command moves the mouse to 55x42, pauses, then moves the mouse to 5x5 before clicking down.

## Conflicting Commands Will Throw Errors

An error will be thrown if you send commands that conflict with each other.

For example, the following example blows up when doubleclick is called while the mouse is still down:

```js
hero.interact({ clickDown: [55, 42] }, { doubleclick: [5, 5] });
```

You can fix this by releasing the down:

```js
hero.interact({ clickDown: [55, 42] }, 'up', { doubleclick: [5, 5] });
```
