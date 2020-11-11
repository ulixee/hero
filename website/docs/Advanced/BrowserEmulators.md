# BrowserEmulators

> BrowserEmulators are plugins that help SecretAgent disguise itself as different browsers. Changing the user-agent header is barely the beginning. BrowserEmulators have full control over TCP fingerprinting, header order, HTML rendering, audio codecs and thousands of other variables that allow undetectable emulation of any browser you desire.

This interface helps you load and retrieve BrowserEmulator plugins. It in itself is not a plugin, however we have preloaded it with several plugins (see below).

This class creates no instances. It is a static singleton containing three methods.

NOTE: each BrowserEmulator will download its own rendering engine as needed. To override installing, you can use environmental variables to use a pre-installed version - ie, for use in a docker. Variables follow the pattern `<Uppercase Short Id>_BIN` (all upper case, dashes as underscores). For example, Chrome 83 is: CHROME_83_BIN.

## Methods

### BrowserEmulators.get<em>(emulatorId)</em>

Retrieve a specific browser emulator from the list of loaded emulators.

#### **Arguments**:

- emulatorId `string`

#### **Returns** `IBrowserEmulator`

### BrowserEmulators.getRandom<em>()</em>

Retrieve a random browser emulator from the list of loaded emulators.

#### **Returns** `IBrowserEmulator`

### BrowserEmulators.load<em>(BrowserEmulatorClass)</em>

Load a browser emulator into your environment.

#### **Arguments**:

- BrowserEmulatorClass `IBrowserEmulatorClass`. A class implementing the BrowserEmulatorClass specification.

#### **Returns** `null`

## Preloaded Plugins

We've included a few browser emulators to get you started. These plugins are pre-loaded into the BrowserEmulators interface, and together they represent 70% of the browser market.

<p class="show-table-header"></p>

| Name      | NPM Package Name                | Short ID  |
| --------- | ------------------------------- | --------- |
| Safari 13 | @secret-agent/emulate-safari-13 | safari-13 |
| Chrome 80 | @secret-agent/emulate-chrome-80 | chrome-80 |
| Chrome 83 | @secret-agent/emulate-chrome-83 | chrome-83 |

Note: You can use the full NPM Package Name or Short ID to reference the browser emulator you want when calling `new SecretAgent()`.

For example, here's how to use chrome-80:

```js
const SecretAgent = 'secret-agent';

(async () => {
  const agent = await new SecretAgent({ browserEmulatorId: 'chrome-80' });
})();
```

## Building Your Own Emulator

An emulator configures settings along the spectrum of settings that can impact an http session.

ADVICE: Unless you have access to the exact data that a browser resembles, it's recommended that you extend existing plugins with additional overrides.

#### TCP settings

Some Tcp settings vary based on the Operating System making http requests.
Current supports:

- `windowSize`
- `ttl`

#### TLS ClientHello

Emulate the ClientHello signature, which can vary between browser versions

#### Dns over Tls Provider

Configures the DNS over Tls connection that Chrome defaults to using if your DNS provider supports it.

#### Sockets Per Origin

Configures the number of sockets per origin that should be allocated.

#### HTTP Request Headers

A callback is provided for each HTTP request where you are given the opportunity to re-order, re-case, and add or remove headers so that they resemble real browser requests. Headless Chrome is known to provide headers is different order on occasion from headed. See [https://github.com/ulixee/double-agent](https://github.com/ulixee/double-agent) for details.

#### HTTP Cookies

Callbacks on each cookie set, and to return the valid list of cookies. This callback can be used to simulate cookie behavior that varies from the underlying browser - for instance Safari 13.

#### HTTP Origin First Party Interaction

Callback to indicate a domain has "first-party" interaction. Some browsers, like Safari 13.1, started granting cookie storage to websites only after a user has directly interacted with them.

#### New Document Injected Scripts

Browser Emulators provide a way to configure 1 or more script to be run on each new document and iframe. The scripts are used to override, add and remove properties and functions that differ in headless vs headed browsers.

To "add" overrides that are missing from the DOM, it's recommended that your fork and edit existing BrowserEmulators, or extend an existing one. We've structured the included Browser emulators so that you can quickly see what has been overridden, and you can override the `loadDomOverrides` function as below to add additional overrides.

```js
  protected loadDomOverrides() {
    const domOverrides = this.domOverrides;

    domOverrides.add('Error.captureStackTrace');
    domOverrides.add('Error.constructor');

    domOverrides.add('navigator.webdriver');
    ...
  }
```

## DOM Manipulation Methods

A DOM override itself has access to 3 primary "Proxy" functions to invisibly override functionality:

### proxyFunction\*(targetObject, functionName, overrideFn, overrideOnlyForInstance)

This function overrides a function and correctly masks the changed `toString` signature.

#### **Arguments**:

- targetObject `object`. The containing object, function or prototype.
- functionName `string`. A function defined on the targetObject (or prototype hierarchy).
- overrideFn `Function`. A callback function adhering to the `ProxyHandler.apply` specification for the given function. If you return `ProxyOverride.callOriginal` from this function, it will default to calling the native function. You might do this, for instance, to trigger built-in errors in the case where parameters are invalid, or you only wish to override for a select set of parameters.
- overrideOnlyForInstance `boolean` (default `false`). A property indicating that this override only applies to the `targetObject` instance.

### proxyGetter\*(targetObject, propertyName, overrideFn, overrideOnlyForInstance)

This function overrides a property getter and correctly masks the changed `toString` signature.

#### **Arguments**:

- targetObject `object`. The containing object, function or prototype.
- propertyName `string`. A property defined on the targetObject (or prototype hierarchy).
- overrideFn `Function`. A callback function adhering to the `ProxyHandler.apply` specification for the given getter. If you return `ProxyOverride.callOriginal` from this function, it will default to calling the native function.
- overrideOnlyForInstance `boolean` (default `false`). A property indicating that this override only applies to the `targetObject` instance.

### proxySetter\*(targetObject, propertyName, overrideFn, overrideOnlyForInstance)

This function overrides a property setter and correctly masks the changed `toString` signature.

#### **Arguments**:

- targetObject `object`. The containing object, function or prototype.
- propertyName `string`. A property defined on the targetObject (or prototype hierarchy).
- overrideFn `Function`. A callback function adhering to the `ProxyHandler.apply` specification for the given getter. If you return `ProxyOverride.callOriginal` from this function, it will default to calling the native function.
- overrideOnlyForInstance `boolean` (default `false`). A property indicating that this override only applies to the `targetObject` instance.
