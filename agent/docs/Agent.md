# Agent

This is the primary class to interact with Unblocked Agent. The following is a simple example:

```js
const { Agent } = require('@ulixee/unblocked-agent');

(async () => {
  const agent = new Agent();
  const page = await agent.newPage();
  await page.goto('https://example.org/');
  // ... other actions
  await agent.close();
})();
```

An Agent instance can be thought of as a single user-browsing session. Each instance you create has the following attributes:

#### Lightweight

Instances are very lightweight, built to share a pool of browsers underneath.

#### Sandboxed

Each Agent instance creates a private environment with its own cache, cookies, session data and network stack.. No data is shared between instances -- each operates within an airtight sandbox to ensure no identities leak across requests.

#### Pluggable

Each Agent implements the full Unblocked [Plugin Specification](https://github.com/ulixee/hero/tree/main/specification/plugin) allowing developer control along the full spectrum of web scraping sessions.

## Constructor

### new Agent*(options)* {#constructor}

Creates a new sandboxed browser window. An Agent wires together an isolated Browser Context and a Man-in-the-Middle session. It will create a [Plugins](./Plugins.md) context that implements the Unblocked Plugin specification.

```js
const Agent = require('@ulixee/agent');

(async () => {
  const agent = new Agent({
    locale: 'en-US,en',
    plugins: [LocalePlugin], // add plugins that implement locale!
  });
})();
```

#### **Arguments**:

- options `IAgentCreateOptions`:
  - id `string` Optional id to track unique logs for this entry
  - browserEngine `IBrowserEngine` - A [BrowserEngine](./BrowserEngine.md) to launch.
  - plugins `IUnblockedPluginClass[]` - A list of [Plugins](https://github.com/ulixee/hero/tree/main/specification/plugin/IUnblockedPlugin.ts) classes (`IUnblockedPluginClass`). These plugins will be installed into all hooks for the agent.
  - userAgentOptions `IUserAgentOptions` An optional object describing the operating system and browser version that should be emulated by any installed Unblocked Plugins.
  - commandMarker `ICommandMarker` An optional module to track the markers between operations (ie, waitForLocation, interact, etc).
  - options `IEmulationOptions` An optional configuration accepting all [EmulationProfile](https://github.com/ulixee/hero/tree/main/specification#emulation-profile) settings.

## Properties

- browserContext [`BrowserContext`](./BrowserContext.md) The BrowserContext (once opened).
- mitmRequestSession [`RequestSession`](./Man-in-the-Middle.md) The Man-in-the-middle Request Session.

## Methods

### agent.close()

Shut down the agent and services.

#### **ReturnType**: void

### agent.hook(hooks)

Adds hooks to the Plugins.

#### **ReturnType**: void

### agent.newPage()

Opens the BrowserContext (if necessary) and opens a new page.

#### **ReturnType**: Promise<[`Page`](./Page.md)>

### agent.open()

Opens the BrowserContext.

#### **ReturnType**: Promise<[`BrowserContext`](./BrowserContext.md)>

## Events

### close

Emitted when the agent closes
