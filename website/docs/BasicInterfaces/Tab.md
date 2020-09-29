# Tab

A Tab is similar to a tab in a consumer Browser. Each Tab drives an underlying document with it's own page lifecycle and resources. Many of the tab functions are available from the Browser object.

## Constructor

A default tab is provided in each Browser. Navigate by using the [SecretAgent.goto](./secret-agent#goto) method.

When a new window is "popped up" (ie, `<a href="/new-place" target="_blank"`), a tab will automatically be associated with the Browser. These can be discovered using the [Browser.tabs](./browser#tabs) method, or waiting with [Browser.waitForNewTab()](./browser#wait-for-new-tab).

## Properties

### tab.document <div class="specs"><i>W3C</i></div> {#document}

Returns a reference to the document that the active tab contains.

#### **Type**: `SuperDocument`

### tab.url {#url}

The url of the active tab.

#### **Type**: `Promise<string>`

### tab.cookies {#cookies}

Returns an array of cookie objects from the current document.

#### **Type**: `Promise<Cookie[]>`

### tab.tabId {#tabid}

An identifier for the tab.

#### **Type**: `Promise<string>`

### tab.lastCommandId {#lastCommandId}

An execution point that refers to a command run on this Browser (`waitForElement`, `click`, `type`, etc). Command ids can be passed to select `waitFor*` functions to indicate a starting point to listen for changes.

#### **Type**: `number`

### tab.Request <div class="specs"><i>W3C</i></div> {#request-type}

Returns a constructor for a Request object that can be sent to [tab.fetch(request)](#fetch).

```js
const browser = await SecretAgent.createBrowser();
const { Request, fetch } = browser;
const url = 'https://dataliberationfoundation.org';
const request = new Request(url, {
  headers: {
    'X-From': 'https://secretagent.dev',
  },
});
const response = await fetch(request);
```

#### **Type**: `Request`

## Methods

### tab.close*()* {#close}

Closes the current tab only (will close the whole browser if there are no open tabs).

#### **Returns**: `Promise`

### tab.fetch*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#fetch}

Perform a native "fetch" request in the current browser context.

#### **Arguments**:

- requestInput `IRequestInput` A [Request](#request-type) object or url.
- requestInit `IRequestInit?` Optional request initialization parameters. Follows w3c specification.
  - Inbound Body currently supports: `string`, `ArrayBuffer`, `null`.
  - Not supported: `Blob`, `FormData`, `ReadableStream`, `URLSearchParams`

#### **Returns**: `Promise<Response>`

```js
const browser = await SecretAgent.createBrowser();
const url = 'https://dataliberationfoundation.org';
const response = await browser.fetch(url);
```

Http Post example with a body:

```js
const browser = await SecretAgent.createBrowser();
const url = 'https://dataliberationfoundation.org/nopost';
const response = await browser.fetch(url, {
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

Make this tab the `activeTab` within a browser, which directs Browser functions to this tab.

#### **Arguments**:

- options `object` Accepts any of the following:
  - emulatorId `string`. Emulate a specific browser version.
  - humanoidId `string`. Create human-like mouse/keyboard movements.
  - renderingOptions `string[]`. Controls browser functionality.
  - showReplay `boolean`. Whether or not to show the Replay UI. Can also be set with an env variable: `SA_SHOW_REPLAY=true`.

#### **Returns**: `Promise`

See the [Configuration](../overview/configuration) page for more details on `options` and its defaults. You may also want to explore [Emulators](../advanced/emulators) and [Humanoids](../advanced/humanoids).

### tab.getJsValue*(path)* {#get-js-value}

Extract any publicly accessible javascript value from the webpage context.

#### **Arguments**:

- path `string`

#### **Returns**: `Promise<SerializedValue>`

```js
const browser = await SecretAgent.createBrowser();
await browser.goto('https://dataliberationfoundation.org');
const navigatorAgent = await browser.activeTab.getJsValue(`navigator.userAgent`);
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

#### **Returns**: `Promise<Resource>` The loaded resource representing this page.

### tab.waitForAllContentLoaded*()* {#wait-for-all-content}

Wait for the "load" DOM event. We renamed this to be more explicit because we're always mixing up DOMContentLoaded and load.

#### **Returns**: `Promise<void>`

### tab.waitForElement*(element)* {#wait-for-element}

Wait until a specific element is present in the dom.

#### **Arguments**:

- element `SuperElement`
- options `object` Accepts any of the following:
  - timeoutMs `number`. Timeout in milliseconds.
  - waitForVisible `boolean`. Wait until this element is visible.

#### **Returns**: `Promise`

If at the moment of calling this method, the selector already exists, the method will return immediately.

```js
const browser = await SecretAgent.createBrowser();
const { activeTab, document } = browser;

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
const browser = await SecretAgent.createBrowser();
const { user, activeTab, document } = browser;
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
  - type `ResourceType` A resource type to filter on
  - filterFn `function(resource: Resource, done: Callback): boolean` A function to allow further filtering of returned resources. Return true to include resources, false to exclude. Calling `done` finishes execution.
- options `object` Accepts any of the following:
  - timeoutMs `number`. Timeout in milliseconds
  - throwIfTimeout `boolean`. Throw an exception if a timeout occurs. Default `true`
  - sinceCommandId `number`. A `commandId` from which to look for resources.

#### **Returns**: `Promise<Resource[]>`

```js
const browser = await SecretAgent.createBrowser();
const { user, activeTab, document } = browser;

await activeTab.goto('http://example.com');

const elem = document.querySelector('a');
await user.click(elem);

// get all Fetches that have occurred on the page thus far.
const allFetchResources = await activeTab.waitForResource({
  type: 'Fetch',
});

const lastCommandId = activeTab.lastCommandId;

const button = document.querySelector('#submit');
await user.click(button);

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

#### **Returns**: `Promise<WebSocket>`

## Events

SecretAgent's [EventTarget](./event-target) interface deviates from the official W3C implementation in that it adds several additional method aliases such as `on` and `off`. [Learn more](./event-target).

### 'resource' {#resource-event}

Emitted for each resource request received by the webpage.

#### **Arguments in callback**:

- `Resource | WebsocketResource`
