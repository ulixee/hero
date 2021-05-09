# HumanEmulators

> HumanEmulators are plugins that sit between your script and SecretAgent's mouse/keyboard movements. They translate your clicks and moves into randomized human-like patterns that can pass the bot-blocker checks.

This interface helps you load and retrieve HumanEmulator plugins. It in itself is not a plugin, however we have preloaded it with a basic plugin (see below).

This class creates no instances. It is a static singleton containing three methods.

## Methods

### HumanEmulators.get<em>(emulatorId)</em>
Retrieve a specific human emulator from the list of plugins already been loaded.
#### **Arguments**:
- emulatorId `string`
#### **Returns** `IHumanEmulator`

### HumanEmulators.getRandom<em>()</em>
Retrieve a random human emulator from the list of plugins already loaded.
#### **Returns** `IHumanEmulator`

### HumanEmulators.load<em>(humanEmulator)</em>
Load a human emulator into your environment.
#### **Arguments**:
- humanEmulator `IHumanEmulator`
#### **Returns** `null`

## Preloaded Plugins
We've included a default-human-emulator plugin to get you started. It's pre-loaded into Core is ready to use.

To use a specific emulator, pass your chosen ID into `handler.createAgent({ humanEmulatorId... )`:

```js
const { Handler } = 'secret-agent';

(async () => {
  const handler = new Handler();
  const agent = await handler.createAgent({ 
    humanEmulatorId: 'default-human-emulator' 
  });
})();
```

## Building Your Own Plugins
Documentation coming soon.
