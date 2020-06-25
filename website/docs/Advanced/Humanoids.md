# Humanoids

> Humanoids are plugins that sit between your script and SecretAgent's mouse/keyboard movements. They translate your clicks and moves into randomized human-like patterns that can pass the bot-blocker checks.

This interface helps you load and retrieve humanoid plugins. It in itself is not a plugin, however we have preloaded it with a basic plugin (see below).

This class creates no instances. It is a static singleton containing three methods.

## Methods

### Humanoids.get<em>(humanoidId)</em>
Retrieve a specific humanoid from the list of plugins already been loaded.
#### **Arguments**:
- humanoidId `string`
#### **Returns** `HumanoidPlugin`

### Humanoids.getRandom<em>()</em>
Retrieve a random humanoid from the list of plugins already loaded.
#### **Returns** `HumanoidPlugin`

### Humanoids.load<em>(humanoid)</em>
Load a 3rd party humanoid into your environment.
#### **Arguments**:
- humanoid `HumanoidPlugin`
#### **Returns** `null`

## Preloaded Plugins
We've included two very simple humanoid plugins to get you started. They are pre-loaded into the Humanoids interface and are ready to use.

<p class="show-table-header"></p>

| ID | Description |
| --- | --- |
| basic | It's the most basic of human-like interactions. |
| skipper | It's an anti-humanoid with no delays. It just runs the commands. |

Note: Use the `skipper` plugin when you want to turn OFF humanoid functionality. It disables all humanoid affects allowing you to run mouse and keyboard commands as if there were no human translation layer.

To use a specific emulator, pass your chosen ID into `createBrowser`:

```js
const SecretAgent = 'secret-agent';

(async () => {
  const browser = await SecretAgent.createBrowser({ humanoidId: 'basic' });
})();
````

## Building Your Own Plugins
Documentation coming soon.
