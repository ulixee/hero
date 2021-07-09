# Core Plugins

> Core plugins extend SecretAgent's backend functionality at the Core level. These plugins have full control over TCP fingerprinting, header order, HTML rendering, audio codecs and thousands of other variables that allow undetectable emulation of any browser you desire.

## Creating Your Own Core Plugin


Adding a new plugin is as simple as creating a javascript class with the correct properties and methods, then registering it with `agent.use()`.

We recommend using the CorePlugin base class provided by @secret-agent/plugin-utils, which handles setting most of the required properties and methods, everything except the static `id` property. Here's a simple plugin that adds a single hello() method to agent, which outputs to the browser's console.

```javascript
import { ClientPlugin, CorePlugin } from '@secret-agent/plugin-utils';

export class ClientHelloPlugin extends ClientPlugin {
  static readonly id = 'hello-plugin';

  onAgent(agent, sendToCore) {
    agent.hello = async (name) => await sendToCore('hello-plugin', name));  
  } 
}

export class CoreHelloPlugin extends CorePlugin {
  static readonly id = 'hello-plugin';

  onClientCommand({ puppetPage }, name) {
    `Hello ${name}`);
  } 
}
```

As shown above, you can export multiple plugins from the same file. Also a client/core plugin combination can share the same `id` (unlike two core plugins, which must each have unique ids).

To register this plugin in SecretAgent, just pass it to `agent.use()`. In the following example we pass through a path to the plugin file instead of the plugin class itself -- we're doing this because by default Core runs in a separate process from Client.  

```javascript
import agent from 'secret-agent';

agent.use(require.resolve('./HelloPlugin'));

await agent.hello('World');
```

The rest of this page documents the various functionalities you can add to your class.

## Constructor

### new CorePlugin<em>(createOptions)</em>
New instance of CorePlugin is created for every agent instance. The createOptions object has three properties.

#### **Arguments**:

- createOptions `object` Receives the following:
  - userAgentOption `UserAgentOption`. An object containing various attributes of the chosen userAgent (name, version, etc).
  - browserEngine `BrowserEngine`. An instance containing the current BrowserEngine.
  - plugins `Plugins`. An instance containing the current instance of Plugins attached to this session.
  - logger `BoundLog`. An instance of logger you can use to log output.

## Class Properties

### CorePlugin.id *required*
This should usually be set to the plugin's npm package name.
#### **Type**: `string`

### CorePlugin.type *required*
This tells SecretAgent that the plugin is a CorePlugin. It must always be set.
#### **Type**: `string`. This must always be set to `'CorePlugin'`.


## Instance Method Hooks
The following methods are optional. Add them to your plugin as needed.

### configure<em>(config)</em>

This hook is called during the initialization of a session/browserEmulator as well as every time agent.configure is called from the client. 

#### **Arguments**:

- config `object` Receives any (or none) of the following:
  - viewport `Viewport`. This is an object containing browser width and height as well as screenWidth and screenHeight, among other properties.
  - geolocation `Geolocation`. This is an object containing longtitude and latitude, among other properties.  
  - timezoneId `string`. The configured unicode TimezoneId or host default (eg, America/New_York).
  - locale `string`. The configured locale in use (eg, en-US).

Modify any value in the object to change it session-wide.

#### **Returns** `void`

### onClientCommand<em>(meta, ...args)</em> *optional*
This method is called every time a ClientPlugin calls sendToCore to this plugin's ID.

#### **Arguments**:
- meta `OnClientommandMeta`. This object currently has a single property - puppetPage.
- args: `any[]`. Whatever args the ClientPlugin passed through sendToCore.

#### **Returns** `Promise`

### onDnsConfiguration<em>(settings: IDnsSettings)</em>

Configures the DNS over TLS connection that Chrome defaults to using if your DNS provider supports it.

#### **Returns** `Promise`

### onTcpConfiguration<em>(settings: ITcpSettings)</em>

Some Tcp settings vary based on the Operating System making http requests.
Current supports:

- `windowSize`
- `ttl`

Alter the object's values to change session-wide.

#### **Returns** `Promise`

### onTlsConfiguration<em>(settings: ITlsSettings)</em>

Emulate the ClientHello signature, which can vary between browser versions

#### **Returns** `Promise`

### beforeHttpRequest<em>(request: IHttpResourceLoadDetails)</em>

A callback is provided for each HTTP request where you are given the opportunity to re-order, re-case, and add or remove headers so that they resemble real browser requests. Headless Chrome is known to provide headers is different order on occasion from headed. See [https://github.com/ulixee/double-agent](https://github.com/ulixee/double-agent) for details.

#### **Returns** `Promise`

### beforeHttpResponse<em>(resource: IHttpResourceLoadDetails)</em>

Callbacks on each cookie set, and to return the valid list of cookies. This callback can be used to simulate cookie behavior that varies from the underlying browser - for instance Safari 13.

#### **Returns** `Promise`

### onNewPuppetPage<em>(page: IPuppetPage)</em>
This is called every time a new page/iframe is loaded. Use this hook to modify the DOM environment (i.e., to emulate various browser features) before a website loads.

#### **Returns** `Promise`

### onNewPuppetWorker<em>(worker: IPuppetWorker)</em>

This is called every time a new worker is loaded within a page. Use this hook to modify the DOM environment (i.e., to emulate various browser features) before a website loads.

#### **Returns** `Promise`

### websiteHasFirstPartyInteraction<em>(url: URL)</em>

Callback to indicate a domain has "first-party" interaction. Some browsers, like Safari 13.1, started granting cookie storage to websites only after a user has directly interacted with them.

#### **Returns** `Promise`

### playInteractions<em>(interactions, runFn, helper)</em>

Use this method if you want to change the speed or randomness of user Interactions (mouse movements, typing, etc).

#### **Returns** `Promise`
  
### getStartingMousePoint<em>(helper)</em>

This is used within Core to run the mouse Interactions correctly.

#### **Returns** `Promise`
