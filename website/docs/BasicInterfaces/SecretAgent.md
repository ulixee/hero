# SecretAgent

This is the primary entry point for launching SecretAgent. The following is a simple example:

```js
const SecretAgent = require('secret-agent');

(async () => {
  const agent = new SecretAgent();
  await agent.goto('https://www.google.com');
  // other actions...
  await agent.close();
})();
```

Unlike most other browsers, SecretAgent is initialized with a single window that can spawn tabs. Only a single tab can be focused at a time, meaning clicks and other user interaction will go to the active tab.

Each SecretAgent instance has its own cache, cookies, session data, and [emulator](../advanced-features/emulators). No data is shared between instances -- each operates within an airtight sandbox to ensure no identities leak across requests.

## Constructor

### new SecretAgent*(options)* {#constructor}

Creates a new sandboxed browser instance with [unique user session and fingerprints](../overview/basic-concepts). Or pass in an existing UserProfile.

You can optionally await an instance (or constructor) to cause the connection to the underlying SecretAgent to be initialized. If you don't await, the connection will be established on the first call.

Note: If you provide a `name` that has already been used to name another instance then a counter will be appended to your string to ensure its uniqueness. However, it's only unique within a single NodeJs process (i.e., rerunning your script will reset the counter).

```js
const SecretAgent = require('secret-agent');

(async () => {
  // connection established here
  const agent = await new SecretAgent();
})();
```

#### **Arguments**:

- options `object` Accepts any of the following:
  - name `string`. This is used to generate a unique sessionName.
  - emulatorId `string` defaults to `chrome-83`. Emulates a specific browser engine version.
  - humanoidId `string`. Drives human-like mouse/keyboard movements.
  - timezoneId `string`. Overrides the host timezone. A list of valid ids are available at [unicode.org](https://unicode-org.github.io/cldr-staging/charts/37/supplemental/zone_tzid.html)
  - locale `string`. Overrides the host languages settings (eg, en-US). Locale will affect navigator.language value, Accept-Language request header value as well as number and date formatting rules.
  - viewport `IViewport`. Sets the emulated screen size, window position in the screen, inner/outer width and height. If not provided, a random screen, position and viewport will be statistically sampled from data pulled from [statcounter.com](https://gs.statcounter.com/screen-resolution-stats/desktop/united-states-of-america).
  - renderingOptions `string[]`. Controls browser functionality.
  - userProfile `IUserProfile`. Previous user's cookies, session, etc.
  - showReplay `boolean`. Whether or not to show the Replay UI. Can also be set with an env variable: `SA_SHOW_REPLAY=true`.

## Properties

### agent.activeTab {#active-tab}

Returns a reference to the currently active tab.

#### **Type**: `Tab`

### agent.cookies {#cookies}

Returns an array of cookies across all open tabs.

#### **Type**: `Promise<Cookie[]>`

### agent.document <div class="specs"><i>W3C</i></div> {#document}

Returns a reference to the document that the active tab contains.

#### **Type**: `SuperDocument`

Alias for [activeTab.document](./tab#document)

### agent.lastCommandId {#lastCommandId}

An execution point that refers to a command run on this instance (`waitForElement`, `click`, `type`, etc). Command ids can be passed to select `waitFor*` methods to indicate a starting point to listen for changes.

#### **Type**: `Promise<number>`

Alias for [activeTab.lastCommandId](./tab#lastCommandId)

### agent.sessionId {#sessionId}

An identifier used for storing logs, snapshots, and other assets associated with the current session.

#### **Type**: `Promise<string>`

### agent.sessionName {#sessionName}

A human-readable identifier of the current SecretAgent session.

You can set this property when calling [new SecretAgent()](./secret-agent#constructor).

#### **Type**: `Promise<string>`

### agent.storage {#storage}

Returns a reference to the [Storage](./storage) instance controlling storage retrieval and manipulation for the agent.

#### **Type**: `Storage`

### agent.tabs {#tabs}

Returns all open browser tabs.

#### **Type**: `Promise<Tab[]>`

### agent.url {#url}

The url of the active tab.

#### **Type**: `Promise<string>`

Alias for [Tab.url](./tab#url)

### agent.Request <div class="specs"><i>W3C</i></div> {#request-type}

Returns a constructor for a Request object bound to the `activeTab`. Proxies to [tab.Request(tab)](./tab#request-type). These objects can be used to run browser-native [tab.fetch](./tab#fetch) requests from the context of the Tab document.

#### **Type**: `Request`

Alias for [Tab.Request](./tab#request-tab)

## Methods

### agent.click*(mousePosition)* {#click}

Executes a click interaction. This is a shortcut for `agent.interact({ click: mousePosition })`. See the [Interactions page](./interactions) for more details.

#### **Arguments**:

- mousePosition `MousePosition`

#### **Returns**: `Promise`

### agent.close*()* {#close}

Closes the current instance and any open tabs.

#### **Returns**: `Promise`

### agent.closeTab*(tab)* {#focus-tab}

Close a single Tab. The first opened Tab will become the focused tab.

#### **Arguments**:

- tab `Tab` The Tab to close.

#### **Returns**: `Promise<void>`

Alias for [Tab.close()](./tab#close)

### agent.configure*(\[options])* {#configure}

Update existing configuration settings.

#### **Arguments**:

- options `object` Accepts any of the following:
  - emulatorId `string`. Emulate a specific browser version.
  - humanoidId `string`. Create human-like mouse/keyboard movements.
  - timezoneId `string`. Overrides the host timezone. A list of valid ids are available at [unicode.org](https://unicode-org.github.io/cldr-staging/charts/37/supplemental/zone_tzid.html)
  - locale `string`. Overrides the host languages settings (eg, en-US). Locale will affect navigator.language value, Accept-Language request header value as well as number and date formatting rules.
  - viewport `IViewport`. Sets the emulated screen size, window position in the screen, inner/outer width.
  - renderingOptions `string[]`. Controls enabled browser rendering features.
  - showReplay `boolean`. Whether or not to show the Replay UI. Can also be set with an env variable: `SA_SHOW_REPLAY=true`.

#### **Returns**: `Promise`

See the [Configuration](../overview/configuration) page for more details on `options` and its defaults. You may also want to explore [Emulators](../advanced/emulators) and [Humanoids](../advanced/humanoids).

### agent.exportUserProfile*()* {#export-profile}

Returns a json representation of the underlying browser state for saving. This can later be restored into a new instance using `new SecretAgent({ userProfile: serialized })`. See the [UserProfile page](../advanced/user-profile) for more details.

#### **Returns**: `Promise<IUserProfile>`

### agent.interact*(interaction\[, interaction, ...])* {#interact}

Executes a series of mouse and keyboard interactions.

#### **Arguments**:

- interaction `Interaction`

#### **Returns**: `Promise`

Refer to the [Interactions page](./interactions) for details on how to construct an interaction.

### agent.scrollTo*(mousePosition)* {#click}

Executes a scroll interaction. This is a shortcut for `agent.interact({ scroll: mousePosition })`. See the [Interactions page](./interactions) for more details.

#### **Arguments**:

- mousePosition `MousePosition`

#### **Returns**: `Promise`

### agent.type*(keyboardInteraction\[, keyboardInteraction, ...])* {#type}

Executes a keyboard interactions. This is a shortcut for `agent.interact({ type: string | KeyName[] })`.

#### **Arguments**:

- keyboardInteraction `KeyboardInteraction`

#### **Returns**: `Promise`

Refer to the [Interactions page](./interactions) for details on how to construct keyboard interactions.

### agent.focusTab*(tab)* {#focus-tab}

Bring a tab to the forefront. This will route all interaction (`click`, `type`, etc) methods to the tab provided as an argument.

#### **Arguments**:

- tab `Tab` The Tab which will become the `activeTab`.

#### **Returns**: `Promise<void>`

Alias for [Tab.focus()](./tab#focus)

### agent.waitForNewTab*()* {#wait-for-new-tab}

Wait for a new tab to be created. This can occur either via a `window.open` from within the page javascript, or a Link with a target opening in a new tab or window.

#### **Returns**: `Promise<Tab>`

```js
const agent = await new SecretAgent();
const url = 'https://dataliberationfoundation.org/nopost';
const { document, activeTab } = agent;

await agent.goto('http://example.com');

// ...
// <a id="newTabLink" href="/newPage" target="_blank">Link to new target</a>
// ...

await document.querySelector('#newTabLink').click();
const newTab = await agent.waitForNewTab();

await newTab.waitForAllContentLoaded();
```

## Aliased Tab Methods

SecretAgent instances have aliases to all top-level Tab methods. They will be routed to the `activeTab`.

### agent.fetch*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#fetch}

Perform a native "fetch" request in the `activeTab` context.

#### **Returns**: `Promise<Response>`

Alias for [Tab.fetch()](./tab#fetch)

### agent.getJsValue*(path)* {#get-js-value}

Extract any publicly accessible javascript value from the `activeTab` webpage context.

#### **Arguments**:

- path `string`

#### **Returns**: `Promise<SerializedValue>`

Alias for [Tab.getJsValue()](./tab#get-js-value)

### agent.goBack*()*

Alias for [Tab.goBack](./tab#back)

### agent.goForward*()*

Alias for [Tab.goForward](./tab#forward)

### agent.goto*(href)* {#goto}

Alias for [Tab.goto](./tab#goto)

### agent.isElementVisible*(element)*

Alias for [Tab.isElementVisible](./tab#is-element-visible)

### agent.waitForAllContentLoaded*()*

Alias for [Tab.waitForLoad(AllContentLoaded)](./tab#wait-for-load)

### agent.waitForResource*(filter, options)*

Alias for [Tab.waitForResource](./tab#wait-for-resource)

### agent.waitForElement*(element)*

Alias for [Tab.waitForElement](./tab#wait-for-element)

### agent.waitForLocation*(trigger)*

Alias for [Tab.waitForLocation](./tab#wait-for-location)

### agent.waitForMillis*(millis)*

Alias for [Tab.waitForMillis](./tab#wait-for-millis)

### agent.waitForWebSocket*(filename)*

Alias for [Tab.waitForWebSocket](./tab#wait-for-websocket)

## Events

SecretAgent's [EventTarget](./event-target) interface deviates from the official W3C implementation in that it adds several additional method aliases such as `on` and `off`. [Learn more](./event-target).

### 'close' {#close-event}

Called after the instance is closed.

## Class Methods

### SecretAgent.configure*(options)* {#configure}

Update existing settings.

#### **Arguments**:

- options `object` Accepts any of the following:
  - maxConcurrentSessionsCount `number` defaults to `10`. Limit concurrent SecretAgent sessions running at any given time.
  - localProxyPortStart `number` defaults to `10000`. Starting proxy port.
  - sessionsDir `string` defaults to `os.tmpdir()`. Where session files are stored.
  - defaultRenderingOptions `string[]` defaults to `[All]`. Controls enabled browser rendering features.
  - defaultUserProfile `IUserProfile`. Define user cookies, session, and more.
  - replayServerPort `number`. Port to start a live replay server on. Defaults to "any open port".

#### **Returns**: `Promise`

See the [Configuration](../overview/configuration) page for more details on `options` and its defaults.

Note: Changing any of these configurations options after `new SecretAgent()` has been called will not affect any instance already created. It only affects future instances.

### SecretAgent.shutdown*()* {#shutdown}

Close SecretAgent and any SecretAgent instances that have been opened.

#### **Returns**: `Promise`

After shutdown, the SecretAgent object is considered to be disposed and cannot be used again unless you call SecretAgent.prewarm() to reinitialize.

Note: Because Chromium is launched when you call `prewarm/new SecretAgent()`, your NodeJS script cannot exit cleanly until `shutdown()` completes.

### SecretAgent.prewarm*(\[options])* {#prewarm}

Initializes the library and launches any underlying Chromium engines based on which [Emulators](./emulator) are installed.

#### **Arguments**:

- options `object`. Accepts any of the options in [SecretAgent.configure]().

#### **Returns**: `Promise`

Starting SecretAgent can take between 5 and 15 seconds. It must launch the Chromium engine, set up man-in-the-middle proxies, and prime the Emulators and Humanoids.

Note: You are not required to call this method as a new instance will do so the first time it runs. Directly calling `prewarm` merely speeds up the response time of your first call to `new SecretAgent()`.
