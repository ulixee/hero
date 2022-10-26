# FrameEnvironment

A FrameEnvironment represents a browsing context which allows you to interact with a Document in the page just like an iFrame or Frame in a normal HTML Document. A FrameEnvironment is one of many in a Tab that controls a document with its own page lifecycle and resources. Many of the FrameEnvironment methods for the "main" document are available from the Tab object.

## Constructor

Frames cannot be constructed in Hero. They're made available through the [tab.frameEnvironments](/docs/hero/basic-client/tab#frame-environments) array.

## Properties

### frameEnvironment.children {#child-frames}

Returns child FrameEnvironments for this frame.

#### **Type**: Promise<[`FrameEnvironment`](/docs/hero/basic-client/tab#frame-environments)[]>

### frameEnvironment.cookieStorage {#cookie-storage}

Returns a [CookieStorage](/docs/hero/advanced-client/cookie-storage) instance to get/set/delete cookies.

#### **Type**: [`CookieStorage`](/docs/hero/advanced-client/cookie-storage)

### frameEnvironment.document <div class="specs"><i>W3C</i></div> {#document}

Returns a reference to the document of the frameEnvironment.

#### **Type**: [`SuperDocument`](/docs/hero/awaited-dom/super-document)

### frameEnvironment.frameId {#frameid}

An identifier for the frameEnvironment.

#### **Type**: `Promise<string>`

### frameEnvironment.isAllContentLoaded {#is-all-content-loaded}

`True` if the "load" event has triggered in this frame.

Wait for this event to trigger with [waitForLoad(AllContentLoaded)](#wait-for-load)

#### **Type**: `Promise<boolean>`

### frameEnvironment.isDomContentLoaded {#is-dom-content-loaded}

`True` if the "DOMContentLoaded" event has triggered in this frame.

Wait for this event to trigger with [waitForLoad(DomContentLoaded)](#wait-for-load)

#### **Type**: `Promise<boolean>`

### frameEnvironment.isPaintingStable {#is-painting-stable}

`True` if this frame has loaded visible content above the fold. Works on javascript-rendered pages.

NOTE: if a frame has no visible content, this property will never return true.

Wait for this event to trigger with [waitForPaintingStable()](#wait-for-painting-stable)

#### **Type**: `Promise<boolean>`

### frameEnvironment.lastCommandId {#lastCommandId}

An execution point that refers to a command run on this Hero instance (`waitForElement`, `click`, `type`, etc). Command ids can be passed to select `waitFor*` functions to indicate a starting point to listen for changes.

#### **Type**: `Promise<number>`

### frameEnvironment.localStorage <div class="specs"><i>W3C</i></div> {#local-storage}

Returns a reference to the [Storage](/docs/hero/awaited-dom/storage) object managing localStorage for the frameEnvironment.

#### **Type**: [`Storage`](/docs/hero/awaited-dom/storage)

### frameEnvironment.parentFrameId {#parent-frameid}

An identifier for the parent frame, if it exists. `null` for the main FrameEnvironment.

#### **Type**: `Promise<string>`

### frameEnvironment.name {#name}

Returns the name given to the frame DOM element. NOTE: this name is not populated until the frame has navigated to the destination url.

#### **Type**: `Promise<string>`

### frameEnvironment.sessionStorage <div class="specs"><i>W3C</i></div> {#session-storage}

Returns a reference to the [Storage](/docs/hero/awaited-dom/storage) object managing sessionStorage for the frameEnvironment.

#### **Type**: [`Storage`](/docs/hero/awaited-dom/storage)

### frameEnvironment.url {#url}

The url of the active frameEnvironment.

#### **Type**: `Promise<string>`

### frameEnvironment.Request <div class="specs"><i>W3C</i></div> {#request-type}

Returns a constructor for a [Request](/docs/hero/awaited-dom/request) object that can be sent to [frameEnvironment.fetch(request)](#fetch).

```js
const { Request, fetch } = hero;
const url = 'https://dataliberationfoundation.org';
const request = new Request(url, {
  headers: {
    'X-From': 'https://ulixee.org',
  },
});
const response = await fetch(request);
```

#### **Type**: [`Request`](/docs/hero/awaited-dom/request)

## Methods

### frameEnvironment.fetch *(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#fetch}

Perform a native "fetch" request in the current frame environment.

#### **Arguments**:

- requestInput `IRequestInput` A [Request](#request-type) object or url.
- requestInit `IRequestInit?` Optional request initialization parameters. Follows w3c specification.
  - Inbound Body currently supports: `string`, `ArrayBuffer`, `null`.
  - Not supported: `Blob`, `FormData`, `ReadableStream`, `URLSearchParams`

#### **Returns**: [`Promise<Response>`](/docs/hero/awaited-dom/response)

```js
const origin = 'https://dataliberationfoundation.org/';
const getUrl = 'https://dataliberationfoundation.org/mission';

await hero.goto(origin);
const mainFrame = hero.mainFrameEnvironment;
const response = await mainFrame.fetch(getUrl);
```

Http Post example with a body:

```js
const origin = 'https://dataliberationfoundation.org/';
const postUrl = 'https://dataliberationfoundation.org/nopost';

await hero.goto(origin);
const mainFrame = hero.mainFrameEnvironment;
const response = await mainFrame.fetch(postUrl, {
  method: 'post',
  headers: {
    Authorization: 'Basic ZWx1c3VhcmlvOnlsYWNsYXZl',
  },
  body: JSON.stringify({
    ...params,
  }),
});
```

### frameEnvironment.getFrameEnvironment *(frameElement)* {#get-frame-environment}

Get the [FrameEnvironment](/docs/hero/advanced-client/frame-environment) object corresponding to the provided HTMLFrameElement or HTMLIFrameElement. Use this function to attach to the full environment of the given DOM element.

#### **Arguments**:

- element [`SuperElement`](/docs/hero/awaited-dom/super-element) A frame or iframe element loaded in this frame environment (ie, a direct child element of this frame document).

#### **Returns**: [`Promise<Frame>`](/docs/hero/advanced-client/frame-environment)

```js
await hero.goto('https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe');
const { document } = hero.activeTab;
const iframeElement = document.querySelector('iframe.interactive');

const iframe = await hero.getFrameEnvironment(iframeElement);

const h4 = await iframe.document.querySelector('h4').textContent; // should be something like HTML demo: <iframe>
```

### frameEnvironment.getComputedStyle *(element, pseudoElement)* <div class="specs"><i>W3C</i></div> {#computed-style}

Perform a native `Window.getComputedStyle` request in the current frame context - it returns an object containing the values of all CSS properties of an element, after applying active stylesheets and resolving any basic computation those values may contain. Individual CSS property values are accessed through APIs provided by the object, or by indexing with CSS property names.

#### **Arguments**:

- element [`SuperElement`](/docs/hero/awaited-dom/super-element) An element loaded in this frame environment.
- pseudoElement `string?` Optional string specifying the pseudo-element to match (eg, ::before, ::after, etc). More information can be found on [w3c](https://www.w3.org/TR/css-pseudo-4/).

#### **Returns**: [`Promise<CssStyleDeclaration>`](/docs/hero/awaited-dom/cssstyledeclaration)

```js
await hero.goto('https://dataliberationfoundation.org');
const { document, getComputedStyle } = hero.activeTab;
const selector = document.querySelector('h1');
const style = await getComputedStyle(selector);
const opacity = await style.getProperty('opacity');
```

### frameEnvironment.getComputedVisibility *(element)* {#get-computed-visibility}

Determines if a node from the [mainFrameEnvironment](#main-frame-environment) is visible to an end user. This method checks whether a node (or containing element) has:

- layout: width, height, x and y.
- opacity: non-zero opacity.
- css visibility: the element does not have a computed style where visibility=hidden.
- no overlay: no other element which overlays more than one fourth of this element and has at least 1 pixel over the center of the element.
- on the visible screen (not beyond the horizontal or vertical viewport)

Alias for [tab.mainFrameEnvironment.getComputedVisibility](/docs/hero/advanced-client/frame-environment#get-computed-visibility).

#### **Arguments**:

- node [`SuperNode`](/docs/hero/awaited-dom/super-node). The node to compute visibility.

#### **Returns**: `Promise<INodeVisibility>` Boolean values indicating if the node (or closest element) is visible to an end user.

- INodeVisibility `object`
  - isVisible `boolean`. The node is visible (`nodeExists`, `hasContainingElement`, `isConnected`, `hasCssOpacity`,`hasCssDisplay`,`hasCssVisibility` `hasDimensions`).
  - isClickable `boolean`. The node is visible, in the viewport and unobstructed (`isVisible`, `isOnscreenVertical`, `isOnscreenHorizontal` and `isUnobstructedByOtherElements`).
  - nodeExists `boolean`. Was the node found in the DOM.
  - isOnscreenVertical `boolean`. The node is on-screen vertically.
  - isOnscreenHorizontal `boolean`. The node is on-screen horizontally.
  - hasContainingElement `boolean`. The node is an Element or has a containing Element providing layout.
  - isConnected `boolean`. The node is connected to the DOM.
  - hasCssOpacity `boolean`. The display `opacity` property is not "0".
  - hasCssDisplay `boolean`. The display `display` property is not "none".
  - hasCssVisibility `boolean`. The visibility `style` property is not "hidden".
  - hasDimensions `boolean`. The node has width and height.
  - isUnobstructedByOtherElements `boolean`. The node is not hidden or obscured > 50% by another element.

### frameEnvironment.getJsValue *(path)* {#get-js-value}

Extract any publicly accessible javascript value from the FrameEnvironment.

#### **Arguments**:

- path `string`

#### **Returns**: `Promise<SerializedValue>`

```js
await hero.goto('https://dataliberationfoundation.org');
const navigatorAgent = await hero.activeFrame.getJsValue(`navigator.userAgent`);
```

### frameEnvironment.isElementVisible *(element)* {#is-element-visible}

Determines if an element is visible to an end user. This method checks whether an element has:

- layout: width, height, x and y.
- opacity: non-zero opacity.
- css visibility: the element does not have a computed style where visibility=hidden.
- no overlay: no other element which overlays more than one fourth of this element and has at least 1 pixel over the center of the element.

#### **Arguments**:

- element [`SuperElement`](/docs/hero/awaited-dom/super-element). The element to determine visibility.

#### **Returns**: `Promise<boolean>` Whether the element is visible to an end user.

### frameEnvironment.querySelector *(stringOrOptions)* {#query-selector}

This is a shortcut for document.querySelector.

#### **Returns**: [`SuperNode`](/docs/hero/awaited-dom/super-node). A Node that satisfies the given patterns. Evaluates to null if awaited and not present.

### frameEnvironment.querySelectorAll *(stringOrOptions)* {#query-selector-all}

This is a shortcut for document.querySelectorAll.

#### **Returns**: [`SuperNodeList`](/docs/hero/awaited-dom/super-node-list). A NodeList that satisfies the given selector. Returns an empty list if a resultset is not found.

### frameEnvironment.xpathSelector *(selector, orderedResults)* {#xpath-selector}

This is a shortcut for document.evaluate(`selector`, document, `FIRST_ORDERED_NODE_TYPE` | `ANY_UNORDERED_NODE_TYPE`)

#### **Arguments**:

- selector `string`. An XPath selector that can return a single node result.
- orderedResults `boolean`. Optional boolean to indicate if results should return first ordered result. Default is false.

#### **Returns**: [`SuperNode`](/docs/hero/awaited-dom/super-node). A Node that satisfies the given patterns. Evaluates to null if awaited and not present.

### frameEnvironment.xpathSelectorAll *(selector, orderedResults)* {#xpath-selector-all}

This is a shortcut for document.evaluate(`selector`, document, `ORDERED_NODE_ITERATOR_TYPE` | `UNORDERED_NODE_ITERATOR_TYPE`).

NOTE: this API will iterate through the results to return an array of all matching nodes.

#### **Arguments**:

- selector `string`. An XPath selector that can return node results.
- orderedResults `boolean`. Optional boolean to indicate if results should return first ordered result. Default is false.

#### **Returns**: Promise<Array<[`SuperNode`](/docs/hero/awaited-dom/super-node)>>. A promise resolving to an array of nodes that satisfies the given pattern.

### frameEnvironment.waitForPaintingStable *(options)* {#wait-for-painting-stable}

Wait for the page to be loaded such that a user can see the main content above the fold, including on javascript-rendered pages (eg, Single Page Apps). This load event works around deficiencies in using the Document "load" event, which does not always trigger, and doesn't work for Single Page Apps.

NOTE: this method should NOT be called in a Frame Document that has no visible elements.

#### **Arguments**:

- options `object` Optional
  - timeoutMs `number`. Timeout in milliseconds. Default `30,000`.
  - sinceCommandId `number`. A `commandId` from which to look for load status changes.

#### **Returns**: `Promise<void>`

### frameEnvironment.waitForElement *(element,options)* {#wait-for-element}

Wait until a specific element is present in the dom.

#### **Arguments**:

- element [`SuperElement`](/docs/hero/awaited-dom/super-element)
- options `object` Accepts any of the following:
  - timeoutMs `number`. Timeout in milliseconds. Default `30,000`.
  - waitForVisible `boolean`. Wait until this element is visible to a user (see [getComputedVisibility](#get-computed-visibility).
  - waitForHidden `boolean`. Wait until this element is hidden to a user (see [getComputedVisibility](#get-computed-visibility).
  - waitForClickable `boolean`. Wait until this element is visible to a user, int the viewport, and unobstructed (see [getComputedVisibility](#get-computed-visibility).

#### **Returns**: `Promise`

If at the moment of calling this method, the selector already exists, the method will return immediately.

```js
const { activeTab, document } = hero;

const elem = document.querySelector('a.visible');
await activeFrame.waitForElement(elem, {
  waitForVisible: true,
});
```

### frameEnvironment.waitForLoad *(status, options)* {#wait-for-load}

Wait for the load status to occur on a page.

#### **Arguments**:

- status `NavigationRequested | HttpRequested | HttpResponsed | HttpRedirected | DomContentLoaded | PaintingStable` The load status event to wait for.
- options `object`
  - timeoutMs `number`. Timeout in milliseconds. Default `30,000`.
  - sinceCommandId `number`. A `commandId` from which to look for status changed.

#### **Returns**: `Promise<void>`

The following are possible statuses and their meanings:

<div class="show-table-header show-bottom-border minimal-row-height"></div>

| Status                | Description                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `NavigationRequested` | A navigation request is initiated by the page or user                                    |
| `HttpRequested`       | The http request for the document has been initiated                                     |
| `HttpResponded`       | The http response has been retrieved                                                     |
| `HttpRedirected`      | The original http request was redirected                                                 |
| `DomContentLoaded`    | The dom content has been received and loaded into the document                           |
| `AllContentLoaded`    | The page load event has triggered. NOTE: this does not ALWAYS trigger in browser.        |
| `PaintingStable`      | The page has loaded the main content above the fold. Works on javascript-rendered pages. |

### frameEnvironment.waitForLocation *(trigger, options)* {#wait-for-location}

Waits for a navigational change to document.location either because of a `reload` event or changes to the URL.

#### **Arguments**:

- trigger `change | reload` The same url has been reloaded, or it's a new url.
- options `object`
  - timeoutMs `number`. Timeout in milliseconds. Default `30,000`.
  - sinceCommandId `number`. A `commandId` from which to look for changes.

#### **Returns**: [`Promise<Resource>`](/docs/hero/advanced-client/resource) The resource representing this location change or reload.

Location changes are triggered in one of two ways:

<div class="show-table-header show-bottom-border minimal-row-height"></div>

| Trigger  | Description                                                    |
| -------- | -------------------------------------------------------------- |
| `change` | A navigational change to document.location has been triggered. |
| `reload` | A reload of the current document.location has been triggered.  |

The following example waits for a new page to load after clicking on an anchor tag:

```js
await hero.goto('http://example.com');

const mainFrame = hero.activeTab.mainFrameEnvironment;
await mainFrame.querySelector('a').$click();
await mainFrame.waitForLocation('change');

const newUrl = await mainFrame.url;
```
