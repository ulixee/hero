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

An instance has a [replayable](../advanced-concepts/time-travel.md)&nbsp;[Session](../advanced-concepts/sessions.md) that will record all commands, dom changes, interaction and page events.

#### Lightweight

Instances are very lightweight, sharing a pool of browsers underneath. To manage concurrent scrapes in a single script, you can create one Hero for each scrape.

#### Single Active Tab

Hero instances can have multiple [Tabs](../advanced-client/tab.md), but only a single tab can be focused at a time. Clicks and other user interaction will go to the active tab (interacting with multiple tabs at once by a single user is easily detectable).

#### Sandboxed

Each Hero instance creates a private environment with its own cache, cookies, session data and "incognito" browser window. No data is shared between instances -- each operates within an airtight sandbox to ensure no identities leak across requests.

## Constructor {#constructor}

Creates a new sandboxed browser instance with [unique user session and fingerprints](../overview/basic-concepts). Or pass in an existing UserProfile to reconstruct a previously used user session.

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
  - connectionToCore `options | ConnectionToCore | 'string'`. An object containing `IConnectionToCoreOptions` used to connect, or an already created `ConnectionToCore` instance. A host may be provided directly as a string. Defaults to automatically booting up and connecting to a local `Core`.
  - name `string`. This is used to generate a unique sessionName.
  - userAgent `strong`. This sets your browser's user agent string. Prefixing this string with a tilde (`~`) allows for dynamic options. Details can be found [here](../advanced-client/user-agents).
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
  - blockedResourceTypes `BlockedResourceType[]`. Controls browser resource loading. Valid options are listed [here](../overview/configuration.md#blocked-resources).
  - blockedResourceUrls: `(string | RegExp)[]`. Also controls browser resource loading. See for more information [here](../overview/configuration.md#blocked-urls).
  - showChrome `boolean`. A boolean whether to show the Chrome browser window. Can also be set with an env variable: `ULX_SHOW_CHROME=true`. Default `false`.
  - showChromeInteractions `boolean`. A boolean whether to inject user interactions to mimic headless mouse/keyboard activity. Default `false`.
  - showDevtools: `boolean` - Automatically show devtools when Chrome is open using `showChrome`. Default `false`.
  - showChromeAlive `boolean`. A boolean whether to show the ChromeAlive! toolbar (if installed in devDependencies, or using Ulixee.app). Default `false`.
  - userProfile `IUserProfile`. A json object matching the format created by [hero.exportUserProfile()](#export-profile). This property allows restoring user storage and cookies from a previous session.
  - upstreamProxyUrl `string`. A socks5 or http proxy url (and optional auth) to use for all HTTP requests in this session. The optional "auth" should be included in the UserInfo section of the url, eg: `http://username:password@proxy.com:80`.
  - upstreamProxyUseSystemDns `boolean`. A variable to indicate DNS should be resolved on the host machine. By default, if a proxy is used, hosts will be resolved by the remote proxy.
  - upstreamProxyIpMask `object`. Optional settings to mask the Public IP Address of a host machine when using a proxy. This is used by the default BrowserEmulator to mask WebRTC IPs.
    - ipLookupService `string`. The URL of an http based IpLookupService. A list of common options can be found in the [Unblocked Plugin](https://github.com/ulixee/unblocked/blob/46e1894b5089660d62ac71c18d601e7c47795447/plugins/default-browser-emulator/lib/helpers/lookupPublicIp.ts#L81).
    - proxyIp `string`. The optional IP address of your proxy, if known ahead of time.
    - publicIp `string`. The optional IP address of your host machine, if known ahead of time.
  - sessionPersistence `boolean`. Do not save the [Session](../advanced-concepts/sessions.md) database if set to `false`. Defaults to `true` so you can troubleshoot errors, and load/extract data from previous sessions. 

## Properties

### hero.activeTab {#active-tab}

Returns a reference to the currently active tab.

#### **Type**: [`Tab`](../advanced-client/tab.md)

### hero.coreHost {#core-host}

The connectionToCore host address to which this Hero has connected. This is useful in scenarios where Hero instances are round-robining between multiple hosts.

#### **Type**: `Promise<string>`

### hero.detachedElements

DetachedElements object providing access to all elements that have been detached and tagged with a name.

#### **Returns** [`DetachedElements`](../advanced-client/detached-elements.md)

### hero.detachedResources

DetachedResources object providing access to all resources that have been detached and tagged with a name.

#### **Returns** [`DetachedResources`](../advanced-client/detached-resources.md)

### hero.document <div class="specs"><i>W3C</i></div> {#document}

Returns a reference to the main Document for the active tab.

#### **Type**: [`SuperDocument`](../awaited-dom/super-document.md)

Alias for [activeTab.document](../advanced-client/tab.md#document)

### hero.frameEnvironments {#frame-environments}

Returns a list of [FrameEnvironments](../advanced-client/frame-environment.md) loaded for the active tab.

#### **Type**: [`Promise<FrameEnvironment[]>`](../advanced-client/frame-environment.md).

### hero.isAllContentLoaded {#is-all-content-loaded}

`True` if the "load" event has triggered on the active tab.

NOTE: this event does not fire in some circumstances (such as a long-loading asset.md). You frequently just want to know if the page has loaded for a user (see [isPaintingStable](#is-painting-stable)).

Wait for this event to trigger with [Tab.waitForLoad(AllContentLoaded)](../advanced-client/tab.md#wait-for-load).

#### **Type**: `Promise<boolean>`

Alias for [Tab.isAllContentLoaded](../advanced-client/tab.md#is-all-content-loaded)

### hero.isDomContentLoaded {#is-dom-content-loaded}

`True` if the "DOMContentLoaded" event has triggered on the active tab.

Wait for this event to trigger with [Tab.waitForLoad(DomContentLoaded)](../advanced-client/tab.md#wait-for-load)

#### **Type**: `Promise<boolean>`

Alias for [Tab.isDomContentLoaded](../advanced-client/tab.md#is-dom-content-loaded)

### hero.isPaintingStable {#is-painting-stable}

`True` if the page has loaded the main content above the fold. Works on javascript-rendered pages.

Wait for this event to trigger with [Hero.waitForPaintingStable()](#wait-for-painting-stable)

#### **Type**: `Promise<boolean>`

Alias for [Tab.isPaintingStable](../advanced-client/tab.md#is-painting-stable)

### hero.lastCommandId {#lastCommandId}

An execution point that refers to a command run on this instance (`waitForElement`, `click`, `type`, etc). Command ids can be passed to select `waitFor*` methods to indicate a starting point to listen for changes.

#### **Type**: `Promise<number>`

Alias for [activeTab.lastCommandId](../advanced-client/tab.md#lastCommandId)

### hero.mainFrameEnvironment {#main-frame-environment}

Returns a reference to the document of the [mainFrameEnvironment](#main-frame-environment) of the active tab.

Alias for [tab.mainFrameEnvironment.document](../advanced-client/frame-environment.md#document).

#### **Type**: [`SuperDocument`](../awaited-dom/super-document.md)

### hero.meta {#meta}

Retrieves metadata about the hero configuration:

- sessionId `string`. The session identifier.
- sessionName `string`. The unique session name that will be visible in Replay.
- timezoneId `string`. The configured unicode TimezoneId or host default (eg, America/New_York).
- locale `string`. The configured locale in use (eg, en-US).
- geolocation `IGeolocation`. The configured geolocation of the user (if set.md).
- viewport `IViewport`. The emulated viewport size and location.
- blockedResourceTypes `BlockedResourceType[]`. The blocked resource types.
- blockedResourceUrls `(string | RegExp)[]`. The blocked urls.
- upstreamProxyUrl `string`. The proxy url in use for this hero.
- upstreamProxyUseSystemDns `boolean`. A variable to indicate DNS should be resolved on the host machine.
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

#### **Type**: [`Promise<Tab[]>`](../advanced-client/tab.md)

### hero.url {#url}

The url of the active tab.

#### **Type**: `Promise<string>`

Alias for [Tab.url](../advanced-client/tab.md#url)

### hero.Request <div class="specs"><i>W3C</i></div> {#request-type}

Returns a constructor for a Request object bound to the `activeTab`. Proxies to [tab.Request](../advanced-client/tab.md#request-type). These objects can be used to run browser-native [tab.fetch](../advanced-client/tab.md#fetch) requests from the context of the Tab document.

#### **Type**: [`Request`](../awaited-dom/request.md)

Alias for [Tab.Request](../advanced-client/tab.md#request-tab)

## Static Properties

### Hero.defaults {#defaults}

Get/set default properties to be applied to all Hero instances.

- blockedResourceTypes `BlockedResourceType[]`. Controls browser resource loading. Valid options are listed [here](../overview/configuration.md#blocked-resources).
- blockedResourceUrls: `(string | RegExp)[]`. Also controls browser resource loading. See for more information [here](../overview/configuration.md#blocked-urls).
- userProfile `IUserProfile`. A json object matching the format created by [hero.exportUserProfile()](#export-profile). This property allows restoring user storage and cookies from a previous session.
- shutdownOnProcessSignals `boolean`. Default `true`. Should Hero connections interrupt and cleanup on process abort signals (eg, SIGINT, SIGTERM, SIGQUIt.md).

#### **Type**: `IHeroDefaults` described above.

## Methods

### hero.addToDetached _(name, elementOrResource)_ {#addToDetached}

Converts an element or resource to a DetachedElement or DetachedResource and adds it to [hero.detachedElements](./hero.md#detachedElements) or [hero.detachedResources](./hero.md#detachedElements).

```js
const hero = new Hero();
await hero.goto('https://ulixee.org');
await hero.addToDetached('title', hero.querySelector('h1'));
const h1 = await hero.detachedElements.get('title');
```

To retrieve at a later time with [HeroReplay](./hero-replay.md):

```js
const replay = new HeroReplay({
  /* previousSessionId */
});
const h1 = await replay.detachedElements.get('title');
```

#### **Arguments**:

- elementOrResource `AwaitedDOM`. This can be any AwaitedDOM element, collection of elements, or resource(s).
- options `object`. Optional settings to apply to this extraction
  - name `string`. A name to use in retrieving from [DetachedElements](./hero.md#detached-elements). It does not need to be unique - items with the same name will be added to a list.

#### **Returns**: `Promise<void>`

### hero.click _(mousePosition, verification?)_ {#click}

Executes a click interaction. This is a shortcut for `hero.interact({ click: mousePosition })`. See the [Interactions page](./interactions.md) for more details.

#### **Arguments**:

- mousePosition [`MousePosition`](./interactions.md#mouseposition)
- verification [`ClickVerficiation`](./interactions.md#clickverification)

#### **Returns**: `Promise`

### hero.close _()_ {#close}

Closes the current instance and any open tabs.

#### **Returns**: `Promise`

### hero.closeTab _(tab)_ {#close-tab}

Close a single Tab. The first opened Tab will become the focused tab.

#### **Arguments**:

- tab `Tab` The Tab to close.

#### **Returns**: `Promise<void>`

Alias for [Tab.close()](../advanced-client/tab.md#close)

### hero.detach _(elementOrResource)_ {#detach}

Returns an element or resource as a [DetachedElement](./detached-element.md) or [DetachedResource](../advanced-client/detached-resources.md) object. This allows you to access the elements properties and methods without using `await`.

```js
const hero = new Hero();
await hero.goto('https://ulixee.org');
const h1Elem = await hero.detach(hero.querySelector('h1'));
console.log('title: ', h1Elem.getAttribute.get('title'));
```

#### **Arguments**:

- elementOrResource `AwaitedDOM`. This can be any AwaitedDOM element, collection of elements, or resource(s).

#### **Returns**: `Promise<DetachedElement>`

### hero.exportUserProfile _()_ {#export-profile}

Returns a json representation of the underlying browser state for saving. This can later be restored into a new instance using `new Hero({ userProfile: serialized })`. See the [UserProfile page](../advanced-client/user-profile.md) for more details.

#### **Returns**: [`Promise<IUserProfile>`](../advanced-client/user-profile.md)

### hero.focusTab _(tab)_ {#focus-tab}

Bring a tab to the forefront. This will route all interaction (`click`, `type`, etc) methods to the tab provided as an argument.

#### **Arguments**:

- tab `Tab` The Tab which will become the `activeTab`.

#### **Returns**: `Promise<void>`

Alias for [Tab.focus()](../advanced-client/tab.md#focus)

### hero.getSnippet _(key)_ {#getSnippet}

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

### hero.interact _(interaction\[, interaction, ...])_ {#interact}

Executes a series of mouse and keyboard interactions.

#### **Arguments**:

- interaction [`Interaction`](./interactions.md)

#### **Returns**: `Promise`

Refer to the [Interactions page](./interactions.md) for details on how to construct an interaction.

### hero.setSnippet _(key, value)_ {#setSnippet}

Stores a JSON-able value in the session database that can be retrieved later with [HeroReplay](./hero-replay.md).

```js
const hero = new Hero();
await hero.goto('https://ulixee.org');
await hero.setSnippet('time', new Date());
const when = await hero.getSnippet('time');
```

To retrieve later with [HeroReplay](./hero-replay.md):

```js
const replay = new HeroReplay({
  /* previousSessionId */
});
const when = await replay.getSnippet('time');
```

#### **Arguments**:

- key `string`. The key you want to use to retrieve this value at a later time.
- value `any`. The only constraint is the value must be JSON-able.

#### **Returns**: `Promise<void>`

### hero.scrollTo _(mousePosition)_ {#scroll-to}

Executes a scroll interaction. This is a shortcut for `hero.interact({ scroll: mousePosition })`. See the [Interactions page](./interactions.md) for more details.

#### **Arguments**:

- mousePosition `MousePosition`

#### **Returns**: `Promise`

### hero.type _(keyboardInteraction\[, keyboardInteraction, ...])_ {#type}

Executes a keyboard interactions. This is a shortcut for `hero.interact({ type: string | KeyName[] })`.

#### **Arguments**:

- keyboardInteraction [`KeyboardInteraction`](./interactions.md#the-four-keyboard-commands)

#### **Returns**: `Promise`

Refer to the [Interactions page](./interactions.md) for details on how to construct keyboard interactions.

### hero.use _(plugin)_

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

### hero.waitForNewTab _()_ {#wait-for-new-tab}

Wait for a new tab to be created. This can occur either via a `window.open` from within the page javascript, or a Link with a target opening in a new tab or window.

#### **Returns**: [`Promise<Tab>`](../advanced-client/tab.md)

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

### hero.fetch _(requestInput, requestInit)_ <div class="specs"><i>W3C</i></div> {#fetch}

Alias for [Tab.fetch()](../advanced-client/tab.md#fetch)

### hero.findResource _(filter, options)_ {#find-resource}

Alias for [Tab.findResource()](../advanced-client/tab.md#find-resource)

### hero.flowCommand _(commandFn, exitState?, options?)_ {#flow-command}

Alias for [Tab.flowCommand](../advanced-client/tab.md#flow-command)

### hero.getFrameEnvironment _(frameElement)_ {#get-frame-environment}

Alias for [Tab.getFrameEnvironment()](../advanced-client/tab.md#get-frame-environment.md)

### hero.getComputedStyle _(element, pseudoElement)_ <div class="specs"><i>W3C</i></div> {#get-computed-style}

Alias for [Tab.getComputedStyle()](../advanced-client/tab.md#get-computed-style)

### hero.getJsValue _(path)_ {#get-js-value}

Alias for [Tab.getJsValue()](../advanced-client/tab.md#get-js-value)

### hero.goBack _(timeoutMs?)_

Alias for [Tab.goBack](../advanced-client/tab.md#back)

### hero.goForward _(timeoutMs?)_

Alias for [Tab.goForward](../advanced-client/tab.md#forward)

### hero.goto _(href, options?: { timeoutMs?, referrer? })_ {#goto}

Alias for [Tab.goto](../advanced-client/tab.md#goto)

### hero.getComputedVisibility _(element)_ {#get-computed-visibility}

Alias for [Tab.getComputedVisibility](../advanced-client/tab.md#get-computed-visibility)

### hero.querySelector _(stringOrOptions)_ {#query-selector}

Alias for [Tab.querySelector](../advanced-client/tab.md#query-selector)

### hero.querySelectorAll _(stringOrOptions)_ {#query-selector-all}

Alias for [Tab.querySelectorAll](../advanced-client/tab.md#query-selector-all)

### hero.registerFlowHandler _(name, state, handlerFn)_ {#register-flow-handler}

Alias for [Tab.registerFlowHandler](../advanced-client/tab.md#register-flow-handler)

### hero.reload _(timeoutMs?)_ {#reload}

Alias for [Tab.reload](../advanced-client/tab.md#reload)

### hero.takeScreenshot _(options?)_ {#take-screenshot}

Alias for [Tab.takeScreenshot](../advanced-client/tab.md#take-screenshot.md)

### hero.validateState _(state)_ {#validate-state}

Alias for [Tab.validateState](../advanced-client/tab.md#validate-state)

### hero.waitForFileChooser _(options)_ {#wait-for-file-chooser}

Alias for [Tab.waitForFileChooser()](../advanced-client/tab.md#wait-for-file-chooser)

### hero.waitForElement _(element, options)_ {#wait-for-element}

Alias for [Tab.waitForElement](../advanced-client/tab.md#wait-for-element.md)

### hero.waitForLocation _(trigger, options)_ {#wait-for-location}

Alias for [Tab.waitForLocation](../advanced-client/tab.md#wait-for-location)

### hero.waitForMillis _(millis)_ {#wait-for-millis}

Alias for [Tab.waitForMillis](../advanced-client/tab.md#wait-for-millis)

### hero.waitForState _(state, options)_ {#wait-for-state}

Alias for [Tab.waitForState](../advanced-client/tab.md#wait-for-state)

### hero.waitForPaintingStable _()_ {#wait-for-painting-stable}

Alias for [Tab.waitForLoad(PaintingStable)](../advanced-client/tab.md#wait-for-load)

### hero.waitForResource _(filter, options)_ {#wait-for-resource}

Alias for [Tab.waitForResource](../advanced-client/tab.md#wait-for-resource)

### hero.waitForResources _(filter, options)_ {#wait-for-resource}

Alias for [Tab.waitForResources](../advanced-client/tab.md#wait-for-resources)

### hero.xpathSelector _(selector, orderedResults)_ {#xpath-selector}

Alias for [Tab.xpathSelector](../advanced-client/tab.md#xpath-selector)

### hero.xpathSelectorAll _(selector, orderedResults)_ {#xpath-selector-all}

Alias for [Tab.xpathSelectorAll](../advanced-client/tab.md#xpath-selector-all)
