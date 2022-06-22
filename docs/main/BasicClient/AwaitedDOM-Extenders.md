# AwaitedDOM Extenders

> AwaitedDOM Extenders add functionality to the W3C spec DOM to make using Hero easier. All AwaitedDOM Extenders start with a $.

## Constructor

AwaitedDOM Extenders cannot be constructed. They're additions added to the following Super classes and collections.

#### Nodes: {#super-nodes}

- [`SuperElement`](/docs/awaited-dom/super-element)
- [`SuperNode`](/docs/awaited-dom/super-node)
- [`SuperHTMLElement`](/docs/awaited-dom/super-html-element)

#### Collections: {#super-collections}

- [`SuperNodeList`](/docs/awaited-dom/super-node-list)
- [`SuperHTMLCollection`](/docs/awaited-dom/super-html-collection)

## Properties

### node.$contentDocument {#content-document}

Accesses a child frames ContentDocument **bypassing** cross-origin restrictions. This can be really nice when you are accessing frame querySelectors on different domains. The native javascript sandboxes do not have this privilege.

Attached to IFrame Elements ([see list](#super-nodes)).

```js
await hero.querySelector('frame').$contentDocument.querySelector('button').$click();
```

#### **Returns**: `SuperDocument`

### node.$exists {#exists}

Checks if a given node is valid and retrievable in the DOM. This API is used mostly to determine if a querySelector can be resolved.

```js
await hero.querySelector('.not-in-dom').$exists; // false if not in dom!
```

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Returns**: `Promise<boolean>`

### node.$hasFocus {#has-focus}

Checks if a given node has focus in the DOM. Useful for form interactions.

```js
const hasFocus = await hero.querySelector('.field').$hasFocus;
if (!hasFocus) await hero.querySelector('.field').focus();
```

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Returns**: `Promise<boolean>`

### node.$isClickable {#is-clickable}

Checks if a given node is visible in the DOM, scrolled into view, and not masked by any other node. Follows the specification of `isClickable` from [tab.getComputedVisibility()](/docs/hero/basic-client/tab#get-computed-visibility).

Attached to Nodes and Elements ([see list](#super-nodes)).

```js
await hero.querySelector('.element').$isClickable;
```

#### **Returns**: `Promise<boolean>`

### node.$isVisible {#is-visible}

Checks if a given node is visible in the DOM. Follows the specification of `isVisible` from [tab.getComputedVisibility()](/docs/hero/basic-client/tab#get-computed-visibility).

NOTE: this does not mean the node is scrolled into view.

```js
await hero.querySelector('.element').$isVisible;
```

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Returns**: `Promise<boolean>`

## Methods

### node.$clearInputText *()* {#clear-value}

Clears out the value of an input field by performing a Focus, Select All, and Backspace.

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Returns**: `Promise<void>`

### node.$click *(verification)* {#click}

A normal DOM node has a `click()` API on it, but it does not trigger human-like behavior or mouse events resembling the actions of a normal user. For that reason, it can be detected if a given website is looking for it.

The `$click()` API triggers clicking on the given node using the [Human Emulator](/docs/hero/plugins/human-emulators) functionality.

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Arguments**:

- verification `elementAtPath` | `exactElement` | `none`. Default `elementAtPath`. Determines what [verification](/docs/hero/basic-client/interactions#click-verification) should be used in this operation. A verification determines how to recover from the node disappearing from the DOM during execution.

#### **Returns**: `Promise<void>`

### node.$type *(...typeInteractions)* {#type}

Perform a typing interaction on the given node. This is a shortcut for `focusing` on an input and then performing `keyboard` operations using the [Human Emulator](/docs/hero/plugins/human-emulators) functionality.

```js
await hero.querySelector('.field').$type('fill-in', KeyboardKey.Enter);
```

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Arguments**:

- typeInteractions `ITypeInteraction[]`. One or more interactions to trigger using the keyboard. TypeInteractions can be strings or `KeyboardKey` values (exported from the Hero client).

#### **Returns**: `Promise<void>`

### node.$waitForExists *(options?)* {#wait-for-exists}

Wait for the given Node "Path" to exist in the DOM. Returns the resolved SuperElement.

```js
await hero.querySelector('.not.here.yet').$waitForExists(); // waits until this querySelector resolves.
```

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Arguments**:

- options `object`. Optional options.
  - timeoutMs `number`. The default timeout.

#### **Returns**: `Promise<ISuperElement>`

### node.$waitForClickable *(options?)* {#wait-for-clickable}

Wait for the given Node "Path" to be clickable in the DOM (visible, scrolled into the viewport and unobstructed).

NOTE: this API will _not_ scroll a node into view that is offscreen.

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Arguments**:

- options `object`. Optional options.
  - timeoutMs `number`. The default timeout.

#### **Returns**: `Promise<ISuperElement>`

### node.$waitForHidden *(options?)* {#wait-for-hidden}

Wait for the given Node "Path" to be unavailable in the DOM (not visible in the DOM or does not exist).

This API can be useful to wait for a modal/popup window to disppear after you click close on it.

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Arguments**:

- options `object`. Optional options.
  - timeoutMs `number`. The default timeout.

#### **Returns**: `Promise<ISuperElement>`

### node.$waitForVisible *(options?)* {#wait-for-visible}

Wait for the given Node "Path" to be visible in the DOM.

Visible follows the API defined at: [`tab.getComputedVisibility`](/docs/hero/basic-client/tab#get-computed-visibility)

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Arguments**:

- options `object`. Optional options.
  - timeoutMs `number`. The default timeout.

#### **Returns**: `Promise<ISuperElement>`

### node.$xpathSelector *(selector)* {#xpathSelector}

Perform an XPath query with this node provided as the "ContextScope". NOTE: you still need to start your XPath with a '.' to indicate you wish to find nested XPaths.

This is often useful to mix and match with querySelectors when you want to select on Text values of nodes.

```js
await hero.querySelector('ul').$xpathSelector('.//[.,"LAX"]');
```

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Arguments**:

- selector `string`. A valid XPath selector

#### **Returns**: `Promise<ISuperElement>`

## Collection Methods

### nodeList.$map *(iteratorFn)* {#map}

Adds syntactic sugar to run an `Array.map` on the results and await all results. This can be useful to transform results.

Attached to NodeCollections ([see list](#super-collections)).

#### **Returns**: `Promise<T[]>`

### nodeList.$reduce *(iteratorFn, initialValue)* {#reduce}

Adds syntactic sugar to run an `Array.reduce` on the results and await a reduced result. This can be useful to transform results.

Attached to NodeCollections ([see list](#super-collections)).

#### **Returns**: `Promise<T>`
