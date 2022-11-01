# Pool

A Pool is an Unblocked Agent utility to share Chrome browser processes across 1+ Agent instances. It does this by re-using Chrome engines whenever they overlap client requests, and creating Incognito Windows for each individual Agent instance.

A Pool can also throttle requests so that many concurrent Chrome instances and Windows don't freeze up all the system resources.

```js
const { Pool } = require('@unblocked-web/agent');

(async () => {
  const pool = new Pool({ maxConcurrentAgents: 2 });
  const agent1 = pool.createAgent();
  const page1 = await agent1.newPage();

  const agent2 = pool.createAgent();
  const page2 = await agent2.newPage();

  const agent3 = pool.createAgent();
  const page3 = await agent3.newPage(); // hangs waiting to for availability.
})();
```

## Constructor

### new Pool*(options)* {#constructor}

Creates a new pool.

#### **Arguments**:

- options `object` Accepts any of the following:
  - maxConcurrentAgents `number` Optional maximum concurrent [Agents](./Agent.md), which could be Incognito Windows, or multiple [Browsers](./Browser.md) if each Agent requests a different configuration. Defaults to `10`.
  - certificateStore `ICertificateStore` Optional caching layer to store and retrieve certificates.
  - dataDir `string` Optional directory to store/retrieve the Certificate Base Authority and Private Key.
  - defaultBrowserEngine `IBrowserEngine` Optional default [BrowserEngine](./BrowserEngine.md) to launch new Agents with if none is specified.
  - plugins `IUnblockedPluginClass[]` Optional list of [Unblocked Plugins](https://github.com/ulixee/unblocked/main/tree/specification/plugin/IUnblockedPlugin.ts) classes (`IUnblockedPluginClass`). These plugins will be installed into all hooks for the agent.
  - logger `IBoundLog` Optional logger.

## Properties

- hasAvailability `boolean` Is there availability for more Agents.
- activeAgentsCount `number` Agents actively running.
- maxConcurrentAgents `number` Configured max concurrent Agents.
- browsersById `Map<string, Browser>` Map of all created [Browsers](Browser.md) by id.
- agentsById `Map<string, Agent>` Map of all created [Agents](Agent.md) by id.
- sharedMitmProxy: `MitmProxy` The Browser-level MitmProxy used for Certificate Generation and non-incognito Mitm proxying.
- plugins `IUnblockedPluginClass[]` All installed UnblockedPluginClasses. You can manipulate this list to change the activate PluginClasses for future Agents.

## Methods

### pool.start(): Promise<void>

Opens the Pool and starts the `sharedMitmProxy`.

### pool.waitForAvailability(agent): Promise<void>

Waits for an available "Agent" slot. Returns once the given Agent is allowed to call `agent.open()`. The Pool will subscribe to the Agent closing to make this slot re-available. You will not normally used this method directly.

#### **Arguments**

-agent [Agent](./Agent.md) - request Agent availability.

### pool.close()

Shut down the Pool, all Agents and Mitm services.

#### **ReturnType**: void

### pool.hook(hooks)

Adds hooks to the Plugins.

#### **ReturnType**: void

## Events

### agent-created `{ agent: Agent }`

Emitted when a new Agent is created (not necessarily opened).

### browser-launched `{ browser: Browser }`

Emitted when new Browsers are launched in this Pool.

### browser-has-no-open-windows `{ browser: Browser }`

Emitted when new a Browser has no more open Windows. This might be used to trigger an automatic Browser close.

### all-browsers-closed `void`

Emitted when all Pool Browsers are now closed. This might be used to trigger an automatic shutdown.
