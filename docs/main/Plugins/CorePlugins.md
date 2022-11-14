# Core Plugins

> Core plugins extend Hero's backend functionality at the Core level. These plugins have full control over TCP fingerprinting, header order, HTML rendering, audio codecs and thousands of other variables that allow undetectable emulation of any browser you desire.

## Creating Your Own Core Plugin

Adding a new plugin is as simple as creating a javascript class with the correct properties and methods, then registering it with `hero.use()`.

We recommend using the CorePlugin base class provided by `@ulixee/hero-plugin-utils`, which handles setting most of the required properties and methods, everything except the static `id` property. Here's a simple plugin that adds a single hello() method to hero, which outputs to the browser's console.

```javascript
import { ClientPlugin, CorePlugin } from '@ulixee/hero-plugin-utils';

export class ClientHelloPlugin extends ClientPlugin {
  static readonly id = 'hello-plugin';

  onHero(hero, sendToCore) {
    hero.hello = async (name) => await sendToCore('hello-plugin', name);  
  } 
}

export class CoreHelloPlugin extends CorePlugin {
  static readonly id = 'hello-plugin';

  onClientCommand({ page }, name) {
    `Hello ${name}`);
  }
}
```

As shown above, you can export multiple plugins from the same file. Also a client/core plugin combination can share the same `id` (unlike two core plugins, which must each have unique ids).

To register this plugin in Hero, just pass it to `hero.use()`. In the following example we pass through a path to the plugin file instead of the plugin class itself -- we're doing this because by default Core runs in a separate process from Client.

```javascript
import hero from '@ulixee/hero';

hero.use(require.resolve('./HelloPlugin'));

await hero.hello('World');
```

NOTE: you can also register a plugin "directly" in Hero-Core. You do need to understand the [Client vs Core](/docs/hero/advanced-concepts/client-vs-core) separation. Wherever your `Core` process is going to be initialized, you can add code to tap into `@ulixee/hero-core`.

```javascript
import HeroCore from '@ulixee/hero-core';
import CorePlugin from './HelloPlugin'

// run before main code (or during initialization)
HeroCore.use(CorePlugin);

(function main() { // your code here
```

The rest of this page documents the various functionalities you can add to your class.

## Constructor

### new CorePlugin<em>(createOptions)</em>

New instance of CorePlugin is created for every hero instance. The createOptions object has three properties.

#### **Arguments**:

- createOptions `object` Receives the following:
  - userAgentOption `UserAgentOption`. An object containing various attributes of the chosen userAgent (name, version, etc).
  - browserEngine `BrowserEngine`. An instance containing the current BrowserEngine.
  - plugins `Plugins`. An instance containing the current instance of Plugins attached to this session.
  - logger `BoundLog`. An instance of logger you can use to log output.

## Class Properties

### CorePlugin.id _required_

This should usually be set to the plugin's npm package name.

#### **Type**: `string`

### CorePlugin.type _required_

This tells Hero that the plugin is a CorePlugin. It must always be set.

#### **Type**: `string`. This must always be set to `'CorePlugin'`.

## Instance Method Hooks

The following methods are optional. Add them to your plugin as needed. 

NOTE: Many of these API calls allow you to tap into the underlying [Unblocked Plugin](https://github.com/ulixee/unblocked/main/tree/plugins) Specification ([spec](https://github.com/ulixee/unblocked/main/tree/specification)). You can find detailed documentation in the two projects listed above.

### configure<em>(config)</em>

This hook is called during the initialization of a session/browserEmulator.

#### **Arguments**:

- config `object` Receives any (or none) of the following:
  - viewport `Viewport`. This is an object containing browser width and height as well as screenWidth and screenHeight, among other properties.
  - geolocation `Geolocation`. This is an object containing longtitude and latitude, among other properties.
  - timezoneId `string`. The configured unicode TimezoneId or host default (eg, America/New_York).
  - locale `string`. The configured locale in use (eg, en-US).
  - upstreamProxyUrl `string`. A socks5 or http proxy url (and optional auth) to use for all HTTP requests in this session. See Hero constructor for details.
  - upstreamProxyIpMask `object`. Optional settings to mask the Public IP Address of a host machine when using a proxy. See Hero constructor for details.
  - dnsOverTlsProvider `object`. Configure the host and port to use for DNS over TLS. See Hero constructor for details.

Modify any value in the object to change it session-wide.

#### **Returns** `void`

### onNewBrowser<em>(browser, launchArgs)</em> *optional*

This is called every time a new browser engine is started, which may not be every session. A Core Plugin can add to the launch arguments that will sent to the process creation of the browser:
- For Chrome, a list can be found [here](https://peter.sh/experiments/chromium-command-line-switches/)

#### **Arguments**:

- browser `IBrowser`. The Agent browser. Arguments can be manipulated on the `engine.launchArguments` property.
- launchArgs `IBrowserLaunchArgs`. Additional options provided to launch this instance.
  - showChrome: `boolean` - has the user requested to show the browser
  - disableGpu: `boolean` - has the user requested to disable the gpu
  - disableDevtools: `boolean` - has the user requested to disable automatically showing devtools

#### **Returns** `Promise` | `void`

### onClientCommand<em>(meta, ...args)</em> _optional_

This method is called every time a ClientPlugin calls sendToCore to this plugin's ID.

#### **Arguments**:

- meta `OnClientCommandMeta`. 
  - page `IPage`. The given Unblocked Agent `Page`.
  - frame `IFrame`. The given Unblocked Agent `Frame` if applicable.
- args: `any[]`. Whatever args the ClientPlugin passed through sendToCore.

#### **Returns** `Promise` | `void`

### onDnsConfiguration<em>(settings: IDnsSettings)</em>

Configures the DNS over TLS connection that Chrome defaults to using if your DNS provider supports it.

#### **Returns** `Promise` | `void`

### onTcpConfiguration<em>(settings: ITcpSettings)</em>

Some Tcp settings vary based on the Operating System making http requests.
Current supports:

- `windowSize`
- `ttl`

Alter the object's values to change session-wide.

#### **Returns** `Promise` | `void`

### onTlsConfiguration<em>(settings: ITlsSettings)</em>

Emulate the ClientHello signature, which can vary between browser versions

#### **Returns** `Promise` | `void`

### onHttp2SessionConnect<em>(request: IHttpResourceLoadDetails, settings: IHttp2ConnectSettings)</em>

A callback is provided for each HTTP2 Session that is created allowing you to customize the initial SETTINGS and WINDOW_UPDATE frames.

Current Supports
- `settings`. Http2RequestSettings using keys from Node.js settings (https://nodejs.org/api/http2.html#http2_settings_object)
- `localWindowSize`. A value to trigger a WINDOW_UPDATE frame with the initial connect.

Alter the object's values per Http2 Session.

#### **Returns** `Promise` | `void`

### beforeHttpRequest<em>(request: IHttpResourceLoadDetails)</em>

A callback is provided for each HTTP request where you are given the opportunity to re-order, re-case, and add or remove headers so that they resemble real browser requests. Headless Chrome is known to provide headers is different order on occasion from headed. See [https://github.com/ulixee/double-agent](https://github.com/ulixee/double-agent) for details.

#### **Returns** `Promise` | `void`

### beforeHttpResponse<em>(resource: IHttpResourceLoadDetails)</em>

Callbacks on each cookie set, and to return the valid list of cookies. This callback can be used to simulate cookie behavior that varies from the underlying browser - for instance Safari 13.

#### **Returns** `Promise` | `void`

### onNewPage<em>(page: IPage)</em>

This is called every time a new page/iframe is loaded. Use this hook to modify the DOM environment (i.e., to emulate various browser features) before a website loads.

#### **Returns** `Promise`

### onNewWorker<em>(worker: IWorker)</em>

This is called every time a new worker is loaded within a page. Use this hook to modify the DOM environment (i.e., to emulate various browser features) before a website loads.

#### **Returns** `Promise`

### websiteHasFirstPartyInteraction<em>(url: URL)</em>

Callback to indicate a domain has "first-party" interaction. Some browsers, like Safari 13.1, started granting cookie storage to websites only after a user has directly interacted with them.

#### **Returns** `Promise` | `void`

### playInteractions<em>(interactions, runFn, helper)</em>

Use this method if you want to change the speed or randomness of user Interactions (mouse movements, typing, etc).

#### **Returns** `Promise`

### adjustStartingMousePoint<em>(point, helper)</em>

This is used within Core to start the mouse Interactions correctly.

#### **Returns** `Promise`
