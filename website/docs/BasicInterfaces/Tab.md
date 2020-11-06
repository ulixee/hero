# Tab

A Tab is similar to a tab in a consumer browser. Each Tab drives an underlying document with its own page lifecycle and resources. Many of the tab functions are available from the SecretAgent object.

## Constructor

A default tab is provided in each SecretAgent instance. Navigate by using the [secretAgent.goto](./secret-agent#goto) method.

When a new window is "popped up" (ie, `<a href="/new-place" target="_blank"`), a tab will automatically be associated with the SecretAgent instance. These can be discovered using the [secretAgent.tabs](./secret-agent#tabs) method, or waiting with [secretAgent.waitForNewTab()](./secret-agent#wait-for-new-tab).

## Properties

### tab.cookieStorage {#cookie-storage}

Returns a [CookieStorage](../advanced/cookie-storage) instance to get/set/delete Tab cookies.

#### **Type**: [`CookieStorage`](../advanced/cookie-storage)

### tab.document <div class="specs"><i>W3C</i></div> {#document}

Returns a reference to the document of the tab.

#### **Type**: [`SuperDocument`](../awaited-dom/super-document)

### tab.lastCommandId {#lastCommandId}

An execution point that refers to a command run on this SecretAgent instance (`waitForElement`, `click`, `type`, etc). Command ids can be passed to select `waitFor*` functions to indicate a starting point to listen for changes.

#### **Type**: `Promise<number>`

### tab.localStorage <div class="specs"><i>W3C</i></div> {#local-storage}

Returns a reference to the [Storage](../awaited-dom/storage) object managing localStorage for the tab.

#### **Type**: [`Storage`](../awaited-dom/storage)

### tab.sessionStorage <div class="specs"><i>W3C</i></div> {#session-storage}

Returns a reference to the [Storage](../awaited-dom/storage) object managing sessionStorage for the tab.

#### **Type**: [`Storage`](../awaited-dom/storage)

### tab.tabId {#tabid}

An identifier for the tab.

#### **Type**: `Promise<string>`

### tab.url {#url}

The url of the active tab.

#### **Type**: `Promise<string>`

### tab.Request <div class="specs"><i>W3C</i></div> {#request-type}

Returns a constructor for a [Request](../awaited-dom/request) object that can be sent to [tab.fetch(request)](#fetch).

```js
const agent = await new SecretAgent();
const { Request, fetch } = agent;
const url = 'https://dataliberationfoundation.org';
const request = new Request(url, {
  headers: {
    'X-From': 'https://secretagent.dev',
  },
});
const response = await fetch(request);
```

#### **Type**: [`Request`](../awaited-dom/request)

## Methods

### tab.close*()* {#close}

Closes the current tab only (will close the whole SecretAgent instance if there are no open tabs).

#### **Returns**: `Promise`

### tab.fetch*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#fetch}

Perform a native "fetch" request in the current tab context.

#### **Arguments**:

- requestInput `IRequestInput` A [Request](#request-type) object or url.
- requestInit `IRequestInit?` Optional request initialization parameters. Follows w3c specification.
  - Inbound Body currently supports: `string`, `ArrayBuffer`, `null`.
  - Not supported: `Blob`, `FormData`, `ReadableStream`, `URLSearchParams`

#### **Returns**: [`Promise<Response>`](../awaited-dom/response)

```js
const agent = new SecretAgent();
const url = 'https://dataliberationfoundation.org';
const response = await agent.fetch(url);
```

Http Post example with a body:

```js
const agent = new SecretAgent();
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

### tab.getJsValue*(path)* {#get-js-value}

Extract any publicly accessible javascript value from the webpage context.

#### **Arguments**:

- path `string`

#### **Returns**: `Promise<SerializedValue>`

```js
const agent = new SecretAgent();
await agent.goto('https://dataliberationfoundation.org');
const navigatorAgent = await agent.activeTab.getJsValue(`navigator.userAgent`);
```

### tab.goBack*()* {#back}

Navigates to a previous url in the navigation history.

#### **Returns**: `Promise<string>` The new document url.

### tab.goForward*()* {#forward}

Navigates forward in the navigation history stack.

#### **Returns**: `Promise<string>` The new document url.

### tab.goto*(locationHref)* {#goto}

Executes a navigation request for the document associated with the parent Secret Agent instance.

#### **Arguments**:

- locationHref `string` The location to navigate to.

#### **Returns**: [`Promise<Resource>`](../advanced/resource) The loaded resource representing this page.

### tab.isElementVisible*(element)* {#is-element-visible}

Determines if an element is visible to an end user. This method checks whether an element has:

- layout: width, height, x and y.
- opacity: non-zero opacity.
- css visibility: the element does not have a computed style where visibility=hidden.
- no overlay: no other element which overlays more than one fourth of this element and has at least 1 pixel over the center of the element.

#### **Arguments**:

- element [`SuperElement`](../awaited-dom/super-element). The element to determine visibility.

#### **Returns**: `Promise<boolean>` Whether the element is visible to an end user.

### tab.waitForAllContentLoaded*()* {#wait-for-all-content}

Wait for the "load" DOM event. We renamed this to be more explicit because we're always mixing up DOMContentLoaded and load.

#### **Returns**: `Promise<void>`

### tab.waitForElement*(element)* {#wait-for-element}

Wait until a specific element is present in the dom.

#### **Arguments**:

- element [`SuperElement`](../awaited-dom/super-element)
- options `object` Accepts any of the following:
  - timeoutMs `number`. Timeout in milliseconds.
  - waitForVisible `boolean`. Wait until this element is visible to a user (see [isElementVisible](#is-element-visible).

#### **Returns**: `Promise`

If at the moment of calling this method, the selector already exists, the method will return immediately.

```js
const agent = new SecretAgent();
const { activeTab, document } = agent;

const elem = document.querySelector('a.visible');
await activeTab.waitForElement(elem, {
  waitForVisible: true,
});
```

### tab.waitForLoad*(status)* {#wait-for-load}

Wait for the load status to occur on a page.

#### **Arguments**:

- status `NavigationRequested | HttpRequested | HttpResponsed | HttpRedirected | DomContentLoaded | AllContentLoaded` The load status event to wait for.

#### **Returns**: `Promise<void>`

The following are possible statuses and their meanings:

<div class="show-table-header show-bottom-border minimal-row-height"></div>

| Status                | Description                                                                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NavigationRequested` | A navigation request is initiated by the page or user                                                                                                                               |
| `HttpRequested`       | The http request for the document has been initiated                                                                                                                                |
| `HttpResponded`       | The http response has been retrieved                                                                                                                                                |
| `HttpRedirected`      | The original http request was redirected                                                                                                                                            |
| `DomContentLoaded`    | The dom content has been received and loaded into the document                                                                                                                      |
| `AllContentLoaded`    | All dependent resources such as stylesheets and images. This is similar to the traditional [window load event](https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event). |

### tab.waitForLocation*(trigger)* {#wait-for-location}

Waits for a navigational change to document.location either because of a `reload` event or changes to the URL.

#### **Arguments**:

- trigger `change | reload` The same url has been reloaded, or it's a new url.

#### **Returns**: `Promise`

Location changes are triggered in one of two ways:

<div class="show-table-header show-bottom-border minimal-row-height"></div>

| Trigger  | Description                                                    |
| -------- | -------------------------------------------------------------- |
| `change` | A navigational change to document.location has been triggered. |
| `reload` | A reload of the current document.location has been triggered.  |

The following example waits for a new page to load after clicking on an anchor tag:

```js
const agent = new SecretAgent();
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
  - type [`ResourceType`](../advanced/resource#type) A resource type to filter on
  - filterFn `function(resource: Resource, done: Callback): boolean` A function to allow further filtering of returned resources. Return true to include resources, false to exclude. Calling `done` finishes execution.
- options `object` Accepts any of the following:
  - timeoutMs `number`. Timeout in milliseconds
  - throwIfTimeout `boolean`. Throw an exception if a timeout occurs. Default `true`
  - sinceCommandId `number`. A `commandId` from which to look for resources.

#### **Returns**: [`Promise<Resource[]>`](../advanced/resource)

```js
const agent = new SecretAgent();
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

### tab.waitForWebSocket*(filename)* {#wait-for-websocket}

Waits until the specified web socket has been received.

#### **Arguments**:

- filename `number | RegExp`

#### **Returns**: [`Promise<WebSocketResource>`](../advanced/websocket-resource)

## Events

SecretAgent's [EventTarget](./event-target) interface deviates from the official W3C implementation in that it adds several additional method aliases such as `on` and `off`. [Learn more](./event-target).

### 'resource' {#resource-event}

Emitted for each resource request received by the webpage.

#### **Arguments in callback**:

- [`Resource`](../advanced/resource) | [`WebsocketResource`](../advanced/websocket-resource)
