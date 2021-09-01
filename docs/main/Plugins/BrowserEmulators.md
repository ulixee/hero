# Browser Emulators

> BrowserEmulators are a special class of core plugins that help Hero disguise itself as different browsers.

The biggest difference that BrowserEmulators have over standard CorePlugins is that only a single instance is ever run within a session -- i.e. you cannot use two BrowserEmulators within the same session. In addition, the Browser Emulator is always run before any standard Core Plugins, and as such, the Browser Emulator is responsible for choosing which browser engine to use (i.e., Chrome 88 vs Chrome 91).

ADVICE: Unless you have access to the exact data that a browser resembles, it's recommended that you extend `@ulixee/default-browser-emulator` with additional overrides.

## Special Class Properties

BrowserEmulators have all the same class properties as core plugins, with one significant change, the type property` must always be set to `CorePlugin:BrowserEmulator` instead of just `CorePlugin`: 

### BrowserEmulator.type *required*
This tells Hero the plugin is a special BrowserEmulator.
#### **Type**: `string`. This must always be set to `'CorePlugin:BrowserEmulator'`.

## Special Class Methods

BrowserEmulators require a method that receives a userAgentSelector and returns browser engine meta (user agent details + browser engine).

### selectBrowserMeta<em>(userAgentSelector)</em> *required*

See @ulixee/default-browser-emulator for an implementation example.

#### **Returns** `SelectBrowserMeta`

### onBrowserWillLaunch<em>(browserEngine, launchSettings)</em> *optional*

This is called every time a new browser engine is started, which may not be every session. A single browser engine is used across multiple sessions through isolated tabs.

#### **Returns** `Promise<Object>`
- showBrowser: boolean
- disableGpu: boolean
- disableDevtools: boolean

## Special Instance Properties

Browser Emulators require a few extra properties than standard Core Plugins. These are all related to the browser engine selected by the emulator. See `@ulixee/default-browser-emulator` for an implementation example.

### browserName *required*
#### **Type**: `string`.

### browserVersion *required*
#### **Type**: `Version`.

### operatingSystemPlatform *required*
#### **Type**: `string`.

### operatingSystemName *required*
#### **Type**: `string`.

### operatingSystemVersion *required*
#### **Type**: `Version`.

### userAgentString *required*
#### **Type**: `string`.
