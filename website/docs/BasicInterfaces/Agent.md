# Agent

This is the primary class to interact with SecretAgent. The following is a simple example:

```js
const agent = require('secret-agent');

(async () => {
  await agent.goto('https://www.google.com');
  // other actions...
  await agent.close();
})();
```

An Agent instance can be thought of as a single user-browsing session. An instance has a [replayable](../advanced/session-replay)&nbsp;[Session](../advanced/session) that will record all commands, dom changes, interaction and page events.

A default instance is automatically initialized and available as the default export.

Instances are very lightweight, sharing a pool of browsers underneath. To generate multiple "scrapes" in a single script, you'll want to create a [Handler](./handler).

```js
const { Handler } = require('secret-agent');

(async () => {
  const handler = new Handler();
  handler.dispatchAgent(async agent => {
    await agent.goto('https://www.google.com/search?q=secret-agent');
  });
  handler.dispatchAgent(async agent => {
    await agent.goto('https://www.bing.com/search?q=secret+agent');
  });
  await handler.waitForAllDispatches();
})();
```

Agent instances can have multiple [Tabs](./tab), but only a single tab can be focused at a time. Clicks and other user interaction will go to the active tab (interacting with multiple tabs at once by a single user is easily detectable).

Each Agent instance creates a private environment with its own cache, cookies, session data and [BrowserEmulator](../advanced/browser-emulators). No data is shared between instances -- each operates within an airtight sandbox to ensure no identities leak across requests.

## Constructor

Agents cannot be directly instantiated. You can use the default agent, or create a [Handler](./handler) to create multiple agents.

## Properties

### agent.activeTab {#active-tab}

Returns a reference to the currently active tab.

#### **Type**: [`Tab`](./tab)

### agent.document <div class="specs"><i>W3C</i></div> {#document}

Returns a reference to the document that the active tab contains.

#### **Type**: [`SuperDocument`](../awaited-dom/super-document)

Alias for [activeTab.document](./tab#document)

### agent.lastCommandId {#lastCommandId}

An execution point that refers to a command run on this instance (`waitForElement`, `click`, `type`, etc). Command ids can be passed to select `waitFor*` methods to indicate a starting point to listen for changes.

#### **Type**: `Promise<number>`

Alias for [activeTab.lastCommandId](./tab#lastCommandId)

### agent.sessionId {#sessionId}

An identifier used for storing logs, snapshots, and other assets associated with the current session.

#### **Type**: `Promise<string>`

### agent.sessionName {#sessionName}

A human-readable identifier of the current Agent session.

You can set this property when calling [Handler.dispatchAgent()](./handler#dipatch-agent) or  [Handler.createAgent()](./handler#create-agent).

#### **Type**: `Promise<string>`

### agent.tabs {#tabs}

Returns all open browser tabs.

#### **Type**: [`Promise<Tab[]>`](./tab)

### agent.url {#url}

The url of the active tab.

#### **Type**: `Promise<string>`

Alias for [Tab.url](./tab#url)

### agent.Request <div class="specs"><i>W3C</i></div> {#request-type}

Returns a constructor for a Request object bound to the `activeTab`. Proxies to [tab.Request](./tab#request-type). These objects can be used to run browser-native [tab.fetch](./tab#fetch) requests from the context of the Tab document.

#### **Type**: [`Request`](../awaited-dom/request)

Alias for [Tab.Request](./tab#request-tab)

## Methods

### agent.click*(mousePosition)* {#click}

Executes a click interaction. This is a shortcut for `agent.interact({ click: mousePosition })`. See the [Interactions page](./interactions) for more details.

#### **Arguments**:

- mousePosition [`MousePosition`](./interactions#mouseposition)

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
  - userProfile `IUserProfile`. Previous user's cookies, session, etc.
  - timezoneId `string`. Overrides the host timezone. A list of valid ids are available at [unicode.org](https://unicode-org.github.io/cldr-staging/charts/37/supplemental/zone_tzid.html)
  - locale `string`. Overrides the host languages settings (eg, en-US). Locale will affect navigator.language value, Accept-Language request header value as well as number and date formatting rules.
  - viewport `IViewport`. Sets the emulated screen size, window position in the screen, inner/outer width.
  - renderingOptions `string[]`. Controls enabled browser rendering features.
  - upstreamProxyUrl `string`. A socks5 or http proxy url (and optional auth) to use for all HTTP requests in this session. The optional "auth" should be included in the UserInfo section of the url, eg: `http://username:password@proxy.com:80`.

#### **Returns**: `Promise`

See the [Configuration](../overview/configuration) page for more details on `options` and its defaults. You may also want to explore [BrowserEmulators](../advanced/browser-emulators) and [HumanEmulators](../advanced/human-emulators).

### agent.exportUserProfile*()* {#export-profile}

Returns a json representation of the underlying browser state for saving. This can later be restored into a new instance using `agent.configure({ userProfile: serialized })`. See the [UserProfile page](../advanced/user-profile) for more details.

#### **Returns**: [`Promise<IUserProfile>`](../advanced/user-profile)

### agent.interact*(interaction\[, interaction, ...])* {#interact}

Executes a series of mouse and keyboard interactions.

#### **Arguments**:

- interaction [`Interaction`](./interactions)

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

- keyboardInteraction [`KeyboardInteraction`](./interactions#the-four-keyboard-commands)

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

#### **Returns**: [`Promise<Tab>`](./tab)

```js
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

Agent instances have aliases to all top-level Tab methods. They will be routed to the `activeTab`.

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
