# Unblocked Specification

The Unblocked Specification defines a generic protocol to create an automated browser "Agent" and allow for "Plugins" that can control the agent at every point in the stack as it navigates and interacts with web pages. The goal is to allow Plugins to be written in a generic manner which can allow Automated Engines to avoid being "blocked" while extracting public data.

## Why is this needed?

There are amazing tools available like [Puppeteer](https://developers.google.com/web/tools/puppeteer/) and [Playwright](http://playwright.dev) to control automated web browsers. These tools allow for coding interactions with websites. However... as they're currently built, they can be detected by websites.

Headless Chrome is initialized with different services and features than headed Chrome (not to mention differences with Chromium vs Chrome). These differences can be detected along the spectrum of a web browser session - from TLS, to Http and the DOM. To find a detailed analysis of these differences, check out [Double Agent](../double-agent).

To scrape website data, scrapers also need to be able to rotate user attributes like User Agent, IP Address, Language, Geolocation, and even lower level attributes like the WebGL settings and Canvas output.

This Specification defines a series of "hooks" that allow for reliably controlling these settings.

NOTE: Many settings are available within the regular Devtools Specification, but the browser must be appropriately "paused" at each step or the settings will be injected in time.

## Plugins

Plugins are defined as a collection of "hooks" and an [EmulationProfile](./plugin/IEmulationProfile.ts) to coordinate among many plugins.

### Emulation Profile

An [EmulationProfile](./plugin/IEmulationProfile.ts) is a set of configurations that the Agent and Plugins will coordinate to emulate in an automated browser. During initialization, each "installed" plugin will be passed in the EmulationProfile with a chance to help define the attributes of the scraping session. A plugin might provide a UserAgent and BrowserEngine, or might have logic to set WebGL settings from data files.

Configurations include:

- userAgentOption [`IUserAgentOption`](./plugin/IUserAgentOption.ts). An object to be provided by a participating plugin that represents a UserAgent that can be emulated.
- browserEngine [`IBrowserEngine`](./agent/browser/IBrowserEngine.ts). Metadata about the Browser executable and launch arguments that should be used to launch the underlying browser process (eg, Chrome 98).
- deviceProfile [`IDeviceProfile`](./plugin/IDeviceProfile.ts). Settings relevant to the hardware to be emulated, including Media devices and Graphics card settings.
- options [`IEmulationOptions`](./plugin/IEmulationProfile.ts). Options to configure user and browser settings. These are passed on from a Client program. These same settings are applied to the Profile itself. A plugin can opt to modify these if needed, or set them with defaults.
- customEmulatorConfig `object`. Settings to be passed to individual Plugins. The `@ulixee/default-browser-emulator` uses a custom `userAgentSelector` syntax, which is an example of this property.
- logger `IBoundLog`. Optional logger instance to use for output.

- dnsOverTlsProvider `object`. Configure the host and port to use for DNS over TLS. This feature replicates the Chrome feature that is used if the host DNS provider supports DNS over TLS or DNS over HTTPS. A `null` value will disable this feature.
  - host `string`. The DNS provider host address. Google=8.8.8.8, Cloudflare=1.1.1.1, Quad9=9.9.9.9.
  - servername `string`. The DNS provider tls servername. Google=dns.google, Cloudflare=cloudflare-dns.com, Quad9=dns.quad9.net.
- geolocation [`IGeolocation`](./plugin/IGeolocation.ts). Overrides the geolocation of the user.
  - latitude `number`. Latitude between -90 and 90.
  - longitude `number`. Longitude between -180 and 180.
  - accuracy `number`. Non-negative accuracy value. Defaults to random number 40-50.
- timezoneId `string`. Overrides the host timezone. A list of valid ids are available at [unicode.org](https://unicode-org.github.io/cldr-staging/charts/37/supplemental/zone_tzid.html)
- locale `string`. Overrides the host languages settings (eg, en-US). Locale will affect navigator.language value, Accept-Language request header value as well as number and date formatting rules.
- viewport [`IViewport`](./agent/browser/IViewport.ts). Sets the emulated screen size, window position in the screen, inner/outer width and height.
  - width `number`. The page width in pixels (minimum 0, maximum 10000000).
  - height `number`. The page height in pixels (minimum 0, maximum 10000000).
  - deviceScaleFactor `number` defaults to 1. Specify device scale factor (can be thought of as dpr).
  - screenWidth? `number`. The optional screen width in pixels (minimum 0, maximum 10000000).
  - screenHeight? `number`. The optional screen height in pixels (minimum 0, maximum 10000000).
  - positionX? `number`. Optional override browser X position on screen in pixels (minimum 0, maximum 10000000).
  - positionY? `number`. Optional override browser Y position on screen in pixels (minimum 0, maximum 10000000).
  - upstreamProxyUrl `string`. A socks5 or http proxy url (and optional auth) to use for all HTTP requests in this session. The optional "auth" should be included in the UserInfo section of the url, eg: `http://username:password@proxy.com:80`.
  - upstreamProxyUseSystemDns `boolean`. A variable to indicate DNS should be resolved on the host machine. By default, if a proxy is used, hosts will be resolved by the remote proxy.
  - upstreamProxyIpMask `object`. Optional settings to mask the Public IP Address of a host machine when using a proxy. This is used by the default BrowserEmulator to mask WebRTC IPs.
  - ipLookupService `string`. The URL of an http based IpLookupService.
  - proxyIp `string`. The optional IP address of your proxy, if known ahead of time.
  - publicIp `string`. The optional IP address of your host machine, if known ahead of time.
- showChrome `boolean`. A boolean whether to show the Chrome browser window.
- showDevtools `boolean`. Automatically show devtools when `showChrome` is enabled.
- disableIncognito `boolean`. Disable the use of an incognito context.
- disableMitm `boolean`. Disable the use of a man-in-the-middle server. This stops the ability to mimic the TLS signature of a headed Chrome version.
- noChromeSandbox `boolean`. A boolean to disable the Chrome Sandbox requirement on Linux.

### Plugin Creation

An individual plugin should implement the specification defined at [IUnblockedPlugin](./plugin/IUnblockedPlugin.ts). Any desired hooks should be added as functions to a class.

```ts
class MyFirstPlugin implements IUnblockedPlugin {
  async onNewPage(page) {
    // do something
  }
}
```

A plugin can optionally participate in a scrape and set Emulation Profile attributes by adding a static class function called `shouldActivate`.

```ts
class MyFirstPlugin implements IUnblockedPlugin {
  static shouldActivate(profile: IEmulationProfile): boolean {
    // 1. A plugin can set properties.
    if (!profile.browserEngine) profile.browserEngine = getMySuperEngine();
    // 2. A plugin can set defaults
    if (!profile.locale) profile.locale = 'en-GB';
    // 3. A plugin can choose to participate in this session.
    return doISupportTheUserAgent(profile.userAgentOption);
    // NOTE: A plugin should likely not change profile settings if it does not participate.
  }
}
```

### Lifecycle

Plugins are created with an agent and thrown away when the Agent is closed.

### Plugin Coordination

One or more Plugins are added to a single [`IUnblockedPlugins`](./plugin/IUnblockedPlugin.ts) manager that will be expected to follow a short specification. An implementor will need to be able to call a class level `shouldActivate` function on each Plugin class.

1. Each registered Plugin with a static method called `shouldActivate` must be called in the order Plugins are registered. The same [EmulationProfile](./plugin/IEmulationProfile.ts) object must be passed into each call. If a Plugin responds with `false`, it should not be used for the given session. If no method exists, it should always be activated.
2. An instance of each participating Plugin will be constructed with the [EmulationProfile](./plugin/IEmulationProfile.ts) object.
3. Only a single instance of `playInteractions` will be allowed. It should be the last implementation provided.
4. Only a single instance of `addDomOverride` will be used. It should be the first implementation that indicates it can run the override by returning `true`.
5. The Plugin will last for the duration of an Agent session, and should be disposed afterwards.

## Agent

The `/agent` folder of this specification defines all of the hooks that are expected by an Agent in order to intercept and adjust it to remain unblocked.

- `/agent/hooks`: This folder has interfaces describing all of the "hook" points an Agent is expected to expose
- `/agent/browser`: The browser-related interfaces, like a Browser, BrowserContext (incognito Window), Page, Frame, etc
- `/agent/net`: The network stack, including taps into lower level protocols
- `/agent/interact`: An interaction specification, allowing for grouping interaction steps.

NOTE: This set of interfaces was initially extracted from the SecretAgent project (https://github.com/ulixee/secret-agent). As such, it has too broad a spec. It should be whittled down over time.

To reach the goal of emulating a human using a regular browser, the following "hooks" must be provided by an implementor:

### Browser

Browser level hooks are called at a Browser level.

#### onNewBrowser(browser, launchArgs)

Called anytime a new Browser will be launched. The hooking method (eg, [BrowserEmulator](./IBrowserEmulator.ts)) can manipulate the `browser.engine.launchArguments` to control Chrome launch arguments. A list can be found [here](https://peter.sh/experiments/chromium-command-line-switches/).

_browser: [`IBrowser`](./agent/browser/IBrowser.ts)_ a Browser instance. Do not manipulate beyond `browser.engine.launchArguments` unless you really know what you're doing.
_browserUserConfig: [`IBrowserUserConfig`](./agent/browser/IBrowserUserConfig.ts)_ arguments provided by a user or set in the environment that an emulator should use to appropriately configure `browser.engine.launchArguments`

NOTE: a new browser might be reused by an implementor, so you should not assume this method will be called one-to-one with your scraper sessions.

#### onNewBrowserContext(context)

Called anytime a new [BrowserContext](./agent/browser/IBrowserContext.ts) has been created. A BrowserContext is the equivalent to a Chrome Incognito Window. This "hook" `Promise` will be resolved before any [Pages](./agent/browser/IPage.ts) are created in the BrowserContext. This a mechanism to isolate the User Storage and Cookies for a scraping session.

- context: [`IBrowserContext`](./agent/browser/IBrowserContext.ts)\* a BrowserContext instance that has just been opened.

#### onDevtoolsPanelAttached(devtoolsSession)

Called anytime a new Devtools Window is opened for any Devtools Window in the Browser.

A [DevtoolsSession](./agent/browser/IDevtoolsSession.ts) object has control to send and received any [Devtools Protocol APIs and Events](https://chromedevtools.github.io/devtools-protocol) supported by the given Browser.

_devtoolsSession: [`IDevtoolsSession`](./agent/browser/IDevtoolsSession.ts)_ a DevtoolsSession instance connected to the Devtools Panel.

NOTE: this only happens when a browser is launched into a Headed mode.

### BrowserContext

These hooks are called on an individual [BrowserContext](./agent/browser/IBrowserContext.ts).

#### addDomOverride(runOn, script, args, callback?)

Add a custom DOM override to the plugin. The function will be run only by the first Plugin that returns `true`.

- _runOn_ `page | worker` Where to run this script.
- _script_ `string` A script to be run in the page. It will be provided with access to Proxy utilities (currently matching the Unblocked Default Browser Emuluator `_proxyUtils`).
- _args_ `{ callbackName?: string } & any` Arguments to provide to the script. `callbackName` should be used to specify the name of a callback that will be injected onto the page. It's recommended to immediately delete this function to prevent it being detected by a webpage.
- _callback?_ `(data: string, frame: IFrame) => any` An optional callback to inject onto the page. The given name will match `args.callbackName` if provided, and injected as this argument to the script.

#### onNewPage(page)

Called anytime a new [Page](./agent/browser/IPage.ts) will be opened. The hooking Method can perform Devtools API calls using `page.devtoolsSession`.

An implementor is expected to pause the Page and allow all [Devtools API](https://chromedevtools.github.io/devtools-protocol) calls and [Page scripts](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-addScriptToEvaluateOnNewDocument) to be registered before the Page will render. This is likely done by instructing Chrome to pause all new pages in the debugger by default. The debugger will be [resumed](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-runIfWaitingForDebugger) ONLY after all initialization API calls are sent.

_page: [IPage](./agent/browser/IPage.ts)_ the created page paused waiting for the debugger. NOTE: you should not expect to get responses to Devtools APIs before the debugger has resumed.

#### onNewWorker(worker)

Called anytime a new Service, Shared or Web [Worker](./agent/browser/IWorker.ts) will be created. The hooking method can perform Devtools API calls using `worker.devtoolsSession`.

The Worker will be paused until hook methods are completed.

_worker: [IWorker](./agent/browser/IWorker.ts)_ the created worker.

#### onDevtoolsPanelAttached(devtoolsSession)

Called anytime a new Devtools Window is opened for a Page in this BrowserContext.

_devtoolsSession: [IDevtoolsSession](./agent/browser/IDevtoolsSession.ts)_ the connected DevtoolsSession instance.

NOTE: this only happens when a browser is launched into a Headed mode.

#### onDevtoolsPanelDetached(devtoolsSession)

Called anytime a new Devtools Window is closed for a Page in this BrowserContext.

_devtoolsSession: [IDevtoolsSession](./agent/browser/IDevtoolsSession.ts)_ the disconnected DevtoolsSession instance.

### Interact

Interaction hooks allow an emulator to control a series of interaction steps.

#### playInteractions(interactions, runFn, helper)

This hook allows a caller to manipulate the directed interaction commands to add an appearance of user interaction.

For instance, a scraper might provide instructions:

```js
[
  [
    { command: 'scroll', mousePosition: [0, 1050] },
    { command: 'click', mousePosition: [150, 150] },
  ],
];
```

An interaction hook could add timeouts and appear more human by breaking a scroll into smaller chunks.

```js
runFn({ command: 'scroll', mousePosition: [0, 500] });
runFn({ command: 'move', mousePosition: [0, 500] });
wait(100);
runFn({ command: 'scroll', mousePosition: [0, 1050] });
runFn({ command: 'move', mousePosition: [0, 1050] });
wait(100);
runFn({ command: 'click', mousePosition: [150, 150], delayMillis: 25 });
```

- interactions: [`IInteractionGroup[]`](./agent/interact/IInteractions.ts). A group of steps that are used to control the browser. Steps are things like Click on an Element, Move the Mouse to Coordinates, etc.
- runFn: `function(interaction: IInteractionStep)`. A provided function that will perform the final interaction with the webpage.
- helper: [`IInteractionsHelper`](./agent/interact/IInteractionsHelper.ts). A series of utility functions to calculate points and DOM Node locations.

#### beforeEachInteractionStep(step, isMouseCommand)

A callback run before each interaction step.

- interactionStep: [`IInteractionStep`](./agent/interact/IInteractions.ts). The step being performed: things like Click on an Element, Move the Mouse to Coordinates, etc.
- isMouseCommand: `boolean`. Is this a mouse interaction step?

#### afterInteractionGroups()

A callback run after all interaction groups from a single `playInteractions` have completed.

#### adjustStartingMousePoint(point, helper)

A callback allowing an implementor to adjust the initial mouse position that will be visible to the webpage.

- point: [`IPoint`](./agent/browser/IPoint.ts). The x,y coordinates to adjust.
- helper: [`IInteractionsHelper`](./agent/interact/IInteractionsHelper.ts). A series of utility functions to calculate points and DOM Node locations.

### Network

Network hooks allow an emulator to control settings and configurations along the TCP -> TLS -> HTTP/2 stack.

#### onDnsConfiguration(settings)

Change the DNS over TLS configuration for a session. This will be called once during setup of a [`BrowserContext`](./agent/browser/IBrowserContext.ts).

Chrome browsers will use the DNS over TLS configuration of your DNS host if it's supported (eg, CloudFlare, Google DNS, Quad9, etc). This setting can help mimic that usage.

Hook methods can manipulate the settings object to control the way the network stack will look up DNS requests.

- settings: [`IDnsSettings`](./agent/net/IDnsSettings.ts). DNS Settings that can be configured.
  - dnsOverTlsConnection `tls.ConnectionOptions`. TLS settings used to connect to the desired DNS Over TLS provider. Usually just a `host` and `port`.
  - useUpstreamProxy `boolean`. Whether to dial DNS requests over the upstreamProxy (if configured). This setting determines if DNS is resolved from the host machine location or the remote location of the proxy endpoint.

#### onTcpConfiguration(settings)

Change TCP settings for all Sockets created to serve webpage requests. This configuration will be called once during setup of a [`BrowserContext`](./agent/browser/IBrowserContext.ts).

Different Operating Systems exhibit unique TCP characteristics that can be used to identify when a browser says it's running on Windows 8, but shows TCP indicators that indicate it's actually running on Linux.

- settings: [`ITcpSettings`](./agent/net/ITcpSettings.ts). TCP Settings that can be configured.
  - tcpWindowSize `number`. Set the "WindowSize" used in TCP (max number of bytes that can be sent before an ACK must be received). NOTE: some operating systems use sliding windows. So this will just be a starting point.
  - tcpTtl `number`. Set the "TTL" of TCP packets.

#### onTlsConfiguration(settings)

Change TLS settings for all secure Sockets created to serve webpage requests. This configuration will be called once per [`BrowserContext`](./agent/browser/IBrowserContext.ts).

Different Browsers (and sometimes versions) will present specific order and values for TLS ClientHello Ciphers, Extensions, Padding and other attributes. Because these values do not change for a specific version of a Browser, they're an easy way to pickup when a request says it's Chrome 97, but is actually coming from Node.js.

- settings: [`ITlsSettings`](./agent/net/ITlsSettings.ts). TLS Settings that can be configured.
  - tlsClientHelloId `string`. A ClientHelloId that will be mimicked. This currently maps to [uTLS](https://github.com/refraction-networking/utls) values.
  - socketsPerOrigin `number`. The number of sockets to allocate before re-use for each Origin. This should mimic the source Browser settings.

#### onHttpAgentInitialized(agent)

Callback hook called after the network stack has been initialized. This configuration will be called once per [`BrowserContext`](./agent/browser/IBrowserContext.ts).

This function can be useful to do any post setup lookup (eg, to determine the public IP allocated by a proxy URL).

- agent: [`IHttpSocketAgent`](./agent/net/IHttpSocketAgent.ts). The agent that has been initialized. This object will expose a method to initialize a new Socket (ie, to dial an IP lookup service).

#### onHttp2SessionConnect(request, settings)

Callback to manipulate the HTTP2 settings used to initialize a conversation.

Browsers and versions send specific HTTP2 settings that remain true across all operating systems and clean installations.

- request: [`IHttpResourceLoadDetails`](./agent/net/IHttpResourceLoadDetails.ts). The request being made.
- settings: [`IHttp2ConnectSettings`](./agent/net/IHttp2ConnectSettings.ts). Settings that can be adjusted.
  - localWindowSize `number`. The HTTP2 initial window size to use.
  - settings `http2.Settings`. A node.js http2 module Settings object. It can be manipulated to change the settings sent to create an HTTP connection.

#### shouldInterceptRequest(url, resourceTypeIfKnown?)

Callback before each an HTTP request is initiated. Any plugin returning `true` will halt processing for the given request. When combined with [`handleInterceptedRequest`] you can also return custom responses.

- url: `URL`. The url being requested.
- resourceTypeIfKnown: [`IResourceType`](./agent/net/IResourceType.ts). The type of resource being requested if it can be determined by the browser.

### handleInterceptedRequest(url, resourceTypeIfKnown?, request, response)

Callback that will be triggered for each intercepted resource. This callback can be used to customize what response will be returned. In most cases
a plugin should only use this hook if the same plugin also used [`shouldInterceptRequest] to intercept this resource.

- url: `URL`. The url being requested.
- resourceTypeIfKnown: [`IResourceType`](./agent/net/IResourceType.ts). The type of resource being requested if it can be determined by the browser.
- request: request that would have been send but was intercepted instead.
- response: response object which will be used by the browser. Its important that this is a valid response, otherwise chrome might have issues with it.
  
#### beforeHttpRequest(request)

Callback before each HTTP request (after a socket has been established and protocol agreed upon, but before sending any HTTP request). This hook provides the opportunity to manipulate each request before it's sent on to the destination URL.

Browsers and versions send specific HTTP header values and order that are consistent by Resource Type, Origin, Cookie status, and more. An emulator should ensure headers are correct before a request is sent.

- request: [`IHttpResourceLoadDetails`](./agent/net/IHttpResourceLoadDetails.ts). The request being made. Details listed below are relevant to headers.
  - url: `URL`. The full destination URL.
  - isServerHttp2: `boolean`. Is this an HTTP2 request (the headers are different for HTTP/1 and 2).
  - method: `string`. The http method.
  - requestHeaders: `IncomingHeaders`. The headers that should be manipulated.
  - resourceType: [`IResourceType`](./agent/net/IResourceType.ts). The type of resource being requested.
  - originType: [`OriginType`](./agent/net/OriginType.ts). The type of origin (`none`,`same-origin`,`same-site`,`cross-site`).

#### beforeHttpRequestBody(request)

Callback before each HTTP request is written, but _after_ headers have been sent. This hook provides the opportunity to manipulate the request body before it's sent on to the upstream server.

NOTE: if you change the body (`request.requestPostDataStream`), you likely need to modify the header content-length in `beforeHttpRequest`. At this point in the flow, it will have already been sent.

- request: [`IHttpResourceLoadDetails`](./agent/net/IHttpResourceLoadDetails.ts). The request being made. Details listed below are relevant to headers.
  - url: `URL`. The full destination URL.
  - isServerHttp2: `boolean`. Is this an HTTP2 request (the headers are different for HTTP/1 and 2).
  - method: `string`. The http method.
  - requestPostDataStream `ReadableStream`. To intercept the stream, you might want to first drain the existing requestPostDataStream. To simply replace with a new body, you would do the following:
```js
  // drain first
for await (const _ of request.requestPostDataStream) {}
// send body. NOTE: we had to change out the content length before the body step
request.requestPostDataStream = Readable.from(Buffer.from('Intercept request'));
```


#### beforeHttpResponse(resource)

Callback before sending an HTTP response to the Browser. This can be used to track cookies on response, or implement a caching layer (ie, by tracking cache headers and sending on http request, then intercepting 304 response and sending a 200 + body).

- resource: [`IHttpResourceLoadDetails`](./agent/net/IHttpResourceLoadDetails.ts). The HTTP request with a response available.

#### beforeHttpResponseBody(resource)

Callback before sending an HTTP response "body" to the Browser. This can be used to change the response send by a server. 

NOTE: if you change the content length, you need to also change the header 'Content-Length' in `beforeHttpResponse`.


```typescript
async beforeHttpResponse(response: IHttpResourceLoadDetails): Promise<any> {
  if (response.url.pathname === '/intercept-post') {
    response.responseHeaders['Content-Length'] = 'Intercepted'.length.toString();
  }
},
async beforeHttpResponseBody(response: IHttpResourceLoadDetails): Promise<any> {
  if (response.url.pathname === '/intercept-post') {
    // drain response body. 
    // NOTE: we could also try to modify as we stream, but it's trickier
    // to handle properly.
    for await (const _ of response.responseBodyStream) {
    }
    response.responseBodyStream = Readable.from(Buffer.from('Intercepted'));
  }
}
```

- resource: [`IHttpResourceLoadDetails`](./agent/net/IHttpResourceLoadDetails.ts). The HTTP request with a response available.
  - responseBodyStream `ReadableStream`. The response body stream. You can simply replace this variable, or you can modify the awaited iterator as it's streamed.

#### afterHttpResponse(resource)

Callback after an HTTP response was already sent to the browser. This can be used to keep track of the incoming resources without it blocking
the processing of the response. As it is called after the entire process it also allows us to track the response body.

#### websiteHasFirstPartyInteraction(url)

Callback after a Domain has had a First-Party User Interaction.

Some Browsers have implemented rules that Cookies cannot be set for a Domain until a user has explicitly loaded that site (it can also impact things like referer headers). This was put in place to avoid the technique to redirect a user through an ad tracking network as a way to set tracking cookies. To properly simulate cookies and headers, this method will help identify when a browser considers a Domain to have received first party interaction.

- url: `URL`. The page that has been interacted with.
