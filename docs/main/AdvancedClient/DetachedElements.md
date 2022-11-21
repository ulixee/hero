# DetachedElements

> DetachedElements is a class to retrieve DOM Elements that were saved from a Hero session using [`hero.detach`](/docs/hero/basic-client/hero#detach) or [element.$detach](/docs/hero/basic-client/awaited-dom-extensions#detach).

DetachedElements cannot be constructed. You access it through [hero.detachedElements](/docs/hero/basic-client/hero#detachedElements) or [heroReplay.detachedElements](/docs/hero/basic-client/hero-replay#detachedElements).

Retrieved elements are decendants of the DetachedElement not AwaitedDOM, which means they have no need for promises or awaits.

```js
await hero.goto('https://ulixee.org');
const h1 = await hero.querySelector('h1').$waitForVisible();
// Extract the DOM Element at this moment in time.
await h1.$extract('title');
// ... do other things
const h1 = await hero.detachedElements.get('title');
// NOTE: synchronous APIs. No longer running in browser.
const text = h1.textContent;
const dataset = h1.dataset;
```

## Properties

### detachedElements.names

Retrieves all names that DetachedElements have been stored with.

#### **Returns** `Promise<string[]>`

## Methods

### detachedElements.get *(name)* {#get}

Get a single DOM Element extracted with the given name.

#### **Arguments**:

- name `string`. The name of the DOM Element to retrieve (assigned during extraction).

#### **Returns**: `Promise<Element>` The (reconstituted) DOM Element.

### detachedElements.getAll *(name)* {#get-all}

Get a list of DOM Elements extracted with the given name. If you extract a `querySelectorAll`, all returned results will be in this list. Items will maintain the order they're collected in.

#### **Arguments**:

- name `string`. The name of the DOM Element list to retrieve (assigned during extraction).

#### **Returns**: `Promise<Element[]>` The (reconstituted) DOM Elements.

### detachedElements.getRawDetails *(name)* {#get-raw}

Get a list of extracted Elements with all the underlying details. This allows you to access the raw HTML as well as details about when and where a Node was extracted.

Details per `IDetachedElement` record are:

- id `number`. An assigned id.
- name `string`. The provided name for the DetachedElement.
- frameId `number`. The [FrameEnvironment](/docs/hero/basic-client/frame-environment) id where the Element was extracted.
- frameNavigationId `number`. The id of the Navigation for the [Frame](/docs/hero/basic-client/frame-environment) at time of extraction. 
- tabId `number`. The [Tab](/docs/hero/advanced-client/tab) id where the Element was extracted.
- commandId `number`. The [Command](/docs/hero/advanced-client/tab#lastCommandId) id at time of extraction.
- domChangesTimestamp `number`. The unix timestamp of the DOM at time of extraction.
- nodePointerId `number`. The internal tracking id assigned to the node.
- nodeType `string`. The type of node (eg, 'HTMLDivElement', 'HTMLLIElement')
- nodePreview `string`. A string preview created in the DOM at time of retrieval.
- outerHTML? `string`. The full outerHTML of the Node, recreated at the exact moment in the DOM.

#### **Arguments**:

- name `string`. The name given to the DOM Element during extraction.

#### **Returns**: `Promise<IDetachedElement[]>` The raw data for the DetachedElements.
