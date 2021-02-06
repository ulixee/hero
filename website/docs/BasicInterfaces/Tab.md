# Tab

A Tab is similar to a tab in a consumer browser. Each Tab drives an underlying document with its own page lifecycle and resources. Many of the tab functions are available from the SecretAgent object.

## Constructor

A default tab is provided in each Agent instance. Navigate by using the [secretAgent.goto](/docs/basic-interfaces/secret-agent#goto) method.

When a new window is "popped up" (ie, `<a href="/new-place" target="_blank"`), a tab will automatically be associated with the Agent instance. These can be discovered using the [secretAgent.tabs](/docs/basic-interfaces/secret-agent#tabs) method, or waiting with [secretAgent.waitForNewTab()](/docs/basic-interfaces/secret-agent#wait-for-new-tab).

## Properties

### tab.cookieStorage {#cookie-storage}

Returns a [CookieStorage](/docs/advanced/cookie-storage) instance to get/set/delete Tab cookies.

#### **Type**: [`CookieStorage`](/docs/advanced/cookie-storage)

### tab.document <div class="specs"><i>W3C</i></div> {#document}

Returns a reference to the document of the tab.

#### **Type**: [`SuperDocument`](/docs/awaited-dom/super-document)

### tab.lastCommandId {#lastCommandId}

An execution point that refers to a command run on this Agent instance (`waitForElement`, `click`, `type`, etc). Command ids can be passed to select `waitFor*` functions to indicate a starting point to listen for changes.

#### **Type**: `Promise<number>`

### tab.localStorage <div class="specs"><i>W3C</i></div> {#local-storage}

Returns a reference to the [Storage](/docs/awaited-dom/storage) object managing localStorage for the tab.

#### **Type**: [`Storage`](/docs/awaited-dom/storage)

### tab.sessionStorage <div class="specs"><i>W3C</i></div> {#session-storage}

Returns a reference to the [Storage](/docs/awaited-dom/storage) object managing sessionStorage for the tab.

#### **Type**: [`Storage`](/docs/awaited-dom/storage)

### tab.tabId {#tabid}

An identifier for the tab.

#### **Type**: `Promise<string>`

### tab.url {#url}

The url of the active tab.

#### **Type**: `Promise<string>`

### tab.Request <div class="specs"><i>W3C</i></div> {#request-type}

Returns a constructor for a [Request](/docs/awaited-dom/request) object that can be sent to [tab.fetch(request)](#fetch).

```js
const { Request, fetch } = agent;
const url = 'https://dataliberationfoundation.org';
const request = new Request(url, {
  headers: {
    'X-From': 'https://secretagent.dev',
  },
});
const response = await fetch(request);
```

#### **Type**: [`Request`](/docs/awaited-dom/request)

## Methods

### tab.close*()* {#close}

Closes the current tab only (will close the whole Agent instance if there are no open tabs).

#### **Returns**: `Promise`

### tab.fetch*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#fetch}

Perform a native "fetch" request in the current tab context.

#### **Arguments**:

- requestInput `IRequestInput` A [Request](#request-type) object or url.
- requestInit `IRequestInit?` Optional request initialization parameters. Follows w3c specification.
  - Inbound Body currently supports: `string`, `ArrayBuffer`, `null`.
  - Not supported: `Blob`, `FormData`, `ReadableStream`, `URLSearchParams`

#### **Returns**: [`Promise<Response>`](/docs/awaited-dom/response)

```js
const url = 'https://dataliberationfoundation.org';
const response = await agent.fetch(url);
```

Http Post example with a body:

```js
const url = 'https://dataliberationfoundation.org/nopost';
const response = await agent.fetch(url, {
  method: 'post',
  headers: {
    Authorization: 'Basic ZWx1c3VhcmlvOnlsYWNsYXZl',
  },
  body: JSON.stringify({
    ...params,
  }),
});
```

### tab.focus*()* {#focus}

Make this tab the `activeTab` within a browser, which directs many SecretAgent methods to this tab.

#### **Returns**: `Promise`

### tab.getComputedStyle*(element, pseudoElement)* <div class="specs"><i>W3C</i></div> {#computed-style}

Perform a native `Window.getComputedStyle` request in the current tab context - it returns an object containing the values of all CSS properties of an element, after applying active stylesheets and resolving any basic computation those values may contain. Individual CSS property values are accessed through APIs provided by the object, or by indexing with CSS property names.

#### **Arguments**:

- element [`SuperElement`](/docs/awaited-dom/super-element) An element loaded in this tab environment.
- pseudoElement `string?` Optional string specifying the pseudo-element to match (eg, ::before, ::after, etc). More information can be found on [w3c](https://www.w3.org/TR/css-pseudo-4/).

#### **Returns**: [`Promise<CssStyleDeclaration>`](/docs/awaited-dom/cssstyledeclaration)

```js
await agent.goto('https://dataliberationfoundation.org');
const { document, getComputedStyle } = agent.activeTab;
const selector = document.querySelector('h1');
const style = await getComputedStyle(selector);
const opacity = await style.getProperty('opacity');
```

### tab.getJsValue*(path)* {#get-js-value}

Extract any publicly accessible javascript value from the webpage context.

#### **Arguments**:

- path `string`

#### **Returns**: `Promise<SerializedValue>`

```js
await agent.goto('https://dataliberationfoundation.org');
const navigatorAgent = await agent.activeTab.getJsValue(`navigator.userAgent`);
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

Executes a navigation request for the document associated with the parent SecretAgent instance.

#### **Arguments**:

- locationHref `string` The location to navigate to.
- timeoutMs `number`. Optional timeout milliseconds. Default `30,000`. A value of `0` will never timeout.

#### **Returns**: [`Promise<Resource>`](/docs/advanced/resource) The loaded resource representing this page.

### tab.isElementVisible*(element)* {#is-element-visible}

Determines if an element is visible to an end user. This method checks whether an element has:

- layout: width, height, x and y.
- opacity: non-zero opacity.
- css visibility: the element does not have a computed style where visibility=hidden.
- no overlay: no other element which overlays more than one fourth of this element and has at least 1 pixel over the center of the element.

#### **Arguments**:

- element [`SuperElement`](/docs/awaited-dom/super-element). The element to determine visibility.

#### **Returns**: `Promise<boolean>` Whether the element is visible to an end user.

### tab.reload*(timeoutMs?)* {#reload}

Reload the currently loaded url.

#### **Arguments**:

- timeoutMs `number`. Optional timeout milliseconds. Default `30,000`. A value of `0` will never timeout.

#### **Returns**: [`Promise<Resource>`](/docs/advanced/resource) The loaded resource representing this page.

### tab.takeScreenshot*(options?)* {#take-screenshot}

Takes a screenshot of the current contents rendered in the browser. 

#### **Arguments**:

- options `object` Optional
  - format `jpeg | png`. Image format type to create. Default `jpeg`.
  - jpegQuality `number`. Optional compression quality from 1 to 100 for jpeg images (100 is highest quality).
  - rectangle `IRect`. Optionally clip the screenshot to the given rectangle (eg, x, y, width, height). Includes a pixel scale. 

#### **Returns**: `Promise<Buffer>` Buffer with image bytes in base64.

### tab.waitForPaintingStable*(options)* {#wait-for-painting-stable}

Wait for the page to be loaded such that a user can see the main content above the fold, including on javascript-rendered pages (eg, Single Page Apps). This load event works around deficiencies in using the Document "load" event, which does not always trigger, and doesn't work for Single Page Apps.

#### **Arguments**:

- options `object` Optional
  - timeoutMs `number`. Timeout in milliseconds. Default `30,000`.
  - sinceCommandId `number`. A `commandId` from which to look for load status changes.

#### **Returns**: `Promise<void>`

### tab.waitForElement*(element)* {#wait-for-element}

Wait until a specific element is present in the dom.

#### **Arguments**:

- element [`SuperElement`](/docs/awaited-dom/super-element)
- options `object` Accepts any of the following:
  - timeoutMs `number`. Timeout in milliseconds. Default `30,000`.
  - waitForVisible `boolean`. Wait until this element is visible to a user (see [isElementVisible](#is-element-visible).

#### **Returns**: `Promise`

If at the moment of calling this method, the selector already exists, the method will return immediately.

```js
const { activeTab, document } = agent;

const elem = document.querySelector('a.visible');
await activeTab.waitForElement(elem, {
  waitForVisible: true,
});
```

### tab.waitForLoad*(status, options)* {#wait-for-load}

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
| `PaintingStable`      | The page has loaded the main content above the fold. Works on javascript-rendered pages. |

### tab.waitForLocation*(trigger, options)* {#wait-for-location}

Waits for a navigational change to document.location either because of a `reload` event or changes to the URL.

#### **Arguments**:

- trigger `change | reload` The same url has been reloaded, or it's a new url.
- options `object`
  - timeoutMs `number`. Timeout in milliseconds. Default `30,000`.
  - sinceCommandId `number`. A `commandId` from which to look for changes.

#### **Returns**: `Promise`

Location changes are triggered in one of two ways:

<div class="show-table-header show-bottom-border minimal-row-height"></div>

| Trigger  | Description                                                    |
| -------- | -------------------------------------------------------------- |
| `change` | A navigational change to document.location has been triggered. |
| `reload` | A reload of the current document.location has been triggered.  |

The following example waits for a new page to load after clicking on an anchor tag:

```js
const { user, activeTab, document } = agent;
await activeTab.goto('http://example.com');

await user.click(document.querySelector('a'));
await activeTab.waitForLocation('change');

const newUrl = await activeTab.url;
```

### tab.waitForResource*(filter, options)* {#wait-for-resource}

Wait until a specific image, stylesheet, script, websocket or other resource URL has been received.

#### **Arguments**:

- filter `object` Accepts any of the following:
  - url `string | RegExp` A string or regex to match a url on
  - type [`ResourceType`](/docs/advanced/resource#type) A resource type to filter on
  - filterFn `function(resource: Resource, done: Callback): boolean` A function to allow further filtering of returned resources. Return true to include resources, false to exclude. Calling `done` finishes execution.
- options `object` Accepts any of the following:
  - timeoutMs `number`. Timeout in milliseconds. Default `60,000`.
  - sinceCommandId `number`. A `commandId` from which to look for resources.
  - throwIfTimeout `boolean`. Throw an exception if a timeout occurs. Default `true`.

#### **Returns**: [`Promise<Resource[]>`](/docs/advanced/resource)

```js
const { user, activeTab, document } = agent;

await activeTab.goto('http://example.com');

const elem = document.querySelector('a');
await agent.click(elem);

// get all Fetches that have occurred on the page thus far.
const allFetchResources = await activeTab.waitForResource({
  type: 'Fetch',
});

const lastCommandId = activeTab.lastCommandId;

const button = document.querySelector('#submit');
await agent.click(button);

const xhrsAfterSubmit = await activeTab.waitForResource(
  {
    type: 'Xhr',
  },
  {
    sinceCommandId: lastCommandId,
  },
);
```

### tab.waitForMillis*(millis)* {#wait-for-millis}

Waits for the specified number of milliseconds.

#### **Arguments**:

- millis `number`

#### **Returns**: `Promise`

## Events

SecretAgent's [EventTarget](/docs/basic-interfaces/event-target) interface deviates from the official W3C implementation in that it adds several additional method aliases such as `on` and `off`. [Learn more](/docs/basic-interfaces/event-target).

### 'resource' {#resource-event}

Emitted for each resource request received by the webpage.

#### **Arguments in callback**:

- [`Resource`](/docs/advanced/resource) | [`WebsocketResource`](/docs/advanced/websocket-resource)
