# Tab

A Tab is similar to a tab in a consumer browser. Each Tab drives an underlying document with its own page lifecycle and resources. Many of the tab functions are available from the Hero object.

## Constructor

A default tab is provided in each Hero instance. Navigate by using the [hero.goto](/docs/hero/basic-interfaces/hero#goto) method.

When a new window is "popped up" (ie, `<a href="/new-place" target="_blank"`), a tab will automatically be associated with the Hero instance. These can be discovered using the [hero.tabs](/docs/hero/basic-interfaces/hero#tabs) method, or waiting with [hero.waitForNewTab()](/docs/hero/basic-interfaces/hero#wait-for-new-tab).

## Properties

### tab.cookieStorage {#cookie-storage}

Returns a [CookieStorage](/docs/hero/advanced/cookie-storage) instance to get/set/delete cookies in the [mainFrameEnvironment](#main-frame-environment) of this tab.

Alias for [tab.mainFrameEnvironment.cookieStorage](/docs/hero/basic-interfaces/frame-environment#cookie-storage).

#### **Type**: [`CookieStorage`](/docs/hero/advanced/cookie-storage)

### tab.document <div class="specs"><i>W3C</i></div> {#document}

Returns a reference to the document of the [mainFrameEnvironment](#main-frame-environment) of this tab.

Alias for [tab.mainFrameEnvironment.document](/docs/hero/basic-interfaces/frame-environment#document).

#### **Type**: [`SuperDocument`](/docs/awaited-dom/super-document)

### tab.frameEnvironments {#frame-environments}

Returns a list of [Frames](/docs/hero/basic-interfaces/frame-environment) loaded for this tab.

#### **Type**: [`Promise<Frame[]>`](/docs/hero/basic-interfaces/frame-environment).

### tab.isAllContentLoaded {#is-all-content-loaded}

`True` if the "load" event has triggered in the mainFrameEnvironment.

NOTE: this event does not fire in some circumstances (such as a long-loading asset). You frequently just want to know if the page has loaded for a user (see [isPaintingStable](#is-painting-stable)).

Wait for this event to trigger with [waitForLoad(AllContentLoaded)](#wait-for-load).

#### **Type**: `Promise<boolean>`

Alias for [tab.mainFrameEnvironment.isAllContentLoaded](/docs/hero/basic-interfaces/frame-environment#is-all-content-loaded)

### tab.isDomContentLoaded {#is-dom-content-loaded}

`True` if the "DOMContentLoaded" event has triggered in the mainFrameEnvironment.

Wait for this event to trigger with [waitForLoad(DomContentLoaded)](#wait-for-load)

#### **Type**: `Promise<boolean>`

Alias for [tab.mainFrameEnvironment.isDomContentLoaded](/docs/hero/basic-interfaces/frame-environment#is-dom-content-loaded)

### tab.isPaintingStable {#is-painting-stable}

`True` if the page has loaded the main content in the mainFrameEnvironment above the fold. Works on javascript-rendered pages.

Wait for this event to trigger with [waitForPaintingStable()](#wait-for-painting-stable)

#### **Type**: `Promise<boolean>`

Alias for [tab.mainFrameEnvironment.isPaintingStable](/docs/hero/basic-interfaces/frame-environment#is-painting-stable)

### tab.lastCommandId {#lastCommandId}

An execution point that refers to a command run on this Hero instance (`waitForElement`, `click`, `type`, etc). Command ids can be passed to select `waitFor*` functions to indicate a starting point to listen for changes.

#### **Type**: `Promise<number>`

### tab.localStorage <div class="specs"><i>W3C</i></div> {#local-storage}

Returns a reference to the [Storage](/docs/awaited-dom/storage) object managing localStorage for the [mainFrameEnvironment](#main-frame-environment) of this tab.

Alias for [tab.mainFrameEnvironment.localStorage](/docs/hero/basic-interfaces/frame-environment#local-storage).

#### **Type**: [`Storage`](/docs/awaited-dom/storage)

### tab.mainFrameEnvironment {#main-frame-environment}

Returns the [`FrameEnvironment`](/docs/hero/basic-interfaces/frame-environment) representing the primary content of the loaded tab.

#### **Type**: [`FrameEnvironment`](/docs/hero/basic-interfaces/frame-environment).

### tab.sessionStorage <div class="specs"><i>W3C</i></div> {#session-storage}

Returns a reference to the [Storage](/docs/awaited-dom/storage) object managing sessionStorage for the [mainFrameEnvironment](#main-frame-environment) of this tab.

Alias for [tab.mainFrameEnvironment.sessionStorage](/docs/hero/basic-interfaces/frame-environment#session-storage).

#### **Type**: [`Storage`](/docs/awaited-dom/storage)

### tab.tabId {#tabid}

An identifier for the tab.

#### **Type**: `Promise<number>`

### tab.url {#url}

The url of the active tab.

#### **Type**: `Promise<string>`

### tab.Request <div class="specs"><i>W3C</i></div> {#request-type}

Returns a constructor for a [Request](/docs/awaited-dom/request) object in the [mainFrameEnvironment](#main-frame-environment).

Alias for [tab.mainFrameEnvironment.Request](/docs/hero/basic-interfaces/frame-environment#request-type)

#### **Type**: [`Request`](/docs/awaited-dom/request)

## Methods

### tab.close*()* {#close}

Closes the current tab only (will close the whole Hero instance if there are no open tabs).

#### **Returns**: `Promise`

### tab.fetch*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#fetch}

Perform a native "fetch" request in the [mainFrameEnvironment](#main-frame-environment) context.

NOTE: You can work around Cross Origin Request (CORS) issues or change your request "origin" by running fetch
from a different [FrameEnvironment](/docs/hero/basic-interfaces/frame-environment#fetch).

#### **Arguments**:

- requestInput `IRequestInput` A [Request](#request-type) object or url.
- requestInit `IRequestInit?` Optional request initialization parameters. Follows w3c specification.
  - Inbound Body currently supports: `string`, `ArrayBuffer`, `null`.
  - Not supported: `Blob`, `FormData`, `ReadableStream`, `URLSearchParams`

Alias for [tab.mainFrameEnvironment.fetch](/docs/hero/basic-interfaces/frame-environment#fetch)

#### **Returns**: [`Promise<Response>`](/docs/awaited-dom/response)

```js
const origin = 'https://dataliberationfoundation.org/';
const getUrl = 'https://dataliberationfoundation.org/mission';

await hero.goto(origin);
const response = await hero.fetch(getUrl);
```

Http Post example with a body:

```js
const origin = 'https://dataliberationfoundation.org/';
const postUrl = 'https://dataliberationfoundation.org/nopost';

await hero.goto(origin);
const response = await hero.fetch(postUrl, {
  method: 'post',
  headers: {
    Authorization: 'Basic ZWx1c3VhcmlvOnlsYWNsYXZl',
  },
  body: JSON.stringify({
    ...params,
  }),
});
```

### tab.getFrameEnvironment*(frameElement)* {#get-frame-environment}

Get the [FrameEnvironment](/docs/hero/basic-interfaces/frame-environment) object corresponding to the provided HTMLFrameElement or HTMLIFrameElement. Use this function to interface with the full environment of the given DOM element without cross-domain restrictions.

Alias for [FrameEnvironment.getFrameEnvironment](/docs/hero/basic-interfaces/frame-environment#get-frame-environment)

### tab.findResource*(filter, options)* {#find-resource}

Find a specific image, stylesheet, script, websocket or other resource that has been received. This function will return the most recently received resource first.

By default, this command will find resources loaded since the current [mainFrameEnvironment](#main-frame-environment) Http Document loaded (excluding in-page navigations).

#### **Arguments**:

- filter `object` Match on "all" of the provided filters:
  - url `string | RegExp` A string or regex to match a url.
  - type [`ResourceType`](/docs/hero/advanced/resource#type) A resource type to filter by.
  - httpRequest `object`
    - statusCode `number` Http status code to filter by.
    - method `string` Http request method to filter by.
- options `object` Accepts any of the following:
  - sinceCommandId `number`. A `commandId` from which to look for resources. Defaults to the last Http Navigation performed on the tab.

#### **Returns**: [`Promise<Resource>`](/docs/hero/advanced/resource)

### tab.findResources*(filter, options)* {#find-resources}

Find a collection of images, stylesheets, scripts, websockets or other resources that have been received. This function will return all matching resources.

By default, this command will find resources loaded since the current [mainFrameEnvironment](#main-frame-environment) Http Document loaded (excluding in-page navigations).

#### **Arguments**:

- filter `object` Match on "all" of the provided filters:
  - url `string | RegExp` A string or regex to match a url.
  - type [`ResourceType`](/docs/hero/advanced/resource#type) A resource type to filter by.
  - httpRequest `object`
    - statusCode `number` Http status code to filter by.
    - method `string` Http request method to filter by.
- options `object` Accepts any of the following:
  - sinceCommandId `number`. A `commandId` from which to look for resources. Defaults to the last Http Navigation performed on the tab.

#### **Returns**: [`Promise<Resource[]>`](/docs/hero/advanced/resource)

### tab.flowCommand*(commandFn, exitState? | options?)* {#flow-command}

A FlowCommand allows you define a "recovery" boundary in the case where an AwaitedDOM error triggers a FlowHandler and modifies your page state. In some cases, you may wish to ensure that a series of commands are re-run instead of a single failing command. For instance, if you lose focus on a modal-window field in the middle of typing, you will want to run the logic that prompted the modal-window to show up.

FlowCommands can define an `exitState`, which will be tested before moving on. An `exitState` is a [`State`](#wait-for-state) object or callback function defined the same as the parameter to [`waitForState`](#wait-for-state). If your function completes and the `exitState` cannot be satisfied, all FlowHandlers will be triggered and the function will try again (up to the `maxRetries` times provided in options).

```js
  await hero.flowCommand(async () => {
    await hero.querySelector('#modalPrompt').$click();
    await hero.querySelector('#field1').$type('text');
  }, assert => {
    assert(hero.querySelector('#field1').value, 'text'); // if false, 1. Prompt FlowHandlers, 2. Retry Command
  });
```

Flow Commands can be nested within each other. If nested commands cannot be completed due to AwaitedDOM errors (interactions, dom errors, dom state timeouts), they will trigger the outer block to be re-tried.

#### **Arguments**:

- commandFn `() => Promise<T>`. Your command function containing one or more Hero commands to retry on AwaitedDOM errors (after resolving one or more FlowHandlers). Any returned value will be returned to the `tab.flowCommand` call.
- exitState `DomState | function(assert: IPageStateAssert): void`. Optional [State](#wait-for-state) object that must resolve before continuing your script execution. If false, FlowHandlers will be retried to determine if another pass should be made.
- options `object`. Optional options to configure this flowCommand. This must be your second argument to `flowCommand`
  - exitState `DomState | function(assert: IPageStateAssert): void`. Optional [State](#wait-for-state) assertion. This parameter is used in place passing a [State](#wait-for-state) directly as a second parameter to `flowCommand`.
  - maxRetries `number`. Default `3`. Optional number of times this FlowCommand should be retried before throwing an error.

#### **Returns**: `Promise<T>`

### tab.focus*()* {#focus}

Make this tab the `activeTab` within a browser, which directs many Hero methods to this tab.

#### **Returns**: `Promise`

### tab.getComputedStyle*(element, pseudoElement)* <div class="specs"><i>W3C</i></div> {#computed-style}

Perform a native `Window.getComputedStyle` request in the current main [FrameEnvironment](/docs/hero/basic-interfaces/frame-environment) - it returns an object containing the values of all CSS properties of an element, after applying active stylesheets and resolving any basic computation those values may contain. Individual CSS property values are accessed through APIs provided by the object, or by indexing with CSS property names.

Alias for [tab.mainFrameEnvironment.getComputedStyle](/docs/hero/basic-interfaces/frame-environment#computed-style).

#### **Arguments**:

- element [`SuperElement`](/docs/awaited-dom/super-element) An element loaded in this tab environment.
- pseudoElement `string?` Optional string specifying the pseudo-element to match (eg, ::before, ::after, etc). More information can be found on [w3c](https://www.w3.org/TR/css-pseudo-4/).

#### **Returns**: [`Promise<CssStyleDeclaration>`](/docs/awaited-dom/cssstyledeclaration)

```js
await hero.goto('https://dataliberationfoundation.org');
const { document, getComputedStyle } = hero.activeTab;
const selector = document.querySelector('h1');
const style = await getComputedStyle(selector);
const opacity = await style.getProperty('opacity');
```

### tab.getJsValue*(path)* {#get-js-value}

Extract any publicly accessible javascript value from the current main [FrameEnvironment](/docs/hero/basic-interfaces/frame-environment) context.

NOTE: This type of operation could potentially be snooped on by the hosting website as it must run in the main Javascript environment
in order to access variables.

Alias for [tab.mainFrameEnvironment.getJsValue](/docs/hero/basic-interfaces/frame-environment#get-js-value).

#### **Arguments**:

- path `string`

#### **Returns**: `Promise<SerializedValue>`

```js
await hero.goto('https://dataliberationfoundation.org');
const navigatorAgent = await hero.activeTab.getJsValue(`navigator.userAgent`);
```

### tab.goBack*(timeoutMs)* {#back}

Navigates to a previous url in the navigation history.

#### **Arguments**:

- timeoutMs `number`. Optional timeout milliseconds. Default `30,000`. A value of `0` will never timeout.

#### **Returns**: `Promise<string>` The new document url.

### tab.goForward*(timeoutMs)* {#forward}

Navigates forward in the navigation history stack.

#### **Arguments**:

- timeoutMs `number`. Optional timeout milliseconds. Default `30,000`. A value of `0` will never timeout.

#### **Returns**: `Promise<string>` The new document url.

### tab.goto*(locationHref, timeoutMs?)* {#goto}

Executes a navigation request for the document associated with the parent Hero instance.

#### **Arguments**:

- locationHref `string` The location to navigate to.
- timeoutMs `number`. Optional timeout milliseconds. Default `30,000`. A value of `0` will never timeout.

#### **Returns**: [`Promise<Resource>`](/docs/hero/advanced/resource) The loaded resource representing this page.

### tab.getComputedVisibility*(node)* {#get-computed-visibility}

Determines if a node from the [mainFrameEnvironment](#main-frame-environment) is visible to an end user. This method checks whether a node (or containing element) has:

- layout: width, height, x and y.
- opacity: non-zero opacity.
- css visibility: the element does not have a computed style where visibility=hidden.
- no overlay: no other element which overlays more than one fourth of this element and has at least 1 pixel over the center of the element.
- on the visible screen (not beyond the horizontal or vertical viewport)

Alias for [tab.mainFrameEnvironment.getComputedVisibility](/docs/hero/basic-interfaces/frame-environment#get-computed-visibility).

#### **Arguments**:

- node [`SuperNode`](/docs/awaited-dom/super-node). The node to determine visibility.

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

### tab.querySelector*(stringOrOptions)* {#query-selector}

This is a shortcut for mainFrame.document.querySelector.

#### **Returns**: [`SuperNode`](/docs/awaited-dom/super-node). A Node that satisfies the given patterns. Evaluates to null if awaited and not present.

### tab.querySelectorAll*(stringOrOptions)* {#query-selector-all}

This is a shortcut for mainFrame.document.querySelectorAll.

#### **Returns**: [`SuperNodeList`](/docs/awaited-dom/super-node-list). A NodeList that satisfies the given patterns. Returns an empty list if a resultset is not found that satisfies the constraints.

### tab.registerFlowHandler*(name, state, handlerFn)* {#register-flow-handler}

Register a [FlowHandler](/docs/hero/advanced/flow) on the given tab. A FlowHandler is a callback function that will be invoked anytime your Hero script encounters Awaited Dom errors. These can be used to correct your script flow.

As an example, imagine you are interacting with a website that sometimes pops up an "Accept Cookies" modal. As you don't know "when" it might trigger, it can be difficult to know when to look for the modal. With a FlowHandler, you declare the [State](#wait-for-state) that should trigger the associated callback, and a function to dismiss the cookie popup.

```js
5.   await hero.registerFlowHandler('CookieModal', assert => {
6.     assert(hero.querySelector('#cookie-modal').$isVisible);
7.   },
8.   async error => {
9.     await hero.querySelector('#cookie-modal .dismiss').$click();
10.  });
```

Once registered, your `CookieModal` FlowHandler will be automatically checked anytime an AwaitedDOM error occurs. These errors are things like: an element can't be found, an element interaction failed, or waiting for an element [State](#wait-for-state) timed out.

So, to continue our example, imagine your script is filling out a form field. As you go to click on the field, it can't be clicked because the `CookieModal` has displayed.

```js
5.    await hero.registerFlowHandler('CookieModal',
...
12.   await hero.querySelector('#field1').$click(); // FAILS DUE TO OBSTRUCTION
```

When your script fails to click on `#field1` (line 12 above), the `CookieModal` handler is checked. It matches the current state, and so triggers closing the modal.

```js
9.     await hero.querySelector('#cookie-modal .dismiss').$click(); <--- Closes the modal!
```

Now your script is no longer obstructed and will re-resume clicking on `#field1` (line 12 above).

You might find it useful to continue to accumulate FlowHandlers as you encounter edge cases in your script. In the default case, your individual commands will be retried when a FlowHandler can resolve your page state. In more advanced cases, you might find that you need to resume a "block" of activities. To handle these cases, we have [FlowCommands](#flow-commands).

[FlowCommands](#flow-commands) are simply ways to group a series of commands together. When an AwaitedDOM error occurs, a Flow Command will re-rerun the entire block. In the example above, your interaction might have many steps. You would want to ensure all steps are run when a failure is encountered.

```js
await hero.flowCommand(async () => {
  await hero.querySelector('#field1').$click();
  await hero.querySelector('#field1').$clearInputText();

  // Failure here resumes the entire block once a FlowHandler fixes the state
  await hero.querySelector('#field1').$type('value');
});
```

#### **Arguments**:

- name `string`. A required name to give to this FlowHandler. NOTE: many FlowHandlers trigger on generic querySelector strings (eg, .modal.a1-regEU). Without this self-documenting name, we found them very difficult to decipher after a few weeks passed.
- state `DomState | function(assert: IPageStateAssert): void`. A [State](#wait-for-state) object or callback for the assertion to match.
- handlerFn `() => Promise<any>`. An asynchronous function in which you can resolve the page state to handle this issue.

#### **Returns**: `Promise<void>`

### tab.reload*(timeoutMs?)* {#reload}

Reload the currently loaded url.

#### **Arguments**:

- timeoutMs `number`. Optional timeout milliseconds. Default `30,000`. A value of `0` will never timeout.

#### **Returns**: [`Promise<Resource>`](/docs/hero/advanced/resource) The loaded resource representing this page.

### tab.takeScreenshot*(options?)* {#take-screenshot}

Takes a screenshot of the current contents rendered in the browser.

#### **Arguments**:

- options `object` Optional
  - format `jpeg | png`. Image format type to create. Default `jpeg`.
  - jpegQuality `number`. Optional compression quality from 1 to 100 for jpeg images (100 is highest quality).
  - rectangle `IRect`. Optionally clip the screenshot to the given rectangle (eg, x, y, width, height). Includes a pixel scale.

#### **Returns**: `Promise<Buffer>` Buffer with image bytes in base64.

### tab.triggerFlowHandlers*()* {#trigger-flow-handler}

Check the state of all [FlowHandlers](#register-flow-handler) and trigger them to run if they match the current page state.

#### **Returns**: `Promise<void>`

### tab.validateState*(state)* {#validate-state}

Check a [State](#wait-for-state) defined as per `tab.waitForState` above. Instead of waiting, this method will check the state a single time and return a boolean if the state is valid.

#### **Arguments**:

- state `object` | `(assert: IPageStateAssert) => void`. A state object or just the callback directly as a shorter option.

#### **Returns**: `Promise<boolean>`

### tab.waitForElement*(element,options)* {#wait-for-element}

Wait until a specific element is present in the dom of the [mainFrameEnvironment](#main-frame-environment).

Alias for [tab.mainFrameEnvironment.waitForElement](/docs/hero/basic-interfaces/frame-environment#wait-for-element).

#### **Arguments**:

- element [`SuperElement`](/docs/awaited-dom/super-element)
- options `object` Accepts any of the following:
  - timeoutMs `number`. Timeout in milliseconds. Default `30,000`.
  - waitForVisible `boolean`. Wait until this element is visible to a user (see [getComputedVisibility](#get-computed-visibility).
  - waitForHidden `boolean`. Wait until this element is hidden to a user (see [getComputedVisibility](#get-computed-visibility).
  - waitForClickable `boolean`. Wait until this element is visible to a user, int the viewport, and unobstructed (see [getComputedVisibility](#get-computed-visibility).

#### **Returns**: `Promise`

### tab.waitForPaintingStable*(options)* {#wait-for-painting-stable}

Wait for the [mainFrameEnvironment](#main-frame-environment) to be loaded such that a user can see the main content above the fold, including on javascript-rendered pages (eg, Single Page Apps). This load event works around deficiencies in using the Document "load" event, which does not always trigger, and doesn't work for Single Page Apps.

Alias for [tab.mainFrameEnvironment.waitForPaintingStable](/docs/hero/basic-interfaces/frame-environment#wait-for-painting-stable).

#### **Arguments**:

- options `object` Optional
  - timeoutMs `number`. Timeout in milliseconds. Default `30,000`.
  - sinceCommandId `number`. A `commandId` from which to look for load status changes.

#### **Returns**: `Promise<void>`

If at the moment of calling this method, the selector already exists, the method will return immediately.

```js
const { activeTab, document } = hero;

const elem = document.querySelector('a.visible');
await activeTab.waitForElement(elem, {
  waitForVisible: true,
});
```

### tab.waitForState*(state, options)* {#wait-for-state}

Wait for a state to be loaded based on a series of conditions. This feature allows you to detect when many different conditions all resolve to true.

Hero normally operates by running each command in order. This makes it a challenge to check for many possible states concurrently. `waitForState` runs the underlying commands for state assertions in one round-trip to Chrome.

Each `assertion` function takes in a state "Promise" and will call the provided "assertion" callback function each time new state is available. Each assertionCallbackFn simply returns true/false if it's given a valid state.

NOTE: Null access exceptions are ignored, so you don't need to worry about individual assertion data being present in the assertion callbacks.

```js
await hero.waitForState({
  name: 'ulixeeLoaded',
  all(assert) {
    assert(hero.url, url => url === 'https://ulixee.org'); // once the url is resolved, it will be checked against https://ulixee.org
    assert(hero.isPaintingStable); // the default function evaluates if the result is true
  },
});

await hero.goto('https://dataliberationfoundation.org');

await hero.waitForState({
  name: 'dlfLoaded',
  all(assert) {
    assert(hero.url, 'https://dataliberationfoundation.org'); // a value will be tested for equality
    assert(hero.isPaintingStable);
    assert(
      hero.document.querySelector('h1').textContent,
      text => text === "It's Time to Open the Data Economy",
    );
  },
});
```

WaitForState can be optionally shortened to the callback:

```js
await hero.waitForState(assert => {
  assert(hero.url, 'https://dataliberationfoundation.org'); // a value will be tested for equality
  assert(hero.isPaintingStable);
  assert(
    hero.document.querySelector('h1').textContent,
    text => text === "It's Time to Open the Data Economy",
  );
});
```

#### **Arguments**:

- state `object` | `function(assert: IPageStateAssert): void`. A state object or just the callback directly as a shorter option.
  - name? `string`. Optional name of the state
  - url? `string` | `Regexp`. Optional url to run this state on (useful for running in a loop)
  - all `function(assert: IPageStateAssert): void`. A synchronous function that will be true if all assertions evaluate to true.
    - assert `function(statePromise: Promise<T>, assertionValueOrCallbackFn: (function(result: T): boolean)): void`. A function that takes a Promise as a first parameter, and a callback that will be checked when new state is available.
      - statePromise `PromiseLike<T>` A Hero Promise that issues a command against this tab (url, isPaintingStable, domElement, isVisible, etc).
      - assertionValueOrCallbackFn `value: T | function(state: T): boolean`. A function that will receive updated state as it becomes available. You should synchronously evaluate to true/false. If this parameter is a non-function, it will be compared for equality.
- options `object` Optional
  - timeoutMs `number`. Timeout in milliseconds. Default `30,000`.

#### **Returns**: `Promise<void>`

### tab.waitForFileChooser*(options)* {#wait-for-file-chooser}

Wait for a `file chooser` dialog to be prompted on the page. This is usually triggered by clicking on an `input` element with `type=file`.

#### **Arguments**:

- options `object` Optional
  - timeoutMs `number`. Timeout in milliseconds. Default `30,000`.
  - sinceCommandId `number`. A `commandId` from which to look for load status changes. Default is to look back to the command preceding this command (eg, a click or interact event).

#### **Returns**: [`Promise<FileChooser>`](/docs/hero/advanced/file-chooser)

### tab.waitForLoad*(status, options)* {#wait-for-load}

Wait for the load status of the [mainFrameEnvironment](#main-frame-environment).

Alias for [tab.mainFrameEnvironment.waitForLoad](/docs/hero/basic-interfaces/frame-environment#wait-for-load).

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

### tab.waitForLocation*(trigger, options)* {#wait-for-location}

Waits for a navigational change to document.location either because of a `reload` event or changes to the URL.

Alias for [tab.mainFrameEnvironment.waitForLocation](/docs/hero/basic-interfaces/frame-environment#wait-for-location).

#### **Arguments**:

- trigger `change | reload` The same url has been reloaded, or it's a new url.
- options `object`
  - timeoutMs `number`. Timeout in milliseconds. Default `30,000`.
  - sinceCommandId `number`. A `commandId` from which to look for changes.

#### **Returns**: [`Promise<Resource>`](/docs/hero/advanced/resource) The resource representing this location change or reload.

Location changes are triggered in one of two ways:

<div class="show-table-header show-bottom-border minimal-row-height"></div>

| Trigger  | Description                                                    |
| -------- | -------------------------------------------------------------- |
| `change` | A navigational change to document.location has been triggered. |
| `reload` | A reload of the current document.location has been triggered.  |

The following example waits for a new page to load after clicking on an anchor tag:

```js
const { activeTab } = hero;
await activeTab.goto('http://example.com');

await activeTab.querySelector('a').$click();
await activeTab.waitForLocation('change');

const newUrl = await activeTab.url;
```

### tab.waitForMillis*(millis)* {#wait-for-millis}

Waits for the specified number of milliseconds.

#### **Arguments**:

- millis `number`

#### **Returns**: `Promise`

### tab.waitForResource*(filter, options)* {#wait-for-resource}

Wait until a specific image, stylesheet, script, websocket or other resource URL has been received.

By default, this command will find [Resources](/docs/hero/advanced/resource) loaded since the previous command.

#### **Arguments**:

- filter `object` Accepts any of the following:
  - url `string | RegExp` A string or regex to match a url on
  - type [`ResourceType`](/docs/hero/advanced/resource#type) A resource type to filter on
  - filterFn `function(resource: Resource): Promise<boolean>` A function to allow further filtering of returned resources. Return true to use a specific Resource, false to continue searching.
- options `object` Accepts any of the following:
  - timeoutMs `number`. Timeout in milliseconds. Default `60,000`.
  - sinceCommandId `number`. A `commandId` from which to look for resources. Defaults to previous command.
  - throwIfTimeout `boolean`. Throw an exception if a timeout occurs. Default `true`.

#### **Returns**: [`Promise<Resource>`](/docs/hero/advanced/resource)

```js
const { activeTab } = hero;

await activeTab.goto('http://example.com');
const lastCommandId = activeTab.lastCommandId;

await hero.querySelector('#submit').$click(button);

const xhrAfterSubmit = await activeTab.waitForResource(
  {
    type: 'Xhr',
  },
  {
    sinceCommandId: lastCommandId,
  },
);
```

### tab.waitForResources*(filter, options)* {#wait-for-resources}

Wait for more than one image, stylesheet, script, websocket or other resources that have been received.

By default, this command will find [Resources](/docs/hero/advanced/resource) loaded since the previous command.

#### **Arguments**:

- filter `object` Accepts any of the following:
  - url `string | RegExp` A string or regex to match a url on
  - type [`ResourceType`](/docs/hero/advanced/resource#type) A resource type to filter on
  - filterFn `function(resource: Resource, done: Callback): Promise<boolean>` A function to allow further filtering of returned resources. Return true to include a Resource, false to exclude. Calling `done` finishes execution.
- options `object` Accepts any of the following:
  - timeoutMs `number`. Timeout in milliseconds. Default `60,000`.
  - sinceCommandId `number`. A `commandId` from which to look for resources. Defaults to previous command.
  - throwIfTimeout `boolean`. Throw an exception if a timeout occurs. Default `true`.

#### **Returns**: [`Promise<Resource[]>`](/docs/hero/advanced/resource)

```js
const { activeTab, document } = hero;

await activeTab.goto('http://example.com');

const elem = document.querySelector('a');
await hero.click(elem);

// get all Fetches that have occurred on the page thus far.
const allFetchResources = await activeTab.waitForResources({
  type: 'Fetch',
});
```

### tab.xpathSelector*(selector, orderedResults)* {#xpath-selector}

This is a shortcut for mainFrame.document.evaluate(`selector`, document, `FIRST_ORDERED_NODE_TYPE` | `ANY_UNORDERED_NODE_TYPE`)

#### **Arguments**:

- selector `string`. An XPath selector that can return a single node result.
- orderedResults `boolean`. Optional boolean to indicate if results should return first ordered result. Default is false.

#### **Returns**: [`SuperNode`](/docs/awaited-dom/super-node). A Node that satisfies the given patterns. Evaluates to null if awaited and not present.

### tab.xpathSelectorAll*(selector, orderedResults)* {#xpath-selector-all}

This is a shortcut for mainFrame.document.evaluate(`selector`, document, `ORDERED_NODE_ITERATOR_TYPE` | `UNORDERED_NODE_ITERATOR_TYPE`).

NOTE: this API will iterate through the results to return an array of all matching nodes.

#### **Arguments**:

- selector `string`. An XPath selector that can return node results.
- orderedResults `boolean`. Optional boolean to indicate if results should return first ordered result. Default is false.

#### **Returns**: Promise<Array<[`SuperNode`](/docs/awaited-dom/super-node)>>. A promise resolving to an array of nodes that satisfies the given pattern.

## Events

Hero's [EventTarget](/docs/hero/basic-interfaces/event-target) interface deviates from the official W3C implementation in that it adds several additional method aliases such as `on` and `off`. [Learn more](/docs/hero/basic-interfaces/event-target).

### 'dialog' {#dialog}

Emitted when a dialog is prompted on the screen

#### **Arguments in callback**:

- [`Dialog`](/docs/hero/advanced/dialog)

### 'resource' {#resource-event}

Emitted for each resource request received by the webpage.

#### **Arguments in callback**:

- [`Resource`](/docs/hero/advanced/resource) | [`WebsocketResource`](/docs/hero/advanced/websocket-resource)
