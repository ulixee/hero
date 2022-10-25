# Hero

This is the primary class to interact with Hero. The following is a simple example:

```js
const Hero = require('@ulixee/hero-playground');

(async () => {
  const hero = new Hero();
  await hero.goto('https://www.google.com');
  // other actions...
  await hero.close();
})();
```

An Hero instance can be thought of as a single user-browsing session. Each instance you create has the following attributes:

#### Replayable

An instance has a [replayable](/docs/hero/advanced-client/session-replay)&nbsp;[Session](/docs/hero/advanced-concepts/sessions) that will record all commands, dom changes, interaction and page events.

#### Lightweight

Instances are very lightweight, sharing a pool of browsers underneath. To manage concurrent scrapes in a single script, you can create one Hero for each scrape.

#### Single Active Tab

Hero instances can have multiple [Tabs](/docs/hero/basic-client/tab), but only a single tab can be focused at a time. Clicks and other user interaction will go to the active tab (interacting with multiple tabs at once by a single user is easily detectable).

#### Sandboxed

Each Hero instance creates a private environment with its own cache, cookies, session data and [BrowserEmulator](/docs/hero/plugins/browser-emulators). No data is shared between instances -- each operates within an airtight sandbox to ensure no identities leak across requests.

## Constructor {#constructor}

Creates a new sandboxed browser instance with [unique user session and fingerprints](/docs/overview/basic-concepts). Or pass in an existing UserProfile to reconstruct a previously used user session.

You can optionally await an instance (or constructor) to cause the connection to the underlying Hero to be initialized. If you don't await, the connection will be established on the first call.

Note: If you provide a `name` that has already been used to name another instance then a counter will be appended to your string to ensure its uniqueness. However, it's only unique within a single NodeJs process (i.e., rerunning your script will reset the counter).

```js
const Hero = require('@ulixee/hero-playground');

(async () => {
  // connection established here
  const hero = await new Hero({
    userAgent: '~ mac 13.1 & chrome > 14',
  });
})();
```

#### **Arguments**:

- options `object` Accepts any of the following:
  - connectionToCore `options | ConnectionToCore`. An object containing `IConnectionToCoreOptions` used to connect, or an already created `ConnectionToCore` instance. Defaults to automatically booting up and connecting to a local `Core`.
  - name `string`. This is used to generate a unique sessionName.
  - userAgent `strong`. This sets your browser's user agent string. Prefixing this string with a tilde (~) allows for dynamic options.
  - browserEmulatorId `string` defaults to `default-browser-emulator`. Chooses the BrowserEmulator plugin which emulates the properties that help Hero look like a normal browser.
  - humanEmulatorId `string` defaults to `default-human-emulator`. Chooses the HumanEmulator plugin which drives the mouse/keyboard movements.
  - mode `string`. A mode of operation. This variable controls logging levels and whether Hero "tooling" should be activated. Defaults to environment variable `NODE_ENV`.
  - dnsOverTlsProvider `object`. Configure the host and port to use for DNS over TLS. This feature replicates the Chrome feature that is used if the host DNS provider supports DNS over TLS or DNS over HTTPS. A `null` value will disable this feature.
    - host `string`. The DNS provider host address. Google=8.8.8.8, Cloudflare=1.1.1.1, Quad9=9.9.9.9.
    - servername `string`. The DNS provider tls servername. Google=dns.google, Cloudflare=cloudflare-dns.com, Quad9=dns.quad9.net.
  - geolocation `IGeolocation`. Overrides the geolocation of the user. Will automatically grant permissions to all origins for geolocation.
    - latitude `number`. Latitude between -90 and 90.
    - longitude `number`. Longitude between -180 and 180.
    - accuracy `number`. Non-negative accuracy value. Defaults to random number 40-50.
  - timezoneId `string`. Overrides the host timezone. A list of valid ids are available at [unicode.org](https://unicode-org.github.io/cldr-staging/charts/37/supplemental/zone_tzid.html)
  - locale `string`. Overrides the host languages settings (eg, en-US). Locale will affect navigator.language value, Accept-Language request header value as well as number and date formatting rules.
  - viewport `IViewport`. Sets the emulated screen size, window position in the screen, inner/outer width and height. If not provided, the most popular resolution is used from [statcounter.com](https://gs.statcounter.com/screen-resolution-stats/desktop/united-states-of-america).
    - width `number`. The page width in pixels (minimum 0, maximum 10000000).
    - height `number`. The page height in pixels (minimum 0, maximum 10000000).
    - deviceScaleFactor `number` defaults to 1. Specify device scale factor (can be thought of as dpr).
    - screenWidth? `number`. The optional screen width in pixels (minimum 0, maximum 10000000).
    - screenHeight? `number`. The optional screen height in pixels (minimum 0, maximum 10000000).
    - positionX? `number`. Optional override browser X position on screen in pixels (minimum 0, maximum 10000000).
    - positionY? `number`. Optional override browser Y position on screen in pixels (minimum 0, maximum 10000000).
  - blockedResourceTypes `BlockedResourceType[]`. Controls browser resource loading. Valid options are listed [here](/docs/overview/configuration#blocked-resources).
  - userProfile `IUserProfile`. Previous user's cookies, session, etc.
  - showChrome `boolean`. A boolean whether to show the Chrome browser window. Can also be set with an env variable: `ULX_SHOW_CHROME=true`. Default `false`.
  - showChromeInteractions `boolean`. A boolean whether to inject user interactions to mimic headless mouse/keyboard activity. Default `false`.
  - showChromeAlive `boolean`. A boolean whether to show the ChromeAlive! toolbar (if installed in devDependencies, or using Ulixee.app). Default `false`.
  - upstreamProxyUrl `string`. A socks5 or http proxy url (and optional auth) to use for all HTTP requests in this session. The optional "auth" should be included in the UserInfo section of the url, eg: `http://username:password@proxy.com:80`.
  - upstreamProxyIpMask `object`. Optional settings to mask the Public IP Address of a host machine when using a proxy. This is used by the default BrowserEmulator to mask WebRTC IPs.
    - ipLookupService `string`. The URL of an http based IpLookupService. A list of common options can be found in the [Unblocked Plugin](https://github.com/unblocked-web/unblocked/blob/46e1894b5089660d62ac71c18d601e7c47795447/plugins/default-browser-emulator/lib/helpers/lookupPublicIp.ts#L81). Defaults to `ipify.org`.
    - proxyIp `string`. The optional IP address of your proxy, if known ahead of time.
    - publicIp `string`. The optional IP address of your host machine, if known ahead of time.

## Properties

### hero.activeTab {#active-tab}

Returns a reference to the currently active tab.

#### **Type**: [`Tab`](/docs/hero/basic-client/tab)

### hero.coreHost {#core-host}

The connectionToCore host address to which this Hero has connected. This is useful in scenarios where Hero instances are round-robining between multiple hosts.

#### **Type**: `Promise<string>`

### hero.detachedElements

DetachedElements object providing access to all elements that have been detached and tagged with a name.

#### **Returns** [`DetachedElements`](/docs/hero/advanced-client/detached-elements)

### hero.detachedResources

DetachedResources object providing access to all resources that have been detached and tagged with a name.

#### **Returns** [`DetachedResources`](/docs/hero/advanced-client/detached-resources)

### hero.document <div class="specs"><i>W3C</i></div> {#document}

Returns a reference to the main Document for the active tab.

#### **Type**: [`SuperDocument`](/docs/awaited-dom/super-document)

Alias for [activeTab.document](/docs/hero/basic-client/tab#document)

### hero.frameEnvironments {#frame-environments}

Returns a list of [FrameEnvironments](/docs/hero/advanced-client/frame-environment) loaded for the active tab.

#### **Type**: [`Promise<FrameEnvironment[]>`](/docs/hero/advanced-client/frame-environment).

### hero.isAllContentLoaded {#is-all-content-loaded}

`True` if the "load" event has triggered on the active tab.

NOTE: this event does not fire in some circumstances (such as a long-loading asset). You frequently just want to know if the page has loaded for a user (see [isPaintingStable](#is-painting-stable)).

Wait for this event to trigger with [Tab.waitForLoad(AllContentLoaded)](/docs/hero/basic-client/tab#wait-for-load).

#### **Type**: `Promise<boolean>`

Alias for [Tab.isAllContentLoaded](/docs/hero/basic-client/tab#is-all-content-loaded)

### hero.isDomContentLoaded {#is-dom-content-loaded}

`True` if the "DOMContentLoaded" event has triggered on the active tab.

Wait for this event to trigger with [Tab.waitForLoad(DomContentLoaded)](/docs/hero/basic-client/tab#wait-for-load)

#### **Type**: `Promise<boolean>`

Alias for [Tab.isDomContentLoaded](/docs/hero/basic-client/tab#is-dom-content-loaded)

### hero.isPaintingStable {#is-painting-stable}

`True` if the page has loaded the main content above the fold. Works on javascript-rendered pages.

Wait for this event to trigger with [Hero.waitForPaintingStable()](#wait-for-painting-stable)

#### **Type**: `Promise<boolean>`

Alias for [Tab.isPaintingStable](/docs/hero/basic-client/tab#is-painting-stable)

### hero.lastCommandId {#lastCommandId}

An execution point that refers to a command run on this instance (`waitForElement`, `click`, `type`, etc). Command ids can be passed to select `waitFor*` methods to indicate a starting point to listen for changes.

#### **Type**: `Promise<number>`

Alias for [activeTab.lastCommandId](/docs/hero/basic-client/tab#lastCommandId)

### hero.mainFrameEnvironment {#main-frame-environment}

Returns a reference to the document of the [mainFrameEnvironment](#main-frame-environment) of the active tab.

Alias for [tab.mainFrameEnvironment.document](/docs/hero/advanced-client/frame-environment#document).

#### **Type**: [`SuperDocument`](/docs/awaited-dom/super-document)

### hero.meta {#meta}

Retrieves metadata about the hero configuration:

- sessionId `string`. The session identifier.
- sessionName `string`. The unique session name that will be visible in Replay.
- timezoneId `string`. The configured unicode TimezoneId or host default (eg, America/New_York).
- locale `string`. The configured locale in use (eg, en-US).
- geolocation `IGeolocation`. The configured geolocation of the user (if set).
- viewport `IViewport`. The emulated viewport size and location.
- blockedResourceTypes `BlockedResourceType[]`. The blocked resource types.
- upstreamProxyUrl `string`. The proxy url in use for this hero.
- upstreamProxyIpMask `object`. The proxy IP mask settings for this hero.
  - ipLookupService `string`. Lookup service used to find public IP.
  - proxyIp `string`. The public IP address of the proxy.
  - publicIp `string`. The public IP address of the host machine.
- userAgentString `string`. The user agent string used in Http requests and within the DOM.
- browserName `string`. The emulated browser (eg, chrome)
- browserFullVersion `string`. The emulated full version of Chrome (eg, 98.0.4758.102)
- operatingSystemName `string`. The emulated operating system (eg, windows)
- operatingSystemPlatform `string`. The emulated operating platform (eg, Win32, MacIntel)
- operatingSystemVersion `string`. The emulated operating system version (eg, 11.0.1)
- renderingEngine `string`. The actual browser being used (eg, chrome)
- renderingEngineVersion `string`. The actual full version of Chrome (eg, 98.0.4758.102)

#### **Type**: `Promise<IHeroMeta>`

### hero.sessionId {#sessionId}

An identifier used for storing logs, snapshots, and other assets associated with the current session.

#### **Type**: `Promise<string>`

### hero.sessionName {#sessionName}

A human-readable identifier of the current Hero session.

#### **Type**: `Promise<string>`

### hero.tabs {#tabs}

Returns all open browser tabs.

#### **Type**: [`Promise<Tab[]>`](/docs/hero/basic-client/tab)

### hero.url {#url}

The url of the active tab.

#### **Type**: `Promise<string>`

Alias for [Tab.url](/docs/hero/basic-client/tab#url)

### hero.Request <div class="specs"><i>W3C</i></div> {#request-type}

Returns a constructor for a Request object bound to the `activeTab`. Proxies to [tab.Request](/docs/hero/basic-client/tab#request-type). These objects can be used to run browser-native [tab.fetch](/docs/hero/basic-client/tab#fetch) requests from the context of the Tab document.

#### **Type**: [`Request`](/docs/awaited-dom/request)

Alias for [Tab.Request](/docs/hero/basic-client/tab#request-tab)

## Methods


### hero.addToDetached *(name, elementOrResource)* {#addToDetached}

Converts an element or resource to a DetachedElement or DetachedResource and adds it to [hero.detachedElements](/docs/hero/basic-client/hero#detachedElements) or [hero.detachedResources](/docs/hero/basic-client/hero#detachedElements).

```js
const hero = new Hero();
await hero.goto('https://ulixee.org');
await hero.addToDetached('title', hero.querySelector('h1'));
const h1 = await hero.detachedElements.get('title');
```

To retrieve at a later time with [HeroReplay](/docs/hero/basic-client/hero-replay):

```js
const replay = new HeroReplay({ /* previousSessionId */});
const h1 = await replay.detachedElements.get('title');
```

#### **Arguments**:

- elementOrResource `AwaitedDOM`. This can be any AwaitedDOM element, collection of elements, or resource(s).
- options `object`. Optional settings to apply to this extraction
  - name `string`. A name to use in retrieving from [DetachedElements](/docs/hero/basic-client/hero#detached-elements). It does not need to be unique - items with the same name will be added to a list.

#### **Returns**: `Promise<DetachedElement>`


### hero.click *(mousePosition, verification?)* {#click}

Executes a click interaction. This is a shortcut for `hero.interact({ click: mousePosition })`. See the [Interactions page](/docs/hero/basic-client/interactions) for more details.

#### **Arguments**:

- mousePosition [`MousePosition`](/docs/hero/basic-client/interactions#mouseposition)
- verification [`ClickVerficiation`](/docs/hero/basic-client/interactions#clickverification)

#### **Returns**: `Promise`

### hero.close *()* {#close}

Closes the current instance and any open tabs.

#### **Returns**: `Promise`

### hero.closeTab *(tab)* {#close-tab}

Close a single Tab. The first opened Tab will become the focused tab.

#### **Arguments**:

- tab `Tab` The Tab to close.

#### **Returns**: `Promise<void>`

Alias for [Tab.close()](/docs/hero/basic-client/tab#close)


### hero.detach *(elementOrResource)* {#detach}

Returns an element or resource as a [DetachedElement](/docs/hero/basic-client/detached-element) or [DetachedResource](/docs/hero/basic-client/detached-resource) object. This allows you to access the elements properties and methods without using `await`.

```js
const hero = new Hero();
await hero.goto('https://ulixee.org');
const h1Elem = await hero.detach(hero.querySelector('h1'));
console.log('title: ', h1Elem.getAttribute.get('title');
```

#### **Arguments**:

- elementOrResource `AwaitedDOM`. This can be any AwaitedDOM element, collection of elements, or resource(s).

#### **Returns**: `Promise<DetachedElement>`

### hero.exportUserProfile *()* {#export-profile}

Returns a json representation of the underlying browser state for saving. This can later be restored into a new instance using `new Hero({ userProfile: serialized })`. See the [UserProfile page](/docs/hero/advanced-client/user-profile) for more details.

#### **Returns**: [`Promise<IUserProfile>`](/docs/hero/advanced-client/user-profile)

### hero.focusTab *(tab)* {#focus-tab}

Bring a tab to the forefront. This will route all interaction (`click`, `type`, etc) methods to the tab provided as an argument.

#### **Arguments**:

- tab `Tab` The Tab which will become the `activeTab`.

#### **Returns**: `Promise<void>`

Alias for [Tab.focus()](/docs/hero/basic-client/tab#focus)

### hero.getSnippet *(key)* {#getSnippet}

Retrieves a value you previously stored with setSnippet.

```js
const hero = new Hero();
await hero.goto('https://ulixee.org');
await hero.setSnippet('time', new Date());
const when = await hero.getSnippet('time');
```

#### **Arguments**:

- key `string`. The key you previously used to store the value.

#### **Returns**: `Promise<any>`

### hero.interact *(interaction\[, interaction, ...])* {#interact}

Executes a series of mouse and keyboard interactions.

#### **Arguments**:

- interaction [`Interaction`](/docs/hero/basic-client/interactions)

#### **Returns**: `Promise`

Refer to the [Interactions page](/docs/hero/basic-client/interactions) for details on how to construct an interaction.


### hero.setSnippet *(key, value)* {#setSnippet}

Stores a JSON-able value in the session database that can be retrieved later with [HeroReplay](/docs/hero/basic-client/hero-replay).

```js
const hero = new Hero();
await hero.goto('https://ulixee.org');
await hero.setSnippet('time', new Date());
const when = await hero.getSnippet('time');
```
To retrieve later with [HeroReplay](/docs/hero/basic-client/hero-replay):

```js
const replay = new HeroReplay({ /* previousSessionId */});
const when = await replay.getSnippet('time');
```

#### **Arguments**:

- key `string`. The key you want to use to retrieve this value at a later time.
- value `any`. The only constraint is the value must be JSON-able.

#### **Returns**: `Promise<void>`


### hero.scrollTo *(mousePosition)* {#scroll-to}

Executes a scroll interaction. This is a shortcut for `hero.interact({ scroll: mousePosition })`. See the [Interactions page](/docs/hero/basic-client/interactions) for more details.

#### **Arguments**:

- mousePosition `MousePosition`

#### **Returns**: `Promise`

### hero.type *(keyboardInteraction\[, keyboardInteraction, ...])* {#type}

Executes a keyboard interactions. This is a shortcut for `hero.interact({ type: string | KeyName[] })`.

#### **Arguments**:

- keyboardInteraction [`KeyboardInteraction`](/docs/hero/basic-client/interactions#the-four-keyboard-commands)

#### **Returns**: `Promise`

Refer to the [Interactions page](/docs/hero/basic-client/interactions) for details on how to construct keyboard interactions.

### hero.use *(plugin)*

Add a plugin to the current instance. This must be called before any other hero methods.

#### **Arguments**:

- plugin `ClientPlugin` | `array` | `object` | `string`

#### **Returns**: `this` The same Hero instance (for optional chaining)

If an array is passed, then any client plugins found in the array are registered. If an object, than any client plugins found in the object's values are registered. If a string, it must be a valid npm package name available in the current environment or it must be an absolute path to a file that exports one or more plugins -- Hero will attempt to dynamically require it.

Also, if a string is passed -- regardless of whether it's an npm package or absolute path -- the same will also be registered in Core (however, the same is not true for arrays or objects). For example, you can easily register a Core plugin directly from Client:

```javascript
import Hero from '@ulixee/hero-playground';

const hero = new Hero();
hero.use('@ulixee/tattle-plugin');
```

The following three examples all work:

Use an already-imported plugin:

```javascript
import Hero from '@ulixee/hero-playground';
import ExecuteJsPlugin from '@ulixee/execute-js-plugin';

const hero = new Hero();
hero.use(ExecuteJsPlugin);
```

Use an NPM package name (if it's publicly available):

```javascript
import Hero from '@ulixee/hero-playground';

const hero = new Hero();
hero.use('@ulixee/execute-js-plugin');
```

Use an absolute path to file that exports one or more plugins:

```javascript
import Hero from '@ulixee/hero-playground';

const hero = new Hero();
hero.use(require.resolve('./CustomPlugins'));
```

### hero.waitForNewTab *()* {#wait-for-new-tab}

Wait for a new tab to be created. This can occur either via a `window.open` from within the page javascript, or a Link with a target opening in a new tab or window.

#### **Returns**: [`Promise<Tab>`](/docs/hero/basic-client/tab)

```js
const url = 'https://dataliberationfoundation.org/nopost';
const { document, activeTab } = hero;

await hero.goto('http://example.com');

// ...
// <a id="newTabLink" href="/newPage" target="_blank">Link to new target</a>
// ...

await document.querySelector('#newTabLink').click();
const newTab = await hero.waitForNewTab();

await newTab.waitForPaintingStable();
```

## Aliased Tab Methods

Hero instances have aliases to all top-level Tab methods. They will be routed to the `activeTab`.

### hero.fetch *(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#fetch}

Alias for [Tab.fetch()](/docs/hero/basic-client/tab#fetch)

### hero.findResource *(filter, options)* {#find-resource}

Alias for [Tab.findResource()](/docs/hero/basic-client/tab#find-resource)

### hero.flowCommand *(commandFn, exitState?, options?)* {#flow-command}

Alias for [Tab.flowCommand](/docs/hero/basic-client/tab#flow-command)

### hero.getFrameEnvironment *(frameElement)* {#get-frame-environment}

Alias for [Tab.getFrameEnvironment()](/docs/hero/basic-client/tab#get-frame-environment)

### hero.getComputedStyle *(element, pseudoElement)* <div class="specs"><i>W3C</i></div> {#get-computed-style}

Alias for [Tab.getComputedStyle()](/docs/hero/basic-client/tab#get-computed-style)

### hero.getJsValue *(path)* {#get-js-value}

Alias for [Tab.getJsValue()](/docs/hero/basic-client/tab#get-js-value)

### hero.goBack *(timeoutMs?)*

Alias for [Tab.goBack](/docs/hero/basic-client/tab#back)

### hero.goForward *(timeoutMs?)*

Alias for [Tab.goForward](/docs/hero/basic-client/tab#forward)

### hero.goto *(href, timeoutMs?)* {#goto}

Alias for [Tab.goto](/docs/hero/basic-client/tab#goto)

### hero.getComputedVisibility *(element)* {#get-computed-visibility}

Alias for [Tab.getComputedVisibility](/docs/hero/basic-client/tab#get-computed-visibility)

### hero.querySelector *(stringOrOptions)* {#query-selector}

Alias for [Tab.querySelector](/docs/hero/basic-client/tab#query-selector)

### hero.querySelectorAll *(stringOrOptions)* {#query-selector-all}

Alias for [Tab.querySelectorAll](/docs/hero/basic-client/tab#query-selector-all)

### hero.registerFlowHandler *(name, state, handlerFn)* {#register-flow-handler}

Alias for [Tab.registerFlowHandler](/docs/hero/basic-client/tab#register-flow-handler)

### hero.reload *(timeoutMs?)* {#reload}

Alias for [Tab.reload](/docs/hero/basic-client/tab#reload)

### hero.takeScreenshot *(options?)* {#take-screenshot}

Alias for [Tab.takeScreenshot](/docs/hero/basic-client/tab#take-screenshot)

### hero.validateState *(state)* {#validate-state}

Alias for [Tab.validateState](/docs/hero/basic-client/tab#validate-state)

### hero.waitForFileChooser *(options)* {#wait-for-file-chooser}

Alias for [Tab.waitForFileChooser()](/docs/hero/basic-client/tab#wait-for-file-chooser)

### hero.waitForElement *(element, options)* {#wait-for-element}

Alias for [Tab.waitForElement](/docs/hero/basic-client/tab#wait-for-element)

### hero.waitForLocation *(trigger, options)* {#wait-for-location}

Alias for [Tab.waitForLocation](/docs/hero/basic-client/tab#wait-for-location)

### hero.waitForMillis *(millis)* {#wait-for-millis}

Alias for [Tab.waitForMillis](/docs/hero/basic-client/tab#wait-for-millis)

### hero.waitForState *(state, options)* {#wait-for-state}

Alias for [Tab.waitForState](/docs/hero/basic-client/tab#wait-for-state)

### hero.waitForPaintingStable *()* {#wait-for-painting-stable}

Alias for [Tab.waitForLoad(PaintingStable)](/docs/hero/basic-client/tab#wait-for-load)

### hero.waitForResource *(filter, options)* {#wait-for-resource}

Alias for [Tab.waitForResource](/docs/hero/basic-client/tab#wait-for-resource)

### hero.waitForResources *(filter, options)* {#wait-for-resource}

Alias for [Tab.waitForResources](/docs/hero/basic-client/tab#wait-for-resources)

### hero.xpathSelector *(selector, orderedResults)* {#xpath-selector}

Alias for [Tab.xpathSelector](/docs/hero/basic-client/tab#xpath-selector)

### hero.xpathSelectorAll *(selector, orderedResults)* {#xpath-selector-all}

Alias for [Tab.xpathSelectorAll](/docs/hero/basic-client/tab#xpath-selector-all)
