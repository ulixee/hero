# Mouse

Every SecretAgent instance has its own Mouse instance, accessible through user.mouse or user.mouse. It uses an emulation layer, called [Huminoids](../advanced-functionality/humanoids), to create realistic-looking, human-like interactions.

## Constructor
An instance is automatically created during [new SecretAgent()](./secret-agent#constructor). You cannot directly create one.

## Methods

### mouse.interact*(interaction\[, interaction, ...])*
Execute a series of mouse interactions on the current webpage.
#### **Arguments**:
- interaction `Interaction`
#### **Returns**: `Promise`

Refer to the Interaction Object section below for details on how to construct an interaction.

## Interaction Object

Interactions are meta command objects that provide high-level guidance for how the Humanoid should control your mouse.

#### **Properties**:
- \[`Commands`]: `MousePosition`
- waitForNode: `SuperNode`
- waitForElementVisible: `SuperElement`
- waitForMillis: `number`

### The Five Commands

Commands as given as a key/value combination. There are five primary keys:
#### **Key**:
- `move` Move the cursor.
- `click` Press and release the mouse button.
- `doubleclick` Press and release the mouse button twice in rapid succession.
- `down` Press the mouse button.
- `up` Release the mouse button.

#### **Value**:
Every command must include a `MousePosition` value specifying where the interaction takes place. It accepts three possible options:
- `[x, y]` These are pixels relative to the top-left corner of the viewport.
- `SuperElement` Any element from the AwaitedDOM which will be translated into x/y.
- `null` Leave the mouse where it currently sits.

For example, here's how you would hover over a link:

```js
const aElem = agent.document.querySelector('a.more-information');
user.mouse.interact({ move: aElem });
`````

Or double-click on a specific x/y coordinate:
```js
user.mouse.interact({ doubleclick: [50, 150] });
`````

#### **Dictating Left, Middle or Right**:
All button commands (up, down, etc) operate on the `Left` button by default. However, you can affix any of these commands with `Left`, `Middle` or `Right` to specify a specific button. For example:

```js
user.mouse.interact({ clickLeft: [55, 42] });
````

### Using Shortcuts

If you have no need to change the position of the mouse between commands (or other complexities, such as `waitFor`), you can create Interactions using simple `Command` strings.

For example, follow up a move command with click:

```js
user.mouse.interact({ move: [55, 42] }, 'click');
````

### Combining Commands

A single interaction can include multiple commands. Multiple commands within a single Interaction are executed in rapid succession by the Humanoid.

Interactions are similar to paragraphs. The Humanoid adds a longer pause between Interactions then it does between commands within a single Interaction.

For example, this allows you to implement simple drag and drop interactions:

```js
user.mouse.interact({ down: [55, 42], move: [155, 142] });
````

When multiple commands are combined within a single Interaction, their execution takes the following order:

1. click
2. doubleclick
3. down
4. move
5. up

###  Down vs Move+Down vs Move->Down
There is a subtle but important difference between the following three examples:

<label>
  Example #1
</label>

```js
user.mouse.interact({ down: [55, 42] });
````

<label>
  Example #2
</label>

```js
user.mouse.interact({ move: [55, 42], down: [5, 5] });
````

<label>
  Example #2
</label>

```js
user.mouse.interact({ move: [55, 42] }, { down: [5, 5] });
````

The first example moves the cursor to 55x42 before pressing the mouse down.

The second example does the opposite. It presses the mouse down at 5x5 before moving the cursor to 55x42 (see Combining Commands section above).

The third command moves the mouse to 55x42, pauses, and then moves the mouse to 5x5 before pressing down.

### When Up and Down Conflict

An error will be thrown if you send mouse commands that conflict with each other.

For example, the following example blows up when doubleclick is called while the mouse is still down:

```js
user.mouse.interact({ down: [55, 42] }, { doubleclick: [5, 5] });
````

You can fix this by releasing the down:

```js
user.mouse.interact({ down: [55, 42] }, 'up', { doubleclick: [5, 5] });
````

### A More Complex Example

Mouse Interactions allow you to create complex patterns with a minimal of effort:

```js
const agent = new SecretAgent();
const { user, document } = agent;
await user.goto('https://example.org');

const title = document.querySelector('.title');
await user.mouse.interact(
  { move: [50, 100] }, 
  'click', 
  { click: [75, 100] }, 
  { rightClick: title }
);
````

<!--### mouse.click*(x, y\[, options])*-->
<!--Shortcut for mouse.move, mouse.down and mouse.up.-->
<!--#### **Arguments**:-->
<!--- x `number`-->
<!--- y `number`-->
<!--- options `oObject`-->
<!--  - button `left | right | middle` defaults to left.-->
<!--  - clickCount `number` defaults to 1. See UIEvent.detail.-->
<!--  - delay `number` defaults to 0. Time to wait between mousedown and mouseup in milliseconds.-->
<!--#### **Returns**: `Promise`-->


<!--### mouse.down*(\[options])*-->
<!--Dispatches a mousedown event.-->
<!--#### **Arguments**:-->
<!--- options `object`-->
<!--  - button `left | right | middle` defaults to left.-->
<!--  - clickCount `number` defaults to 1. See UIEvent.detail.-->
<!--#### **Returns**: `Promise`-->

<!--### mouse.move*(x, y\[, options])*-->
<!--Dispatches a mousemove event.-->
<!--#### **Arguments**:-->
<!--- x `number`-->
<!--- y `number`-->
<!--- options `object`-->
<!--  - steps `number` defaults to 1. Sends intermediate mousemove events.-->
<!--#### **Returns**: `Promise`-->

<!--### mouse.up*(\[options])*-->
<!--Dispatches a mouseup event.-->
<!--#### **Arguments**:-->
<!--- options Object-->
<!--  - button `left | right | middle` defaults to left.-->
<!--  - clickCount `number` defaults to 1. See UIEvent.detail.-->
<!--#### **Returns**: `Promise`-->
