# Hero

This is the primary class to interact with Hero. The following is a simple example:

```js
const Hero = require('@ulixee/hero');

(async () => {
  const hero = new Hero();
  await hero.goto('https://www.google.com');
  // other actions...
  await hero.close();
})();
```

An Hero instance can be thought of as a single user-browsing session. A default instance is automatically initialized and available as the default export of `ulixee`. Each additional instance you create has the following attributes:

#### Replayable

An instance has a [replayable](/docs/advanced/session-replay)&nbsp;[Session](/docs/advanced/session) that will record all commands, dom changes, interaction and page events.

#### Lightweight

Instances are very lightweight, sharing a pool of browsers underneath. To manage concurrent scrapes in a single script, you can create one Hero for each scrape, or manage load and concurrency with a [Handler](/docs/basic-interfaces/handler).

#### Single Active Tab

Hero instances can have multiple [Tabs](/docs/basic-interfaces/tab), but only a single tab can be focused at a time. Clicks and other user interaction will go to the active tab (interacting with multiple tabs at once by a single user is easily detectable).

#### Sandboxed

Each Hero instance creates a private environment with its own cache, cookies, session data and [BrowserEmulator](/docs/plugins/browser-emulators). No data is shared between instances -- each operates within an airtight sandbox to ensure no identities leak across requests.

## Default Instance {#default}

A default instance is automatically initialized and available as the default export of `ulixee`.

The default instance can receive configuration via command line arguments. Any args starting with `--input.*` will be processed. The resulting json object is available as [`hero.input`](#input)

```js
// script.js
const Hero = require('@ulixee/hero');

const hero = new Hero();
console.log(hero.input); // { secret: "true", hero: "true" }
```

```bash
$ node script.js --input.secret=true --input.hero=true
```

## Constructor

### new Hero*(options)* {#constructor}

Creates a new sandboxed browser instance with [unique user session and fingerprints](/docs/overview/basic-concepts). Or pass in an existing UserProfile to reconstruct a previously used user session.

You can optionally await an instance (or constructor) to cause the connection to the underlying Hero to be initialized. If you don't await, the connection will be established on the first call.

Note: If you provide a `name` that has already been used to name another instance then a counter will be appended to your string to ensure its uniqueness. However, it's only unique within a single NodeJs process (i.e., rerunning your script will reset the counter).

```js
const Hero = require('@ulixee/hero');

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
  - input `object`. An object containing properties to attach to the hero. NOTE: if using the default hero, this object will be populated with command line variables starting with `--input.{json path}`. The `{json path}` will be translated into an object set to `hero.input`.
  - showReplay `boolean`. Whether or not to show the Replay UI. Can also be set with an env variable: `HERO_SHOW_REPLAY=true`.
  - upstreamProxyUrl `string`. A socks5 or http proxy url (and optional auth) to use for all HTTP requests in this session. The optional "auth" should be included in the UserInfo section of the url, eg: `http://username:password@proxy.com:80`.
  - upstreamProxyIpMask `object`. Optional settings to mask the Public IP Address of a host machine when using a proxy. This is used by the default BrowserEmulator to mask WebRTC IPs.
    - ipLookupService `string`. The URL of an http based IpLookupService. A list of common options can be found in `plugins/default-browser-emulator/lib/helpers/lookupPublicIp.ts`. Defaults to `ipify.org`.
    - proxyIp `string`. The optional IP address of your proxy, if known ahead of time.
    - publicIp `string`. The optional IP address of your host machine, if known ahead of time.

## Properties

### hero.activeTab {#active-tab}

Returns a reference to the currently active tab.

#### **Type**: [`Tab`](/docs/basic-interfaces/tab)

### hero.coreHost {#core-host}

The connectionToCore host address to which this Hero has connected. This is useful in scenarios where a Handler is round-robining connections between multiple hosts.

#### **Type**: `Promise<string>`

### hero.document <div class="specs"><i>W3C</i></div> {#document}

Returns a reference to the main Document for the active tab.

#### **Type**: [`SuperDocument`](/docs/awaited-dom/super-document)

Alias for [activeTab.document](/docs/basic-interfaces/tab#document)

### hero.frameEnvironments {#frame-environments}

Returns a list of [FrameEnvironments](/docs/basic-interfaces/frame-environment) loaded for the active tab.

#### **Type**: [`Promise<FrameEnvironment[]>`](/docs/basic-interfaces/frame-environment).

### hero.input {#input}

Contains the input configuration (if any) for this hero. This might come from:

- [`Handler.dispatchHero`](/docs/basic-interfaces/handler#dispatch-hero)
- or the [default `hero`](#default)

NOTE: if using the default hero, this object will be populated with command line variables starting with `--input.*`. The parameters will be translated into an object set to `hero.input`.

#### **Type**: Object

### hero.isAllContentLoaded {#is-all-content-loaded}

`True` if the "load" event has triggered on the active tab.

NOTE: this event does not fire in some circumstances (such as a long-loading asset). You frequently just want to know if the page has loaded for a user (see [isPaintingStable](#is-painting-stable)).

Wait for this event to trigger with [Tab.waitForLoad(AllContentLoaded)](/docs/basic-interfaces/tab#wait-for-load).

#### **Type**: `Promise<boolean>`

Alias for [Tab.isAllContentLoaded](/docs/basic-interfaces/tab#is-all-content-loaded)

### hero.isDomContentLoaded {#is-dom-content-loaded}

`True` if the "DOMContentLoaded" event has triggered on the active tab.

Wait for this event to trigger with [Tab.waitForLoad(DomContentLoaded)](/docs/basic-interfaces/tab#wait-for-load)

#### **Type**: `Promise<boolean>`

Alias for [Tab.isDomContentLoaded](/docs/basic-interfaces/tab#is-dom-content-loaded)

### hero.isPaintingStable {#is-painting-stable}

`True` if the page has loaded the main content above the fold. Works on javascript-rendered pages.

Wait for this event to trigger with [Hero.waitForPaintingStable()](#wait-for-painting-stable)

#### **Type**: `Promise<boolean>`

Alias for [Tab.isPaintingStable](/docs/basic-interfaces/tab#is-painting-stable)

### hero.lastCommandId {#lastCommandId}

An execution point that refers to a command run on this instance (`waitForElement`, `click`, `type`, etc). Command ids can be passed to select `waitFor*` methods to indicate a starting point to listen for changes.

#### **Type**: `Promise<number>`

Alias for [activeTab.lastCommandId](/docs/basic-interfaces/tab#lastCommandId)

### hero.mainFrameEnvironment {#main-frame-environment}

Returns a reference to the document of the [mainFrameEnvironment](#main-frame-environment) of the active tab.

Alias for [tab.mainFrameEnvironment.document](/docs/basic-interfaces/frame-environment#document).

#### **Type**: [`SuperDocument`](/docs/awaited-dom/super-document)

### hero.meta {#meta}

Retrieves metadata about the hero configuration:

- sessionId `string`. The session identifier.
- sessionName `string`. The unique session name that will be visible in Replay.
- browserEmulatorId `string`. The id of the [Browser Emulator](/docs/plugins/browser-emulators) in use.
- humanEmulatorId `string`. The id of the [Human Emulator](/docs/plugins/human-emulators) in use.
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

#### **Type**: `Promise<IHeroMeta>`

### hero.output {#output}

Hero output is an object used to track any data you collect during your session. Output will be shown in Replay during playback for easy visual playback of data collection.

Output is able to act like an Array or an Object. It will serialize properly in either use-case.

NOTE: any object you assign into Output is "copied" into the Output object. You should not expect further changes to the source object to synchronize.

```js
const Hero = require('@ulixee/hero');

(async () => {
  const hero = new Hero();
  await hero.goto('https://www.google.com');
  const document = hero.document;

  for (const link of await document.querySelectorAll('a')) {
    hero.output.push({
      // will display in Replay UI.
      text: await link.textContent,
      href: await link.href,
    });
  }

  console.log(hero.output);
  await hero.close();
})();
```

#### **Type**: `Output`. An array-like object.

### hero.sessionId {#sessionId}

An identifier used for storing logs, snapshots, and other assets associated with the current session.

#### **Type**: `Promise<string>`

### hero.sessionName {#sessionName}

A human-readable identifier of the current Hero session.

You can set this property when calling [Handler.dispatchHero()](/docs/basic-interfaces/handler#dipatch-hero) or [Handler.createHero()](/docs/basic-interfaces/handler#create-hero).

#### **Type**: `Promise<string>`

### hero.tabs {#tabs}

Returns all open browser tabs.

#### **Type**: [`Promise<Tab[]>`](/docs/basic-interfaces/tab)

### hero.url {#url}

The url of the active tab.

#### **Type**: `Promise<string>`

Alias for [Tab.url](/docs/basic-interfaces/tab#url)

### hero.Request <div class="specs"><i>W3C</i></div> {#request-type}

Returns a constructor for a Request object bound to the `activeTab`. Proxies to [tab.Request](/docs/basic-interfaces/tab#request-type). These objects can be used to run browser-native [tab.fetch](/docs/basic-interfaces/tab#fetch) requests from the context of the Tab document.

#### **Type**: [`Request`](/docs/awaited-dom/request)

Alias for [Tab.Request](/docs/basic-interfaces/tab#request-tab)

## Methods

### hero.click*(mousePosition, verification?)* {#click}

Executes a click interaction. This is a shortcut for `hero.interact({ click: mousePosition })`. See the [Interactions page](/docs/basic-interfaces/interactions) for more details.

#### **Arguments**:

- mousePosition [`MousePosition`](/docs/basic-interfaces/interactions#mouseposition)
- verification [`ClickVerficiation`](/docs/basic-interfaces/interactions#clickverification)

#### **Returns**: `Promise`

### hero.close*()* {#close}

Closes the current instance and any open tabs.

#### **Returns**: `Promise`

### hero.closeTab*(tab)* {#close-tab}

Close a single Tab. The first opened Tab will become the focused tab.

#### **Arguments**:

- tab `Tab` The Tab to close.

#### **Returns**: `Promise<void>`

Alias for [Tab.close()](/docs/basic-interfaces/tab#close)

### hero.configure*(options)* {#configure}

Update existing configuration settings.

#### **Arguments**:

- options `object` Accepts any of the following:
  - userProfile `IUserProfile`. Previous user's cookies, session, etc.
  - timezoneId `string`. Overrides the host timezone. A list of valid ids are available at [unicode.org](https://unicode-org.github.io/cldr-staging/charts/37/supplemental/zone_tzid.html)
  - locale `string`. Overrides the host languages settings (eg, en-US). Locale will affect navigator.language value, Accept-Language request header value as well as number and date formatting rules.
  - viewport `IViewport`. Sets the emulated screen size, window position in the screen, inner/outer width. (See constructor for parameters).
  - blockedResourceTypes `BlockedResourceType[]`. Controls browser resource loading. Valid options are listed [here](/docs/overview/configuration#blocked-resources).
  - upstreamProxyUrl `string`. A socks5 or http proxy url (and optional auth) to use for all HTTP requests in this session. The optional "auth" should be included in the UserInfo section of the url, eg: `http://username:password@proxy.com:80`.
  - upstreamProxyIpMask `object`. Optional settings to mask the Public IP Address of a host machine when using a proxy. This is used by the default BrowserEmulator to mask WebRTC IPs.
    - ipLookupService `string`. The URL of an http based IpLookupService. A list of common options can be found in `plugins/default-browser-emulator/lib/helpers/lookupPublicIp.ts`. Defaults to `ipify.org`.
    - proxyIp `string`. The optional IP address of your proxy, if known ahead of time.
    - publicIp `string`. The optional IP address of your host machine, if known ahead of time.
  - connectionToCore `options | ConnectionToCore`. An object containing `IConnectionToCoreOptions` used to connect, or an already created `ConnectionToCore` instance. Defaults to booting up and connecting to a local `Core`.

#### **Returns**: `Promise`

See the [Configuration](/docs/overview/configuration) page for more details on `options` and its defaults. You may also want to explore [BrowserEmulators](/docs/plugins/browser-emulators) and [HumanEmulators](/docs/plugins/human-emulators).

### hero.detach*(tab\[, key])* {#detach-tab}

Detach the given tab into a "Frozen" state. The `FrozenTab` contains a replica of the DOM and layout at the moment of detachment, and supports all the readonly activities of a normal Tab (eg, querySelectors, getComputedVisibility, getComputedStyle).

`FrozenTabs` have a unique attribute in that any queries you run against them will be "learned" on an initial run, and pre-fetched on subsequent runs. This means you can very quickly iterate through all the data you want on a page after you've loaded it into your desired state.

NOTE: you can detach the same `Tab` multiple times per script. Each instance will contain DOM frozen at the time it was detached.

#### **Arguments**:

- tab `Tab`. An existing tab loaded to the point you wish to `freeze`
- key `string`. Optional extra identifier to differentiate between runs in a loop. This can be useful if you are looping through a list of links and detaching each Tab but have specific extraction logic for each link. NOTE: if your looping logic is the same, changing this key will decrease performance.

#### **Returns**: `FrozenTab`

```js
await hero.goto('https://chromium.googlesource.com/chromium/src/+refs');
await hero.activeTab.waitForLoad(LocationStatus.DomContentLoaded);

const frozenTab = await hero.detach(hero.activeTab);
const { document } = frozenTab;

const versions = hero.output;
// 1.  First run will run as normal.
// 2+. Next runs will pre-fetch everything run against the frozenTab
// NOTE: Every time your script changes, Hero will re-learn what to pre-fetch.
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
await hero.close();
```

### hero.exportUserProfile*()* {#export-profile}

Returns a json representation of the underlying browser state for saving. This can later be restored into a new instance using `hero.configure({ userProfile: serialized })`. See the [UserProfile page](/docs/advanced/user-profile) for more details.

#### **Returns**: [`Promise<IUserProfile>`](/docs/advanced/user-profile)

### hero.focusTab*(tab)* {#focus-tab}

Bring a tab to the forefront. This will route all interaction (`click`, `type`, etc) methods to the tab provided as an argument.

#### **Arguments**:

- tab `Tab` The Tab which will become the `activeTab`.

#### **Returns**: `Promise<void>`

Alias for [Tab.focus()](/docs/basic-interfaces/tab#focus)

### hero.interact*(interaction\[, interaction, ...])* {#interact}

Executes a series of mouse and keyboard interactions.

#### **Arguments**:

- interaction [`Interaction`](/docs/basic-interfaces/interactions)

#### **Returns**: `Promise`

Refer to the [Interactions page](/docs/basic-interfaces/interactions) for details on how to construct an interaction.

### hero.scrollTo*(mousePosition)* {#scroll-to}

Executes a scroll interaction. This is a shortcut for `hero.interact({ scroll: mousePosition })`. See the [Interactions page](/docs/basic-interfaces/interactions) for more details.

#### **Arguments**:

- mousePosition `MousePosition`

#### **Returns**: `Promise`

### hero.type*(keyboardInteraction\[, keyboardInteraction, ...])* {#type}

Executes a keyboard interactions. This is a shortcut for `hero.interact({ type: string | KeyName[] })`.

#### **Arguments**:

- keyboardInteraction [`KeyboardInteraction`](/docs/basic-interfaces/interactions#the-four-keyboard-commands)

#### **Returns**: `Promise`

Refer to the [Interactions page](/docs/basic-interfaces/interactions) for details on how to construct keyboard interactions.

### hero.use*(plugin)*

Add a plugin to the current instance. This must be called before any other hero methods.

#### **Arguments**:

- plugin `ClientPlugin` | `array` | `object` | `string`

#### **Returns**: `this` The same Hero instance (for optional chaining)

If an array is passed, then any client plugins found in the array are registered. If an object, than any client plugins found in the object's values are registered. If a string, it must be a valid npm package name available in the current environment or it must be an absolute path to a file that exports one or more plugins -- Hero will attempt to dynamically require it.

Also, if a string is passed -- regardless of whether it's an npm package or absolute path -- the same will also be registered in Core (however, the same is not true for arrays or objects). For example, you can easily register a Core plugin directly from Client:

```javascript
import Hero from '@ulixee/hero';

const hero = new Hero();
hero.use('@ulixee/tattle-plugin');
```

The following three examples all work:

Use an already-imported plugin:

```javascript
import Hero from '@ulixee/hero';
import ExecuteJsPlugin from '@ulixee/execute-js-plugin';

const hero = new Hero();
hero.use(ExecuteJsPlugin);
```

Use an NPM package name (if it's publicly available):

```javascript
import Hero from '@ulixee/hero';

const hero = new Hero();
hero.use('@ulixee/execute-js-plugin');
```

Use an absolute path to file that exports one or more plugins:

```javascript
import Hero from '@ulixee/hero';

const hero = new Hero();
hero.use(require.resolve('./CustomPlugins'));
```

### hero.waitForNewTab*()* {#wait-for-new-tab}

Wait for a new tab to be created. This can occur either via a `window.open` from within the page javascript, or a Link with a target opening in a new tab or window.

#### **Returns**: [`Promise<Tab>`](/docs/basic-interfaces/tab)

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

### hero.fetch*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#fetch}

Alias for [Tab.fetch()](/docs/basic-interfaces/tab#fetch)

### hero.findResource*(filter, options)* {#find-resource}

Alias for [Tab.findResource()](/docs/basic-interfaces/tab#find-resource)

### hero.getFrameEnvironment*(frameElement)* {#get-frame-environment}

Alias for [Tab.getFrameEnvironment()](/docs/basic-interfaces/tab#get-frame-environment)

### hero.getComputedStyle*(element, pseudoElement)* <div class="specs"><i>W3C</i></div> {#get-computed-style}

Alias for [Tab.getComputedStyle()](/docs/basic-interfaces/tab#get-computed-style)

### hero.getJsValue*(path)* {#get-js-value}

Alias for [Tab.getJsValue()](/docs/basic-interfaces/tab#get-js-value)

### hero.goBack*(timeoutMs?)*

Alias for [Tab.goBack](/docs/basic-interfaces/tab#back)

### hero.goForward*(timeoutMs?)*

Alias for [Tab.goForward](/docs/basic-interfaces/tab#forward)

### hero.goto*(href, timeoutMs?)* {#goto}

Alias for [Tab.goto](/docs/basic-interfaces/tab#goto)

### hero.getComputedVisibility*(element)* {#get-computed-visibility}

Alias for [Tab.getComputedVisibility](/docs/basic-interfaces/tab#get-computed-visibility)

### hero.querySelector*(stringOrOptions)* {#query-selector}

Alias for [Tab.querySelector](/docs/basic-interfaces/tab#query-selector)

### hero.querySelectorAll*(stringOrOptions)* {#query-selector-all}

Alias for [Tab.querySelectorAll](/docs/basic-interfaces/tab#query-selector-all)

### hero.reload*(timeoutMs?)* {#reload}

Alias for [Tab.reload](/docs/basic-interfaces/tab#reload)

### hero.takeScreenshot*(options?)* {#take-screenshot}

Alias for [Tab.takeScreenshot](/docs/basic-interfaces/tab#take-screenshot)

### hero.waitForFileChooser*(options)* {#wait-for-file-chooser}

Alias for [Tab.waitForFileChooser()](/docs/basic-interfaces/tab#wait-for-file-chooser)

### hero.waitForElement*(element, options)* {#wait-for-element}

Alias for [Tab.waitForElement](/docs/basic-interfaces/tab#wait-for-element)

### hero.waitForLocation*(trigger, options)* {#wait-for-location}

Alias for [Tab.waitForLocation](/docs/basic-interfaces/tab#wait-for-location)

### hero.waitForMillis*(millis)* {#wait-for-millis}

Alias for [Tab.waitForMillis](/docs/basic-interfaces/tab#wait-for-millis)

### hero.waitForState*(states, options)* {#wait-for-state}

Alias for [Tab.waitForState](/docs/basic-interfaces/tab#wait-for-state)

### hero.waitForPaintingStable*()* {#wait-for-painting-stable}

Alias for [Tab.waitForLoad(PaintingStable)](/docs/basic-interfaces/tab#wait-for-load)

### hero.waitForResource*(filter, options)* {#wait-for-resource}

Alias for [Tab.waitForResource](/docs/basic-interfaces/tab#wait-for-resource)
