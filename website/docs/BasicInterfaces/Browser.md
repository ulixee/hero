# Browser

Browser is the onramp to most of SecretAgent's functionality. It's home to a variety of functions, namespaces, and objects.

Unlike most other browsers, SecretAgent has no concept of tabs, only browsers with a single window (for the time being).

Each Browser instance has its own cache, cookies, session data, and [emulator](../advanced-features/emulators). No data is shared between instances -- each operates within an airtight sandbox to ensure no identities leak across requests.

## Constructor

You must create a new Browser using [SecretAgent.createBrowser](./secret-agent#createBrowser).

## Properties

### browser.cookies {#cookies}

Returns an array of cookie objects from the current document.

#### **Type**: `Promise<Cookie[]>`

### browser.document <div class="specs"><i>W3C</i></div> {#document}

Returns a reference to the document that the browser contains.

#### **Type**: `SuperDocument`

### browser.user {#user}

Returns a reference to the User instance controlling interaction with the browser.

#### **Type**: `User`

### browser.sessionId {#sessionId}

An identifier used for storing logs, snapshots, and other assets associated with the current browser session.

#### **Type**: `Promise<string>`

### browser.sessionName {#sessionName}

A human-readable identifier of the current browser session.

You can set this property when calling [SecretAgent.createBrowser](./secret-agent#create-browser).

#### **Type**: `Promise<string>`

### browser.lastCommandId {#lastCommandId}

An execution point that refers to a command run on this Browser (`waitForElement`, `click`, `type`, etc). Command ids can be passed to select `waitFor*` functions to indicate a starting point to listen for changes.

#### **Type**: `number`

#### **Alias**: `user.lastCommandId`

### browser.Request <div class="specs"><i>W3C</i></div> {#request-type}

Returns a constructor for a Request object that can be sent to [browser.fetch(request)](#fetch).

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

### browser.fetch*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#fetch}

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

### browser.close*()* {#close}

Closes the current browser.

#### **Returns**: `Promise`

### browser.configure*(\[options])* {#configure}

Update existing configuration settings.

#### **Arguments**:

- options `object` Accepts any of the following:
  - emulatorId `string`. Emulate a specific browser version.
  - humanoidId `string`. Create human-like mouse/keyboard movements.
  - renderingOptions `string[]`. Controls browser functionality.

#### **Returns**: `Promise`

See the [Configuration](../overview/configuration) page for more details on `options` and its defaults. You may also want to explore [Emulators](../advanced/emulators) and [Humanoids](../advanced/humanoids).

### browser.getJsValue*(path)* {#get-js-value}

Extract any publicly accessible javascript value from the webpage context.

#### **Arguments**:

- path `string`

#### **Returns**: `Promise<SerializedValue>`

## Aliased User Methods

Browser instances have aliases to all top level User interaction methods:

### browser.goto*(href)*

Alias for [User.goto](./user#goto)

### browser.click*(mousePosition)*

Alias for [User.click](./user#click)

### browser.interact*(interaction\[, interaction, ...])*

Alias for [User.interact](./user#interact)

### browser.type*(keyboardInteraction\[, keyboardInteraction, ...])*

Alias for [User.type](./user#type)

### browser.waitForAllContentLoaded*()*

Alias for [User.waitForLoad(AllContentLoaded)](./user#wait-for-load)

### browser.waitForResource*(filter, options)*

Alias for [User.waitForResource](./user#wait-for-resource)

### browser.waitForElement*(element)*

Alias for [User.waitForElement](./user#wait-for-element)

### browser.waitForLocation*(trigger)*

Alias for [User.waitForLocation](./user#wait-for-location)

### browser.waitForMillis*(millis)*

Alias for [User.waitForMillis](./user#wait-for-millis)

### browser.waitForWebSocket*(filename)*

Alias for [User.waitForWebSocket](./user#wait-for-websocket)

## Events

SecretAgent's [EventTarget](./event-target) interface deviates from the official W3C implementation in that it adds several additional method aliases such as `on` and `off`. [Learn more](./event-target).

### 'close' {#close-event}

Called after the browser is closed

### 'resource' {#resource-event}

Emitted when a resource request is received by the webpage.

#### **Arguments in callback**:

- `Resource | WebsocketResource`
