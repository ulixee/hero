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
We've included three human emulator plugins to get you started. They are pre-loaded into the HumanEmulators registry and are ready to use.

<p class="show-table-header"></p>

| ID | Description |
| --- | --- |
| basic | It's the most basic of human-like interactions. |
| ghost | It's our most advanced emulator - types at 34 words per minute, moves mouse in loops and scrolls like a human. It's also our slowest emulator. <br/><br/> NOTE: If you need speed over evasion, use one of the simpler ones. |
| skipper | It's an anti-human-emulator with no delays. It just runs the commands. |

Note: Use the `skipper` emulator when you want to turn OFF human-emulator functionality. It disables all emulator effects, allowing you to run mouse and keyboard commands as if there were no human translation layer.

To use a specific emulator, pass your chosen ID into `handler.createAgent({ humanEmulatorId... )`:

```js
const { Handler } = 'secret-agent';

(async () => {
  const handler = new Handler();
  const agent = await handler.createAgent({ 
    humanEmulatorId: 'basic' 
  });
})();
```

## Building Your Own Plugins
Documentation coming soon.
