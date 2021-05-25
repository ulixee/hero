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

An Agent instance can be thought of as a single user-browsing session. A default instance is automatically initialized and available as the default export of `secret-agent`. Each additional instance you create has the following attributes:

#### Replayable

An instance has a [replayable](/docs/advanced/session-replay)&nbsp;[Session](/docs/advanced/session) that will record all commands, dom changes, interaction and page events.

#### Lightweight

Instances are very lightweight, sharing a pool of browsers underneath. To manage concurrent scrapes in a single script, you can create one Agent for each scrape, or manage load and concurrency with a [Handler](/docs/basic-interfaces/handler).

#### Single Active Tab

Agent instances can have multiple [Tabs](/docs/basic-interfaces/tab), but only a single tab can be focused at a time. Clicks and other user interaction will go to the active tab (interacting with multiple tabs at once by a single user is easily detectable).

#### Sandboxed

Each Agent instance creates a private environment with its own cache, cookies, session data and [BrowserEmulator](/docs/advanced/browser-emulators). No data is shared between instances -- each operates within an airtight sandbox to ensure no identities leak across requests.

## Constructor

### new Agent*(options)* {#constructor}

Creates a new sandboxed browser instance with [unique user session and fingerprints](/docs/overview/basic-concepts). Or pass in an existing UserProfile to reconstruct a previously used user session.

You can optionally await an instance (or constructor) to cause the connection to the underlying SecretAgent to be initialized. If you don't await, the connection will be established on the first call.

Note: If you provide a `name` that has already been used to name another instance then a counter will be appended to your string to ensure its uniqueness. However, it's only unique within a single NodeJs process (i.e., rerunning your script will reset the counter).

```js
const { Agent } = require('secret-agent');

(async () => {
  // connection established here
  const agent = await new Agent();
})();
```

#### **Arguments**:

- options `object` Accepts any of the following:
  - connectionToCore `options | ConnectionToCore`. An object containing `IConnectionToCoreOptions` used to connect, or an already created `ConnectionToCore` instance. Defaults to automatically booting up and connecting to a local `Core`.
  - name `string`. This is used to generate a unique sessionName.
  - browserEmulatorId `string` defaults to `chrome-latest`. Emulates a specific browser engine version.
  - humanEmulatorId `string`. Drives human-like mouse/keyboard movements.
  - timezoneId `string`. Overrides the host timezone. A list of valid ids are available at [unicode.org](https://unicode-org.github.io/cldr-staging/charts/37/supplemental/zone_tzid.html)
  - locale `string`. Overrides the host languages settings (eg, en-US). Locale will affect navigator.language value, Accept-Language request header value as well as number and date formatting rules.
  - viewport `IViewport`. Sets the emulated screen size, window position in the screen, inner/outer width and height. If not provided, the most popular resolution is used from [statcounter.com](https://gs.statcounter.com/screen-resolution-stats/desktop/united-states-of-america).
  - blockedResourceTypes `BlockedResourceType[]`. Controls browser resource loading. Valid options are listed [here](/docs/overview/configuration#blocked-resources).
  - userProfile `IUserProfile`. Previous user's cookies, session, etc.
  - showReplay `boolean`. Whether or not to show the Replay UI. Can also be set with an env variable: `SA_SHOW_REPLAY=true`.
  - upstreamProxyUrl `string`. A socks5 or http proxy url (and optional auth) to use for all HTTP requests in this session. Dns over Tls requests will also use this proxy, if provided. The optional "auth" should be included in the UserInfo section of the url, eg: `http://username:password@proxy.com:80`.

## Properties

### agent.activeTab {#active-tab}

Returns a reference to the currently active tab.

#### **Type**: [`Tab`](/docs/basic-interfaces/tab)

### agent.coreHost {#core-host}

The connectionToCore host address to which this Agent has connected. This is useful in scenarios where a Handler is round-robining connections between multiple hosts.

#### **Type**: `Promise<string>`

### agent.document <div class="specs"><i>W3C</i></div> {#document}

Returns a reference to the main Document for the active tab.

#### **Type**: [`SuperDocument`](/docs/awaited-dom/super-document)

Alias for [activeTab.document](/docs/basic-interfaces/tab#document)

### agent.mainFrameEnvironment {#main-frame-environment}

Returns a reference to the document of the [mainFrameEnvironment](#main-frame-environment) of the active tab.

Alias for [tab.mainFrameEnvironment.document](/docs/basic-interfaces/frame-environment#document).

#### **Type**: [`SuperDocument`](/docs/awaited-dom/super-document)

### agent.frameEnvironments {#frame-environments}

Returns a list of [FrameEnvironments](/docs/basic-interfaces/frame-environment) loaded for the active tab.

#### **Type**: [`Promise<Frame[]>`](/docs/basic-interfaces/frame-environment).

### agent.lastCommandId {#lastCommandId}

An execution point that refers to a command run on this instance (`waitForElement`, `click`, `type`, etc). Command ids can be passed to select `waitFor*` methods to indicate a starting point to listen for changes.

#### **Type**: `Promise<number>`

Alias for [activeTab.lastCommandId](/docs/basic-interfaces/tab#lastCommandId)

### agent.meta {#meta}

Retrieves metadata about the agent configuration:

- sessionId `string`. The session identifier.
- sessionName `string`. The unique session name that will be visible in Replay.
- browserEmulatorId `string`. The id of the [Browser Emulator](/docs/advanced/browser-emulators) in use.
- humanEmulatorId `string`. The id of the [Human Emulator](/docs/advanced/human-emulators) in use.
- timezoneId `string`. The configured unicode TimezoneId or host default (eg, America/New_York).
- locale `string`. The configured locale in use (eg, en-US).
- viewport `IViewport`. The emulated viewport size and location.
- blockedResourceTypes `BlockedResourceType[]`. The blocked resource types.
- upstreamProxyUrl `string`. The proxy url in use for this agent.
- userAgentString `string`. The user agent string used in Http requests and within the DOM.

#### **Type**: `Promise<IAgentMeta>`

### agent.sessionId {#sessionId}

An identifier used for storing logs, snapshots, and other assets associated with the current session.

#### **Type**: `Promise<string>`

### agent.sessionName {#sessionName}

A human-readable identifier of the current Agent session.

You can set this property when calling [Handler.dispatchAgent()](/docs/basic-interfaces/handler#dipatch-agent) or [Handler.createAgent()](/docs/basic-interfaces/handler#create-agent).

#### **Type**: `Promise<string>`

### agent.tabs {#tabs}

Returns all open browser tabs.

#### **Type**: [`Promise<Tab[]>`](/docs/basic-interfaces/tab)

### agent.url {#url}

The url of the active tab.

#### **Type**: `Promise<string>`

Alias for [Tab.url](/docs/basic-interfaces/tab#url)

### agent.Request <div class="specs"><i>W3C</i></div> {#request-type}

Returns a constructor for a Request object bound to the `activeTab`. Proxies to [tab.Request](/docs/basic-interfaces/tab#request-type). These objects can be used to run browser-native [tab.fetch](/docs/basic-interfaces/tab#fetch) requests from the context of the Tab document.

#### **Type**: [`Request`](/docs/awaited-dom/request)

Alias for [Tab.Request](/docs/basic-interfaces/tab#request-tab)

## Methods

### agent.click*(mousePosition)* {#click}

Executes a click interaction. This is a shortcut for `agent.interact({ click: mousePosition })`. See the [Interactions page](/docs/basic-interfaces/interactions) for more details.

#### **Arguments**:

- mousePosition [`MousePosition`](/docs/basic-interfaces/interactions#mouseposition)

#### **Returns**: `Promise`

### agent.close*()* {#close}

Closes the current instance and any open tabs.

#### **Returns**: `Promise`

### agent.closeTab*(tab)* {#close-tab}

Close a single Tab. The first opened Tab will become the focused tab.

#### **Arguments**:

- tab `Tab` The Tab to close.

#### **Returns**: `Promise<void>`

Alias for [Tab.close()](/docs/basic-interfaces/tab#close)

### agent.configure*(options)* {#configure}

Update existing configuration settings.

#### **Arguments**:

- options `object` Accepts any of the following:
  - userProfile `IUserProfile`. Previous user's cookies, session, etc.
  - timezoneId `string`. Overrides the host timezone. A list of valid ids are available at [unicode.org](https://unicode-org.github.io/cldr-staging/charts/37/supplemental/zone_tzid.html)
  - locale `string`. Overrides the host languages settings (eg, en-US). Locale will affect navigator.language value, Accept-Language request header value as well as number and date formatting rules.
  - viewport `IViewport`. Sets the emulated screen size, window position in the screen, inner/outer width.
  - blockedResourceTypes `BlockedResourceType[]`. Controls browser resource loading. Valid options are listed [here](/docs/overview/configuration#blocked-resources).
  - upstreamProxyUrl `string`. A socks5 or http proxy url (and optional auth) to use for all HTTP requests in this session. The optional "auth" should be included in the UserInfo section of the url, eg: `http://username:password@proxy.com:80`.
  - connectionToCore `options | ConnectionToCore`. An object containing `IConnectionToCoreOptions` used to connect, or an already created `ConnectionToCore` instance. Defaults to booting up and connecting to a local `Core`.

#### **Returns**: `Promise`

See the [Configuration](/docs/overview/configuration) page for more details on `options` and its defaults. You may also want to explore [BrowserEmulators](/docs/advanced/browser-emulators) and [HumanEmulators](/docs/advanced/human-emulators).

### agent.detach*(tab\[, key])* {#detach-tab}

Detach the given tab into a "Frozen" state. The `FrozenTab` contains a replica of the DOM and layout at the moment of detachment, and supports all the readonly activities of a normal Tab (eg, querySelectors, getComputedVisibility, getComputedStyle).

`FrozenTabs` have a unique attribute in that any queries you run against them will be "learned" on an initial run, and pre-fetched on subsequent runs. This means you can very quickly iterate through all the data you want on a page after you've loaded it into your desired state.

NOTE: you can detach the same `Tab` multiple times per script. Each instance will contain DOM frozen at the time it was detached.

#### **Arguments**:

- tab `Tab`. An existing tab loaded to the point you wish to `freeze`
- key `string`. Optional extra identifier to differentiate between runs in a loop. This can be useful if you are looping through a list of links and detaching each Tab but have specific extraction logic for each link. NOTE: if your looping logic is the same, changing this key will decrease performance.

#### **Returns**: `FrozenTab`

```js
  await agent.goto('https://chromium.googlesource.com/chromium/src/+refs');
  await agent.activeTab.waitForLoad(LocationStatus.DomContentLoaded);

  const frozenTab = await agent.detach(agent.activeTab);
  const { document } = frozenTab;

  const versions = [];
  // 1.  First run will run as normal. 
  // 2+. Next runs will pre-fetch everything run against the frozenTab
  // NOTE: Every time your script changes, SecretAgent will re-learn what to pre-fetch.
  const wrapperElements = await document.querySelectorAll('.RefList');
  for (const elem of wrapperElements) {
    const innerText = await elem.querySelector('.RefList-title').innerText;
    if (innerText === 'Tags') {
      const aElems = await elem.querySelectorAll('ul.RefList-items li a');

      for (const aElem of aElems) {
        const version = await aElem.innerText;
        versions.push(version);
      }
    }
  }
  await agent.close();
```

### agent.exportUserProfile*()* {#export-profile}

Returns a json representation of the underlying browser state for saving. This can later be restored into a new instance using `agent.configure({ userProfile: serialized })`. See the [UserProfile page](/docs/advanced/user-profile) for more details.

#### **Returns**: [`Promise<IUserProfile>`](/docs/advanced/user-profile)

### agent.interact*(interaction\[, interaction, ...])* {#interact}

Executes a series of mouse and keyboard interactions.

#### **Arguments**:

- interaction [`Interaction`](/docs/basic-interfaces/interactions)

#### **Returns**: `Promise`

Refer to the [Interactions page](/docs/basic-interfaces/interactions) for details on how to construct an interaction.

### agent.scrollTo*(mousePosition)* {#scroll-to}

Executes a scroll interaction. This is a shortcut for `agent.interact({ scroll: mousePosition })`. See the [Interactions page](/docs/basic-interfaces/interactions) for more details.

#### **Arguments**:

- mousePosition `MousePosition`

#### **Returns**: `Promise`

### agent.type*(keyboardInteraction\[, keyboardInteraction, ...])* {#type}

Executes a keyboard interactions. This is a shortcut for `agent.interact({ type: string | KeyName[] })`.

#### **Arguments**:

- keyboardInteraction [`KeyboardInteraction`](/docs/basic-interfaces/interactions#the-four-keyboard-commands)

#### **Returns**: `Promise`

Refer to the [Interactions page](/docs/basic-interfaces/interactions) for details on how to construct keyboard interactions.

### agent.focusTab*(tab)* {#focus-tab}

Bring a tab to the forefront. This will route all interaction (`click`, `type`, etc) methods to the tab provided as an argument.

#### **Arguments**:

- tab `Tab` The Tab which will become the `activeTab`.

#### **Returns**: `Promise<void>`

Alias for [Tab.focus()](/docs/basic-interfaces/tab#focus)

### agent.waitForNewTab*()* {#wait-for-new-tab}

Wait for a new tab to be created. This can occur either via a `window.open` from within the page javascript, or a Link with a target opening in a new tab or window.

#### **Returns**: [`Promise<Tab>`](/docs/basic-interfaces/tab)

```js
const url = 'https://dataliberationfoundation.org/nopost';
const { document, activeTab } = agent;

await agent.goto('http://example.com');

// ...
// <a id="newTabLink" href="/newPage" target="_blank">Link to new target</a>
// ...

await document.querySelector('#newTabLink').click();
const newTab = await agent.waitForNewTab();

await newTab.waitForPaintingStable();
```

## Aliased Tab Methods

Agent instances have aliases to all top-level Tab methods. They will be routed to the `activeTab`.

### agent.fetch*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#fetch}

Alias for [Tab.fetch()](/docs/basic-interfaces/tab#fetch)

### agent.getFrameEnvironment*(frameElement)* {#get-frame-environment}

Alias for [Tab.getFrameEnvironment()](/docs/basic-interfaces/tab#get-frame-environment)

### agent.getComputedStyle*(element, pseudoElement)* <div class="specs"><i>W3C</i></div> {#get-computed-style}

Alias for [Tab.getComputedStyle()](/docs/basic-interfaces/tab#get-computed-style)

### agent.getJsValue*(path)* {#get-js-value}

Alias for [Tab.getJsValue()](/docs/basic-interfaces/tab#get-js-value)

### agent.goBack*(timeoutMs?)*

Alias for [Tab.goBack](/docs/basic-interfaces/tab#back)

### agent.goForward*(timeoutMs?)*

Alias for [Tab.goForward](/docs/basic-interfaces/tab#forward)

### agent.goto*(href, timeoutMs?)* {#goto}

Alias for [Tab.goto](/docs/basic-interfaces/tab#goto)

### agent.getComputedVisibility*(element)* {#get-computed-visibility}

Alias for [Tab.getComputedVisibility](/docs/basic-interfaces/tab#get-computed-visibility)

### agent.reload*(timeoutMs?)* {#reload}

Alias for [Tab.reload](/docs/basic-interfaces/tab#reload)

### agent.takeScreenshot*(options?)* {#take-screenshot}

Alias for [Tab.takeScreenshot](/docs/basic-interfaces/tab#take-screenshot)

### agent.waitForFileChooser*(options)* {#wait-for-file-chooser}

Alias for [Tab.waitForFileChooser()](/docs/basic-interfaces/tab#wait-for-file-chooser)

### agent.waitForElement*(element, options)* {#wait-for-element}

Alias for [Tab.waitForElement](/docs/basic-interfaces/tab#wait-for-element)

### agent.waitForLocation*(trigger, options)* {#wait-for-location}

Alias for [Tab.waitForLocation](/docs/basic-interfaces/tab#wait-for-location)

### agent.waitForMillis*(millis)* {#wait-for-millis}

Alias for [Tab.waitForMillis](/docs/basic-interfaces/tab#wait-for-millis)

### agent.waitForPaintingStable*()* {#wait-for-painting-stable}

Alias for [Tab.waitForLoad(PaintingStable)](/docs/basic-interfaces/tab#wait-for-load)

### agent.waitForResource*(filter, options)* {#wait-for-resource}

Alias for [Tab.waitForResource](/docs/basic-interfaces/tab#wait-for-resource)
