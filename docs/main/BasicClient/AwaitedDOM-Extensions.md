# AwaitedDOM Extensions

> AwaitedDOM Extensions add extra functionality to the DOM specification in order to make using Hero easier. All extensions are prefixed with a "$" character.

These extensions are automatically added to all AwaitedDOM elements ([`Nodes`](/docs/hero/awaited-dom/super-node), [`Elements`](/docs/hero/awaited-dom/super-element), [`HTMLElements`](/docs/hero/awaited-dom/super-html-element)) and collections ([`NodeList`](/docs/hero/awaited-dom/super-node-list) and [`HTMLCollections`](/docs/hero/awaited-dom/super-html-collection)).

## Properties


### element.$contentDocument {#content-document}

Accesses a child frames ContentDocument **bypassing** cross-origin restrictions. This can be really nice when you are accessing frame querySelectors on different domains. The native javascript sandboxes do not have this privilege.

Attached to IFrame Elements ([see list](#super-nodes)).

```js
await hero.querySelector('frame').$contentDocument.querySelector('button').$click();
```

#### **Returns**: `SuperDocument`

### element.$exists {#exists}

Checks if a given node is valid and retrievable in the DOM. This API is used mostly to determine if a querySelector can be resolved.

```js
await hero.querySelector('.not-in-dom').$exists; // false if not in dom!
```

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Returns**: `Promise<boolean>`

### element.$hasFocus {#has-focus}

Checks if a given node has focus in the DOM. Useful for form interactions.

```js
const hasFocus = await hero.querySelector('.field').$hasFocus;
if (!hasFocus) await hero.querySelector('.field').focus();
```

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Returns**: `Promise<boolean>`

### element.$isClickable {#is-clickable}

Checks if a given node is visible in the DOM, scrolled into view, and not masked by any other node. Follows the specification of `isClickable` from [tab.getComputedVisibility()](/docs/hero/advanced-client/tab#get-computed-visibility).

Attached to Nodes and Elements ([see list](#super-nodes)).

```js
await hero.querySelector('.element').$isClickable;
```

#### **Returns**: `Promise<boolean>`

### element.$isVisible {#is-visible}

Checks if a given node is visible in the DOM. Follows the specification of `isVisible` from [tab.getComputedVisibility()](/docs/hero/advanced-client/tab#get-computed-visibility).

NOTE: this does not mean the node is scrolled into view.

```js
await hero.querySelector('.element').$isVisible;
```

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Returns**: `Promise<boolean>`

## Element Methods

The following methods are added to ([`Nodes`](/docs/hero/awaited-dom/super-node), [`Elements`](/docs/hero/awaited-dom/super-element), and [`HTMLElements`](/docs/hero/awaited-dom/super-html-element)).


### element.$addToDetachedElements *(name)* {#addToDetachedElements}

Converts the element to a [DetachedElement](/docs/hero/basic-client/detached-element) and adds it to the [hero.detachedElements](/docs/hero/basic-client/hero#detached-elements) object. The advantage of hero.detachedElements is you can use and reuse them from within [HeroReplay](/docs/hero/basic-client/hero-replay) long after your Hero session has closed. This allows you to write extraction logic that can be easily iterated on without needing to reload the webpage(s).

For example, below is a simple hero script that collects the `h1` element:
```js
const hero = new Hero();
await hero.goto('https://ulixee.org');
await hero.querySelector('h1').$addToDetachedElements('title');
console.log('Session ID: ', await hero.sessionId);
```

You can create a second script that uses [HeroReplay](/docs/hero/basic-client/hero-replay) to find the data you need without loading the website again:
```js
const hero = new HeroReplay({ /* previousSessionId */});
const h1 = await hero.detachedElements.get('title');
const h1Children = [...h1.querySelectorAll('div')].map(x => x.textContent);
```

#### **Arguments**:

- name `string`. The name used to retrieve this element from [hero.detachedElements](/docs/databox/basic-client/hero#detached-elements).

#### **Returns**: `Promise<void>`


### element.$clearInputText *()* {#clear-value}

Clears out the value of an input field by performing a Focus, Select All, and Backspace.

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Returns**: `Promise<void>`

### element.$click *(verification)* {#click}

A normal DOM node has a `click()` API on it, but it does not trigger human-like behavior or mouse events resembling the actions of a normal user. For that reason, it can be detected if a given website is looking for it.

The `$click()` API triggers clicking on the given node using the [Human Emulator](/docs/hero/plugins/human-emulators) functionality.

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Arguments**:

- verification `elementAtPath` | `exactElement` | `none`. Default `elementAtPath`. Determines what [verification](/docs/hero/basic-client/interactions#click-verification) should be used in this operation. A verification determines how to recover from the node disappearing from the DOM during execution.

#### **Returns**: `Promise<void>`


### element.$detach *()* {#detach}

Detaches element and returns it as a [DetachedElement](/docs/hero/basic-client/detached-element) for local usage (i.e, without any need for promises or awaits). 

For example, below is a simple hero script that detaches the `h1` element and uses getAttribute:
```js
const hero = new Hero();
await hero.goto('https://ulixee.org');
const h1Elem = await hero.querySelector('h1').$detach();
console.log('Session ID: ', h1Elem.getAttribute('title'));
```

You'll notice the h1Elem above has full access to properties and methods without needing the `await` keyword.

#### **Returns**: `Promise<DetachedElement.Element>`


### element.$type *(...typeInteractions)* {#type}

Perform a typing interaction on the given node. This is a shortcut for `focusing` on an input and then performing `keyboard` operations using the [Human Emulator](/docs/hero/plugins/human-emulators) functionality.

```js
await hero.querySelector('.field').$type('fill-in', KeyboardKey.Enter);
```

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Arguments**:

- typeInteractions `ITypeInteraction[]`. One or more interactions to trigger using the keyboard. TypeInteractions can be strings or `KeyboardKey` values (exported from the Hero client).

#### **Returns**: `Promise<void>`

### element.$waitForExists *(options?)* {#wait-for-exists}

Wait for the given Node "Path" to exist in the DOM. Returns the resolved SuperElement.

```js
await hero.querySelector('.not.here.yet').$waitForExists(); // waits until this querySelector resolves.
```

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Arguments**:

- options `object`. Optional options.
  - timeoutMs `number`. The default timeout.

#### **Returns**: `Promise<ISuperElement>`

### element.$waitForClickable *(options?)* {#wait-for-clickable}

Wait for the given Node "Path" to be clickable in the DOM (visible, scrolled into the viewport and unobstructed).

NOTE: this API will _not_ scroll a node into view that is offscreen.

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Arguments**:

- options `object`. Optional options.
  - timeoutMs `number`. The default timeout.

#### **Returns**: `Promise<ISuperElement>`

### element.$waitForHidden *(options?)* {#wait-for-hidden}

Wait for the given Node "Path" to be unavailable in the DOM (not visible in the DOM or does not exist).

This API can be useful to wait for a modal/popup window to disppear after you click close on it.

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Arguments**:

- options `object`. Optional options.
  - timeoutMs `number`. The default timeout.

#### **Returns**: `Promise<ISuperElement>`

### element.$waitForVisible *(options?)* {#wait-for-visible}

Wait for the given Node "Path" to be visible in the DOM.

Visible follows the API defined at: [`tab.getComputedVisibility`](/docs/hero/advanced-client/tab#get-computed-visibility)

Attached to Nodes and Elements ([see list](#super-nodes)).

#### **Arguments**:

- options `object`. Optional options.
  - timeoutMs `number`. The default timeout.

#### **Returns**: `Promise<ISuperElement>`

### element.$xpathSelector *(selector)* {#xpathSelector}

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

The following methods are added to ([`NodeList`](/docs/hero/awaited-dom/super-node-list) and [`HTMLCollections`](/docs/hero/awaited-dom/super-html-collection)).

### collection.$map *(iteratorFn)* {#map}

Adds syntactic sugar to run an `Array.map` on the results and await all results. This can be useful to transform results.

Attached to NodeCollections ([see list](#super-collections)).

#### **Returns**: `Promise<T[]>`

### collection.$reduce *(iteratorFn, initialValue)* {#reduce}

Adds syntactic sugar to run an `Array.reduce` on the results and await a reduced result. This can be useful to transform results.

Attached to NodeCollections ([see list](#super-collections)).

#### **Returns**: `Promise<T>`


### collection.$detach *(name?)* {#detach}

Detaches all elements of a NodeList or HTMLElementCollection and converts them to [DetachedElement](/docs/hero/basic-client/detached-element). Supplying a string as the first argument adds your elements to [hero.detachedElements](/docs/hero/basic-client/hero#detachedElements).

```js
  await hero.goto('https://ulixee.org');
  await hero.querySelectorAll('h1 div').$addToDetachedElements('h1 divs');
  const h1 = await hero.detachedElements.getAll('h1 divs'); // will have 2 entries
  const h1Divs = h1.map(x => x.textContent);
```

#### **Arguments**:

- name `string`. The name given to all extracted HTML Elements. This name will be used to retrieve the elements from [hero.detachedElements](/docs/hero/basic-client/hero#detached-elements).

#### **Returns**: `Promise<void>`

## Resource Methods

