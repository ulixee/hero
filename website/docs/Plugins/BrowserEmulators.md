# Browser Emulators

> BrowserEmulators are a special class of core plugins that help SecretAgent disguise itself as different browsers.

An emulator configures settings along the spectrum of settings that can impact an http session.

ADVICE: Unless you have access to the exact data that a browser resembles, it's recommended that you extend `@secret-agent/default-browser-emulator` with additional overrides.

## Special Class Properties

BrowserEmulators have all the same class properties as core plugins, with one significant change, the value of type: 

### BrowserEmulator.type *required*
This tells SecretAgent that the plugin is a special BrowserEmulator. It must always be set.
#### **Type**: `string`. This must always be set to `'CorePlugin:BrowserEmulator'`.

## Special Class Methods

### selectBrowserMeta<em>(userAgentSelector)</em> *required*

#### **Returns** `SelectBrowserMeta`

### onBrowserWillLaunch<em>(browserEngine, launchSettings)</em> *optional*

{
  showBrowser?: boolean;
  disableGpu?: boolean;
  disableDevtools?: boolean;
}

#### **Returns** `Promise`

## Special Instance Properties

### browserName
#### **Type**: `string`.

### browserVersion;
#### **Type**: `Version`.

### operatingSystemPlatform
#### **Type**: `string`.

### operatingSystemName
#### **Type**: `string`.

### operatingSystemVersion
#### **Type**: `Version`.

### userAgentString
#### **Type**: `string`.
