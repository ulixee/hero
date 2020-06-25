# Emulators

> Emulators are plugins that help SecretAgent disguise itself as different browsers. Changing the user-agent header is barely the beginning. Emulators have full control over TCP fingerprinting, header order, audio codexes and thousands of other variables that allow undetectable emulation of any browser you desire.

This interface helps you load and retrieve emulator plugins. It in itself is not a plugin, however we have preloaded it with several plugins (see below).

This class creates no instances. It is a static singleton containing three methods.

## Methods

### Emulators.get<em>(emulatorId)</em>

Retrieve a specific emulator from the list of plugins already been loaded.

#### **Arguments**:

- emulatorId `string`

#### **Returns** `EmulatorPlugin`

### Emulators.getRandom<em>()</em>

Retrieve a random emulator from the list of plugins already loaded.

#### **Returns** `EmulatorPlugin`

### Emulators.load<em>(emulator)</em>

Load a 3rd party emulator into your environment.

#### **Arguments**:

- emulator `EmulatorPlugin`

#### **Returns** `null`

## Preloaded Plugins

We've included a few emulator plugins to get you started. These plugins are pre-loaded into the Emulators interface, and together they represent 70% of the browser market.

<p class="show-table-header"></p>

| Name                          | ID                        |
| ----------------------------- | ------------------------- |
| Safari 13 for Mac             | safari-13-for-mac         |
| Chrome 79 for Windows and Mac | chrome-79-for-win-and-mac |
| Chrome 80 for Windows and Mac | chrome-80-for-win-and-mac |

To use a specific emulator, pass your chosen ID into `createBrowser`:

```js
const SecretAgent = 'secret-agent';

(async () => {
  const browser = await SecretAgent.createBrowser({ emulatorId: 'chrome79' });
})();
```

## Building Your Own Plugin

Documentation coming soon.
