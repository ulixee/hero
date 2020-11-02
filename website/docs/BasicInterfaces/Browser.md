# Browser

Browser is the onramp to most of SecretAgent's functionality. It's home to a variety of methods, namespaces, and objects.

Unlike most other browsers, SecretAgent is initialized with a single window that can spawn tabs. Only a single tab can be focused at a time, meaning clicks and other user interaction will go to the active tab.

Each Browser instance has its own cache, cookies, session data, and [emulator](../advanced-features/emulators). No data is shared between instances -- each operates within an airtight sandbox to ensure no identities leak across requests.

## Constructor

You must create a new Browser using [SecretAgent.createBrowser](./secret-agent#createBrowser).

## Properties

### browser.activeTab {#active-tab}

Returns a reference to the currently active tab.

#### **Type**: `Tab`

### browser.cookies {#cookies}

Returns an array of cookie objects from the current document.

#### **Type**: `Promise<Cookie[]>`

Alias for [activeTab.cookies](./tab#cookies)

### browser.document <div class="specs"><i>W3C</i></div> {#document}

Returns a reference to the document that the active tab contains.

#### **Type**: `SuperDocument`

Alias for [activeTab.document](./tab#document)

### browser.lastCommandId {#lastCommandId}

An execution point that refers to a command run on this Browser (`waitForElement`, `click`, `type`, etc). Command ids can be passed to select `waitFor*` methods to indicate a starting point to listen for changes.

#### **Type**: `number`

Alias for [activeTab.lastCommandId](./tab#lastCommandId)

### browser.sessionId {#sessionId}

An identifier used for storing logs, snapshots, and other assets associated with the current browser session.

#### **Type**: `Promise<string>`

### browser.sessionName {#sessionName}

A human-readable identifier of the current browser session.

You can set this property when calling [SecretAgent.createBrowser](./secret-agent#create-browser).

#### **Type**: `Promise<string>`

### browser.tabs {#tabs}

Returns all open browser tabs.

#### **Type**: `Promise<Tab[]>`

### browser.url {#url}

The url of the active tab.

#### **Type**: `Promise<string>`

Alias for [Tab.url](./tab#url)

### browser.user {#user}

Returns a reference to the User instance controlling interaction with the browser.

#### **Type**: `User`

### browser.Request <div class="specs"><i>W3C</i></div> {#request-type}

Returns a constructor for a Request object bound to the `activeTab`. Proxies to [tab.Request(tab)](./tab#request-type). These objects can be used to run Browser-native [tab.fetch](./tab#fetch) requests from the context of the Tab document.

#### **Type**: `Request`

Alias for [Tab.Request](./tab#request-tab)

## Methods

### browser.close*()* {#close}

Closes the current browser and any open tabs.

#### **Returns**: `Promise`

### browser.closeTab*(tab)* {#focus-tab}

Close a single Tab. The first opened Tab will become the focused tab.

#### **Arguments**:

- tab `Tab` The Tab to close.

#### **Returns**: `Promise<void>`

Alias for [Tab.close()](./tab#close)

### browser.configure*(\[options])* {#configure}

Update existing configuration settings.

#### **Arguments**:

- options `object` Accepts any of the following:
  - emulatorId `string`. Emulate a specific browser version.
  - humanoidId `string`. Create human-like mouse/keyboard movements.
  - timezoneId `string`. Overrides the host timezone. A list of valid ids are available at [unicode.org](https://unicode-org.github.io/cldr-staging/charts/37/supplemental/zone_tzid.html)
  - locale `string`. Overrides the host languages settings (eg, en-US). Locale will affect navigator.language value, Accept-Language request header value as well as number and date formatting rules.
  - viewport `IViewport`. Sets the browser screen size, window position, inner/outer width and height. If not provided, a random screen, position and viewport will be statistically sampled from data pulled from [statcounter.com](https://gs.statcounter.com/screen-resolution-stats/desktop/united-states-of-america).
  - renderingOptions `string[]`. Controls browser functionality.
  - showReplay `boolean`. Whether or not to show the Replay UI. Can also be set with an env variable: `SA_SHOW_REPLAY=true`.

#### **Returns**: `Promise`

See the [Configuration](../overview/configuration) page for more details on `options` and its defaults. You may also want to explore [Emulators](../advanced/emulators) and [Humanoids](../advanced/humanoids).

### browser.focusTab*(tab)* {#focus-tab}

Bring a tab to the forefront. This will route all `User` methods to the tab provided as an argument.

#### **Arguments**:

- tab `Tab` The Tab which will become the `activeTab`.

#### **Returns**: `Promise<void>`

Alias for [Tab.focus()](./tab#focus)

### browser.fetch*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#fetch}

Perform a native "fetch" request in the current browser context.

#### **Returns**: `Promise<Response>`

Alias for [Tab.fetch()](./tab#fetch)

### browser.getJsValue*(path)* {#get-js-value}

Extract any publicly accessible javascript value from the `activeTab` webpage context.

#### **Arguments**:

- path `string`

#### **Returns**: `Promise<SerializedValue>`

Alias for [Tab.getJsValue()](./tab#get-js-value)

### browser.waitForNewTab*()* {#wait-for-new-tab}

Wait for a new tab to be created. This can occur either via a `window.open` from within the page javascript, or a Link with a target opening in a new tab or window.

#### **Returns**: `Promise<Tab>`

```js
const browser = await SecretAgent.createBrowser();
const url = 'https://dataliberationfoundation.org/nopost';
const { document, activeTab } = browser;

await browser.goto('http://example.com');

// ...
// <a id="newTabLink" href="/newPage" target="_blank">Link to new target</a>
// ...

await document.querySelector('#newTabLink').click();
const newTab = await browser.waitForNewTab();

await newTab.waitForAllContentLoaded();
```

## Aliased Tab Methods

Browser instances have aliases to all top-level Tab methods. They will be routed to the `activeTab`.

### browser.goBack*()*

Alias for [Tab.goBack](./tab#back)

### browser.goForward*()*

Alias for [Tab.goForward](./tab#forward)

### browser.goto*(href)*

Alias for [Tab.goto](./tab#goto

### browser.isElementVisible*(element)*

Alias for [Tab.isElementVisible](./tab#is-element-visible)

### browser.waitForAllContentLoaded*()*

Alias for [Tab.waitForLoad(AllContentLoaded)](./tab#wait-for-load)

### browser.waitForResource*(filter, options)*

Alias for [Tab.waitForResource](./tab#wait-for-resource)

### browser.waitForElement*(element)*

Alias for [Tab.waitForElement](./tab#wait-for-element)

### browser.waitForLocation*(trigger)*

Alias for [Tab.waitForLocation](./tab#wait-for-location)

### browser.waitForMillis*(millis)*

Alias for [Tab.waitForMillis](./tab#wait-for-millis)

### browser.waitForWebSocket*(filename)*

Alias for [Tab.waitForWebSocket](./tab#wait-for-websocket)

## Aliased User Methods

Browser instances have aliases to all top-level User interaction methods:

### browser.click*(mousePosition)*

Alias for [User.click](./user#click)

### browser.interact*(interaction\[, interaction, ...])*

Alias for [User.interact](./user#interact)

### browser.scrollTo*(mousePosition)*

Alias for [User.scrollTo](./user#scroll)

### browser.type*(keyboardInteraction\[, keyboardInteraction, ...])*

Alias for [User.type](./user#type)

## Events

SecretAgent's [EventTarget](./event-target) interface deviates from the official W3C implementation in that it adds several additional method aliases such as `on` and `off`. [Learn more](./event-target).

### 'close' {#close-event}

Called after the browser is closed
